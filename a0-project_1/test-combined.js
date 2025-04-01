/**
 * Combined Webhook + Supabase Test Script
 * Run directly with Node.js: node test-combined.js
 */

// Import required dependencies
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const WEBHOOK_URL = 'https://atomic123.app.n8n.cloud/webhook-test/055cedaa-a313-4625-a41c-7e7f9560b7a3';
const supabaseUrl = 'https://wurrqztgdnecgtmsisrq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cnJxenRnZG5lY2d0bXNpc3JxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMjU5NTYsImV4cCI6MjA1ODgwMTk1Nn0.Cwke6VXDuTvQmaEgk-QKw_hwhQmrpNG_34l0gob_6NA';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Main test function
async function runTest() {
  console.log('🔄 STARTING COMBINED TEST: Webhook + Supabase\n');
  
  // Generate a unique test ID for this run
  const testId = `combined-test-${Date.now()}`;
  const timestamp = new Date().toISOString();
  
  // Create test data
  const testData = {
    research_id: testId,
    user_id: 'test-user-combined',
    agent: 'general',
    query: `Test query from combined test script ${timestamp}`,
    breadth: 3,
    depth: 4,
    include_technical_terms: true,
    output_format: 'Blog',
    status: 'pending',
    created_at: timestamp,
    completed_at: null
  };
  
  console.log('📝 Test data prepared:', testData);
  
  // STEP 1: Test webhook
  console.log('\n📡 STEP 1: TESTING WEBHOOK');
  try {
    console.log('📤 Sending data to webhook...');
    const webhookResponse = await axios.post(WEBHOOK_URL, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ WEBHOOK SUCCESS!');
    console.log('  - Status:', webhookResponse.status);
    console.log('  - Response:', webhookResponse.data);
  } catch (err) {
    console.error('❌ WEBHOOK ERROR:');
    if (err.response) {
      console.error('  - Status:', err.response.status);
      console.error('  - Data:', err.response.data);
    } else {
      console.error('  - Message:', err.message);
    }
    // Continue to the next step even if this fails
  }
  
  // STEP 2: Test Supabase
  console.log('\n💾 STEP 2: TESTING SUPABASE');
  try {
    console.log('📤 Inserting record into research_history table...');
    const { data, error } = await supabase
      .from('research_history')
      .insert([testData])
      .select();
    
    if (error) {
      console.error('❌ SUPABASE ERROR:', error);
      console.error('  - Message:', error.message);
      console.error('  - Details:', error.details);
      console.error('  - Hint:', error.hint);
    } else {
      console.log('✅ SUPABASE SUCCESS!');
      console.log('  - Data:', data);
      
      // Verify the record
      console.log('\n🔍 Verifying Supabase record...');
      const { data: verifyData, error: verifyError } = await supabase
        .from('research_history')
        .select('*')
        .eq('research_id', testId)
        .single();
      
      if (verifyError) {
        console.error('❌ VERIFICATION ERROR:', verifyError);
      } else {
        console.log('✅ VERIFICATION SUCCESSFUL!');
        console.log('  - Retrieved data:', verifyData);
      }
    }
  } catch (err) {
    console.error('❌ UNEXPECTED SUPABASE ERROR:', err);
    console.error(err.stack);
  }
  
  console.log('\n🎯 TEST COMPLETED');
}

// Run the test
console.log('🚀 Starting combined webhook and Supabase test\n');
runTest()
  .catch(err => console.error('🔴 Top-level error:', err))
  .finally(() => console.log('\n🏁 Test script execution complete')); 
 
 