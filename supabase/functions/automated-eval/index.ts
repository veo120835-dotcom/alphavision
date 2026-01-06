import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutomatedEvalRequest {
  organizationId: string;
  testType?: 'reflexion' | 'closer' | 'orchestrator' | 'all';
  limit?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organizationId, testType = 'all', limit = 10 }: AutomatedEvalRequest = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log(`[AUTOMATED EVAL] Running ${testType} tests for org ${organizationId}`);

    // Fetch golden dataset test cases
    let query = supabase
      .from('golden_dataset')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .limit(limit);

    if (testType !== 'all') {
      query = query.eq('test_type', testType);
    }

    const { data: testCases, error: fetchError } = await query;

    if (fetchError || !testCases?.length) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No test cases found',
        message: 'Add test cases to the golden_dataset table first'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];
    let passed = 0;
    let failed = 0;

    for (const testCase of testCases) {
      const startTime = Date.now();
      
      try {
        // Route to appropriate function based on test type
        let functionName = '';
        switch (testCase.test_type) {
          case 'reflexion':
            functionName = 'reflexion-engine';
            break;
          case 'closer':
            functionName = 'closer-agent';
            break;
          case 'orchestrator':
            functionName = 'swarm-orchestrator';
            break;
          default:
            continue;
        }

        // Execute the test
        const testResponse = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            organizationId,
            dryRun: true, // Always use dry run for tests
            ...testCase.input_data
          }),
        });

        const duration = Date.now() - startTime;
        const actualOutput = await testResponse.json();

        // Evaluate the output
        const evalResult = evaluateOutput(
          actualOutput, 
          testCase.expected_output, 
          testCase.quality_criteria
        );

        // Store eval result
        await supabase.from('eval_results').insert({
          organization_id: organizationId,
          eval_type: testCase.test_type,
          input_data: testCase.input_data,
          expected_output: testCase.expected_output,
          actual_output: actualOutput,
          score: evalResult.score,
          passed: evalResult.passed,
          error_message: evalResult.error,
          duration_ms: duration
        });

        if (evalResult.passed) {
          passed++;
        } else {
          failed++;
        }

        results.push({
          test_name: testCase.test_name,
          test_type: testCase.test_type,
          passed: evalResult.passed,
          score: evalResult.score,
          duration_ms: duration,
          details: evalResult.details
        });

      } catch (e) {
        failed++;
        results.push({
          test_name: testCase.test_name,
          test_type: testCase.test_type,
          passed: false,
          score: 0,
          error: e instanceof Error ? e.message : 'Test execution failed'
        });
      }
    }

    // Log summary
    await supabase.from('agent_execution_logs').insert({
      organization_id: organizationId,
      action_type: 'automated_eval',
      reasoning: `Ran ${testCases.length} tests: ${passed} passed, ${failed} failed`,
      action_details: {
        test_type: testType,
        total: testCases.length,
        passed,
        failed,
        pass_rate: testCases.length > 0 ? (passed / testCases.length * 100).toFixed(1) : 0
      },
      result: failed === 0 ? 'all_passed' : 'some_failed'
    });

    console.log(`[AUTOMATED EVAL] Complete: ${passed}/${testCases.length} passed`);

    return new Response(JSON.stringify({
      success: true,
      summary: {
        total: testCases.length,
        passed,
        failed,
        pass_rate: testCases.length > 0 ? (passed / testCases.length * 100).toFixed(1) + '%' : '0%'
      },
      results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Automated eval error:", e);
    return new Response(JSON.stringify({ 
      error: e instanceof Error ? e.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function evaluateOutput(
  actual: any, 
  expected: any, 
  criteria: any
): { passed: boolean; score: number; error?: string; details?: string[] } {
  const details: string[] = [];
  let score = 0;
  let checks = 0;

  try {
    // Check if response was successful
    if (actual.success === expected.success) {
      score += 1;
      details.push('✓ Success status matches');
    } else {
      details.push('✗ Success status mismatch');
    }
    checks++;

    // Check for errors
    if (actual.error && !expected.error) {
      details.push(`✗ Unexpected error: ${actual.error}`);
    } else if (!actual.error && expected.error) {
      details.push('✓ No error as expected');
      score += 1;
    }
    checks++;

    // Check custom criteria
    if (criteria) {
      if (criteria.must_contain) {
        const content = JSON.stringify(actual).toLowerCase();
        for (const term of criteria.must_contain) {
          if (content.includes(term.toLowerCase())) {
            score += 1;
            details.push(`✓ Contains: ${term}`);
          } else {
            details.push(`✗ Missing: ${term}`);
          }
          checks++;
        }
      }

      if (criteria.min_response_time_ms && actual.duration_ms) {
        if (actual.duration_ms <= criteria.min_response_time_ms) {
          score += 1;
          details.push(`✓ Response time OK: ${actual.duration_ms}ms`);
        } else {
          details.push(`✗ Response too slow: ${actual.duration_ms}ms`);
        }
        checks++;
      }
    }

    const normalizedScore = checks > 0 ? score / checks : 0;
    const passed = normalizedScore >= 0.7; // 70% threshold

    return { passed, score: normalizedScore, details };

  } catch (e) {
    return { 
      passed: false, 
      score: 0, 
      error: e instanceof Error ? e.message : 'Evaluation error',
      details 
    };
  }
}
