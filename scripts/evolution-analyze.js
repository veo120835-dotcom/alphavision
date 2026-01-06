#!/usr/bin/env node

/**
 * Meta-Evolution Analysis Script
 * 
 * Analyzes agent performance and suggests prompt improvements.
 * Runs weekly as part of CI/CD pipeline.
 * 
 * Run with: npm run evolution:analyze
 */

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function runEvolutionAnalysis() {
  console.log('🧬 Running Meta-Evolution Analysis...\n');

  try {
    // Get all organizations
    const orgsResponse = await fetch(`${SUPABASE_URL}/rest/v1/organizations?select=id,name&limit=10`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY
      }
    });

    const organizations = await orgsResponse.json();
    
    if (!organizations?.length) {
      console.log('⚠️ No organizations found');
      process.exit(0);
    }

    for (const org of organizations) {
      console.log(`\n📊 Analyzing: ${org.name || org.id}`);
      
      // Run meta-evolution
      const evolutionResponse = await fetch(`${SUPABASE_URL}/functions/v1/meta-evolution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({
          organizationId: org.id
        })
      });

      const result = await evolutionResponse.json();

      if (result.success) {
        console.log(`   📈 Performance Score: ${(result.analysis?.overall_score * 100 || 0).toFixed(1)}%`);
        
        if (result.analysis?.recommendations?.length > 0) {
          console.log('   💡 Recommendations:');
          for (const rec of result.analysis.recommendations.slice(0, 3)) {
            console.log(`      • ${rec}`);
          }
        }

        if (result.prompt_updates?.length > 0) {
          console.log(`   🔄 ${result.prompt_updates.length} prompt update(s) suggested`);
        }
      } else {
        console.log(`   ⚠️ Analysis skipped: ${result.error || 'Insufficient data'}`);
      }

      // Also run crash recovery check
      const crashResponse = await fetch(`${SUPABASE_URL}/functions/v1/crash-recovery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({
          organizationId: org.id,
          mode: 'auto'
        })
      });

      const crashResult = await crashResponse.json();
      if (crashResult.recovered > 0) {
        console.log(`   🔧 Recovered ${crashResult.recovered} crashed agent(s)/task(s)`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('🧬 Meta-Evolution Analysis Complete');
    process.exit(0);

  } catch (error) {
    console.error('❌ Evolution analysis error:', error.message);
    process.exit(1);
  }
}

runEvolutionAnalysis();
