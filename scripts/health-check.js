#!/usr/bin/env node

/**
 * Health Check Script for CI/CD Pipeline
 * 
 * This script tests core agent functionality:
 * 1. Edge function availability
 * 2. Database connectivity
 * 3. Critical function responses
 * 
 * Run with: npm run test:health
 */

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const tests = [
  {
    name: 'Model Router',
    endpoint: '/functions/v1/model-router',
    body: {
      messages: [{ role: 'user', content: 'Test message' }],
      systemPrompt: 'You are a test assistant.',
      metadata: { requiresReasoning: false }
    },
    validate: (response) => response.success || response.result
  },
  {
    name: 'Self Healer',
    endpoint: '/functions/v1/self-healer',
    body: {
      organizationId: 'test-org-id',
      taskType: 'health_check',
      errorLog: 'Test error for health check',
      lastPrompt: 'Test prompt'
    },
    validate: (response) => !response.error || response.advice
  },
  {
    name: 'Chart Generator',
    endpoint: '/functions/v1/chart-generator',
    body: {
      type: 'bar',
      title: 'Health Check Chart',
      labels: ['A', 'B', 'C'],
      datasets: [{ label: 'Test', data: [1, 2, 3] }]
    },
    validate: (response) => response.success && response.chart
  },
  {
    name: 'Crash Recovery (Check Mode)',
    endpoint: '/functions/v1/crash-recovery',
    body: {
      organizationId: 'test-org-id',
      mode: 'check'
    },
    validate: (response) => response.success !== undefined
  }
];

async function runTests() {
  console.log('🏥 Running Agent Health Checks...\n');
  
  let passed = 0;
  let failed = 0;
  const results = [];

  for (const test of tests) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${SUPABASE_URL}${test.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify(test.body)
      });

      const duration = Date.now() - startTime;
      const data = await response.json().catch(() => ({}));
      
      if (response.ok && test.validate(data)) {
        console.log(`✅ ${test.name} (${duration}ms)`);
        passed++;
        results.push({ name: test.name, status: 'passed', duration });
      } else {
        console.log(`❌ ${test.name} - Validation failed`);
        console.log(`   Response: ${JSON.stringify(data).substring(0, 100)}`);
        failed++;
        results.push({ name: test.name, status: 'failed', error: data.error || 'Validation failed' });
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`❌ ${test.name} - ${error.message}`);
      failed++;
      results.push({ name: test.name, status: 'error', error: error.message, duration });
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Results: ${passed}/${tests.length} passed`);
  
  if (failed > 0) {
    console.log(`\n🚨 ${failed} test(s) failed!`);
    process.exit(1);
  } else {
    console.log('\n🎉 All health checks passed!');
    process.exit(0);
  }
}

runTests();
