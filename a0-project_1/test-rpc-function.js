/**
 * Test using RPC function to bypass RLS
 * Tests the Supabase insert_research_history RPC function
 * Run with: node test-rpc-function.js
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration 
const supabaseUrl = 'https://wurrqztgdnecgtmsisrq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cnJxenRnZG5lY2d0bXNpc3JxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMjU5NTYsImV4cCI6MjA1ODgwMTk1Nn0.Cwke6VXDuTvQmaEgk-QKw_hwhQmrpNG_34l0gob_6NA';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTest() {
  console.log('🔶 TESTING RPC FUNCTION FOR RESEARCH HISTORY INSERTION\n');
  
  // Generate a unique test ID (client side generation as requested)
  const researchId = `research-${Date.now()}`;
  const userId = `user-${Date.now()}`;
  const timestamp = new Date().toISOString();
  
  console.log('📋 Using client-generated IDs:');
  console.log(`  - Research ID: ${researchId}`);
  console.log(`  - User ID: ${userId}`);
  
  // Parameters for the RPC function
  const params = {
    p_research_id: researchId,
    p_user_id: userId,
    p_agent: 'general',
    p_query: `Test query using RPC function at ${timestamp}`,
    p_breadth: 3,
    p_depth: 4,
    p_include_technical_terms: true,
    p_output_format: 'Research Paper',
    p_status: 'pending',
    p_created_at: timestamp
  };
  
  console.log('\n📝 Prepared parameters for RPC function:', params);
  
  try {
    console.log('\n🔄 Calling insert_research_history RPC function...');
    const { data, error } = await supabase
      .rpc('insert_research_history', params);
    
    if (error) {
      console.error('❌ RPC CALL FAILED');
      console.error('  - Message:', error.message);
      console.error('  - Code:', error.code);
      
      console.log('\n🔍 Possible issues:');
      console.log('  1. The RPC function may not exist yet - check if you created it in Supabase SQL editor');
      console.log('  2. The function parameters might not match what the function expects');
      console.log('  3. The RPC function might have permissions issues');
    } else {
      console.log('✅ RPC CALL SUCCESSFUL!');
      console.log('  - Response:', data);
      
      // Verify if we can read the inserted data
      console.log('\n🔍 Verifying data with a direct query...');
      const { data: verifyData, error: verifyError } = await supabase
        .from('research_history_new')
        .select('*')
        .eq('research_id', researchId)
        .single();
      
      if (verifyError) {
        console.error('❌ VERIFICATION QUERY FAILED:', verifyError);
        console.log('  - This might be due to RLS policies preventing read access');
      } else {
        console.log('✅ VERIFICATION SUCCESSFUL!');
        console.log('  - Retrieved data:', verifyData);
      }
    }
  } catch (err) {
    console.error('❌ UNEXPECTED ERROR:', err);
  }
}

// Run the test
console.log('🚀 Starting RPC function test\n');
runTest()
  .catch(err => console.error('🔴 Top-level error:', err))
  .finally(() => console.log('\n🏁 Test complete')); 
 
 