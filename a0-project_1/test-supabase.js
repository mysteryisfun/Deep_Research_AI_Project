/**
 * Simple Supabase Test Script
 * Run directly with Node.js: node test-supabase.js
 */

// Import the createClient function from @supabase/supabase-js
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration (direct constants for testing)
const supabaseUrl = 'https://wurrqztgdnecgtmsisrq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cnJxenRnZG5lY2d0bXNpc3JxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMjU5NTYsImV4cCI6MjA1ODgwMTk1Nn0.Cwke6VXDuTvQmaEgk-QKw_hwhQmrpNG_34l0gob_6NA';

// Create a Supabase client (no React Native dependencies)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Main test function
async function runTest() {
  console.log('🔶 Starting Supabase test...');
  
  // Generate a unique test ID for this run
  const testId = `test-${Date.now()}`;
  const timestamp = new Date().toISOString();
  
  // Create test data
  const testData = {
    research_id: testId,
    user_id: 'test-user-js',
    agent: 'general',
    query: `Test query from Node.js direct script ${timestamp}`,
    breadth: 3,
    depth: 4,
    include_technical_terms: true,
    output_format: 'Blog',
    status: 'pending',
    created_at: timestamp,
    completed_at: null
  };
  
  console.log('📝 Test data prepared:', testData);
  
  try {
    // Attempt to insert the record
    console.log('📤 Inserting record into research_history table...');
    const { data, error } = await supabase
      .from('research_history')
      .insert([testData])
      .select();
    
    if (error) {
      console.error('❌ ERROR:', error);
      console.error('  - Message:', error.message);
      console.error('  - Details:', error.details);
      console.error('  - Hint:', error.hint);
      return;
    }
    
    console.log('✅ SUCCESS! Data inserted:');
    console.log(data);
    
    // Verify the record was inserted
    console.log('\n🔍 Verifying record was saved by fetching it...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('research_history')
      .select('*')
      .eq('research_id', testId)
      .single();
    
    if (verifyError) {
      console.error('❌ VERIFICATION ERROR:', verifyError);
      return;
    }
    
    console.log('✅ VERIFICATION SUCCESSFUL! Retrieved data:');
    console.log(verifyData);
    console.log('\n🎉 Test completed successfully!');
    
  } catch (err) {
    console.error('❌ UNEXPECTED ERROR:', err);
    console.error(err.stack);
  }
}

// Run the test
console.log('🚀 Running Supabase direct insert test\n');
runTest()
  .catch(err => console.error('🔴 Top-level error:', err))
  .finally(() => console.log('\n🏁 Test script execution complete')); 
 
 