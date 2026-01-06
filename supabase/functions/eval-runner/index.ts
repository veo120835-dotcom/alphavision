import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * EVAL RUNNER - Golden Dataset Testing Framework
 * Runs automated tests against predefined Q&A pairs to catch regressions
 * 
 * Evaluation Criteria:
 * - Accuracy: Does the response match expected answer semantically?
 * - Faithfulness: Does it only use information from context?
 * - Relevance: Does it directly address the question?
 * - Tone: Does it match expected brand voice?
 */

const EVALUATOR_PROMPT = `You are an AI response evaluator. Score the generated response against the expected answer.

SCORING CRITERIA (0-100 each):
1. ACCURACY: Does the response convey the same meaning as expected?
2. FAITHFULNESS: Does it avoid hallucination (making up facts)?
3. RELEVANCE: Does it directly answer the question asked?
4. TONE: Does it match the expected brand voice (Professional Maverick)?

OUTPUT FORMAT (JSON):
{
  "scores": {
    "accuracy": 0-100,
    "faithfulness": 0-100,
    "relevance": 0-100,
    "tone": 0-100
  },
  "overall": 0-100,
  "passed": boolean,
  "issues": ["list of specific issues found"],
  "reasoning": "explanation of the evaluation"
}`;

interface TestCase {
  id: string;
  name: string;
  input: string;
  context?: string;
  expectedOutput: string;
  agentType: 'orchestrator' | 'closer' | 'creator' | 'reflexion';
  passThreshold?: number;
  tags?: string[];
}

interface EvalRequest {
  organizationId: string;
  testCases?: TestCase[];
  runAll?: boolean;
  agentType?: string;
}

interface EvalResult {
  testId: string;
  testName: string;
  passed: boolean;
  scores: {
    accuracy: number;
    faithfulness: number;
    relevance: number;
    tone: number;
  };
  overall: number;
  generatedOutput: string;
  expectedOutput: string;
  issues: string[];
  duration: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organizationId, testCases, runAll = false, agentType }: EvalRequest = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get test cases from database if not provided
    let casesToRun: TestCase[] = testCases || [];
    
    if (runAll || (!testCases && agentType)) {
      const query = supabase
        .from('memory_items')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('type', 'eval_test_case');
      
      if (agentType) {
        query.contains('tags', [agentType]);
      }
      
      const { data } = await query;
      
      casesToRun = (data || []).map(item => ({
        id: item.id,
        name: item.title,
        ...item.content as Omit<TestCase, 'id' | 'name'>
      }));
    }

    if (casesToRun.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No test cases found',
        results: []
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Eval Runner: Running ${casesToRun.length} test cases`);
    
    const results: EvalResult[] = [];
    let passedCount = 0;

    for (const testCase of casesToRun) {
      const startTime = Date.now();
      
      try {
        // Step 1: Generate response from the agent
        const agentResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              ...(testCase.context ? [{ role: 'system', content: testCase.context }] : []),
              { role: 'user', content: testCase.input }
            ],
          }),
        });

        if (!agentResponse.ok) {
          throw new Error(`Agent API error: ${agentResponse.status}`);
        }

        const agentData = await agentResponse.json();
        const generatedOutput = agentData.choices?.[0]?.message?.content || '';

        // Step 2: Evaluate the response
        const evalResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              { role: 'system', content: EVALUATOR_PROMPT },
              { 
                role: 'user', 
                content: `QUESTION: ${testCase.input}

EXPECTED ANSWER:
"""
${testCase.expectedOutput}
"""

GENERATED ANSWER:
"""
${generatedOutput}
"""

Evaluate the generated answer against the expected answer.`
              }
            ],
            response_format: { type: "json_object" },
          }),
        });

        let evaluation;
        if (evalResponse.ok) {
          const evalData = await evalResponse.json();
          try {
            evaluation = JSON.parse(evalData.choices?.[0]?.message?.content || '{}');
          } catch {
            evaluation = { overall: 50, passed: false, issues: ['Failed to parse evaluation'] };
          }
        } else {
          evaluation = { overall: 0, passed: false, issues: ['Evaluation API error'] };
        }

        const threshold = testCase.passThreshold || 80;
        const passed = evaluation.overall >= threshold;
        
        if (passed) passedCount++;

        results.push({
          testId: testCase.id,
          testName: testCase.name,
          passed,
          scores: evaluation.scores || { accuracy: 0, faithfulness: 0, relevance: 0, tone: 0 },
          overall: evaluation.overall || 0,
          generatedOutput,
          expectedOutput: testCase.expectedOutput,
          issues: evaluation.issues || [],
          duration: Date.now() - startTime
        });

        console.log(`Test "${testCase.name}": ${passed ? 'PASSED' : 'FAILED'} (${evaluation.overall}/100)`);

      } catch (error) {
        results.push({
          testId: testCase.id,
          testName: testCase.name,
          passed: false,
          scores: { accuracy: 0, faithfulness: 0, relevance: 0, tone: 0 },
          overall: 0,
          generatedOutput: '',
          expectedOutput: testCase.expectedOutput,
          issues: [error instanceof Error ? error.message : 'Unknown error'],
          duration: Date.now() - startTime
        });
      }
    }

    // Store eval run in database
    await supabase.from('memory_items').insert({
      organization_id: organizationId,
      type: 'eval_run',
      title: `Eval Run ${new Date().toISOString()}`,
      content: {
        totalTests: casesToRun.length,
        passed: passedCount,
        failed: casesToRun.length - passedCount,
        passRate: Math.round((passedCount / casesToRun.length) * 100),
        results: results.map(r => ({
          testId: r.testId,
          testName: r.testName,
          passed: r.passed,
          overall: r.overall
        }))
      },
      tags: ['eval', agentType || 'all']
    });

    const summary = {
      success: true,
      totalTests: casesToRun.length,
      passed: passedCount,
      failed: casesToRun.length - passedCount,
      passRate: Math.round((passedCount / casesToRun.length) * 100),
      averageScore: Math.round(results.reduce((sum, r) => sum + r.overall, 0) / results.length),
      results
    };

    console.log(`Eval complete: ${passedCount}/${casesToRun.length} passed (${summary.passRate}%)`);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Eval runner error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
