#!/usr/bin/env node

/**
 * Automated Reflexion Testing Script
 * 
 * Runs quality control tests against the golden dataset
 * and reports results for CI/CD pipeline.
 * 
 * Run with: npm run test:reflexion
 */

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function runReflexionTests() {
  console.log('🧪 Running Automated Reflexion Tests...\n');

  try {
    // Get all organizations to test (in production, you'd filter this)
    const orgsResponse = await fetch(`${SUPABASE_URL}/rest/v1/organizations?select=id,name&limit=5`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY
      }
    });

    const organizations = await orgsResponse.json();
    
    if (!organizations?.length) {
      console.log('⚠️ No organizations found to test');
      process.exit(0);
    }

    let totalPassed = 0;
    let totalFailed = 0;

    for (const org of organizations) {
      console.log(`\n📋 Testing organization: ${org.name || org.id}`);
      
      const evalResponse = await fetch(`${SUPABASE_URL}/functions/v1/automated-eval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({
          organizationId: org.id,
          testType: 'all',
          limit: 20
        })
      });

      const evalResult = await evalResponse.json();

      if (evalResult.success) {
        console.log(`   ✓ ${evalResult.summary.passed}/${evalResult.summary.total} tests passed (${evalResult.summary.pass_rate})`);
        totalPassed += evalResult.summary.passed;
        totalFailed += evalResult.summary.failed;

        // Show failed tests
        const failedTests = evalResult.results?.filter(r => !r.passed) || [];
        for (const fail of failedTests) {
          console.log(`   ❌ ${fail.test_name}: ${fail.error || 'Failed validation'}`);
        }
      } else {
        console.log(`   ⚠️ ${evalResult.message || 'No test cases found'}`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`📊 Total Results: ${totalPassed} passed, ${totalFailed} failed`);

    if (totalFailed > 0) {
      console.log('\n🚨 Some reflexion tests failed!');
      process.exit(1);
    } else if (totalPassed === 0) {
      console.log('\n⚠️ No tests executed (add test cases to golden_dataset)');
      process.exit(0);
    } else {
      console.log('\n🎉 All reflexion tests passed!');
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Reflexion test error:', error.message);
    process.exit(1);
  }
}

runReflexionTests();
