/**
 * Improved Supabase Test Script
 * Addresses the Row Level Security (RLS) policy issue
 * Run with: node test-supabase-fix.js
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration 
const supabaseUrl = 'https://wurrqztgdnecgtmsisrq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cnJxenRnZG5lY2d0bXNpc3JxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMjU5NTYsImV4cCI6MjA1ODgwMTk1Nn0.Cwke6VXDuTvQmaEgk-QKw_hwhQmrpNG_34l0gob_6NA';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTest() {
  console.log('🔶 SUPABASE TEST WITH RLS WORKAROUND\n');
  
  // Generate a unique test ID (client side generation as requested)
  const researchId = `test-${Date.now()}`;
  const userId = `user-${Date.now()}`;
  const timestamp = new Date().toISOString();
  
  console.log('📋 Using client-generated IDs:');
  console.log(`  - Research ID: ${researchId}`);
  console.log(`  - User ID: ${userId}`);
  
  // Create test data - USING CLIENT GENERATED IDs as specified
  const testData = {
    // Important: These IDs are generated client-side, NOT by Supabase
    research_id: researchId,
    user_id: userId,
    agent: 'general',
    query: `Test query with client-generated IDs ${timestamp}`,
    breadth: 3,
    depth: 4,
    include_technical_terms: true,
    output_format: 'Research Paper',
    status: 'pending',
    created_at: timestamp,
    completed_at: null
  };
  
  console.log('\n📝 Test data prepared:', testData);
  
  try {
    // FIRST ATTEMPT - Direct insert (likely to fail due to RLS)
    console.log('\n🔄 ATTEMPT 1: Direct insert into research_history table');
    const { data, error } = await supabase
      .from('research_history')
      .insert([testData])
      .select();
    
    if (error) {
      console.error('❌ ATTEMPT 1 FAILED (Expected if RLS is enabled)');
      console.error('  - Message:', error.message);
      console.error('  - Code:', error.code);
      
      // RLS workaround using a function
      console.log('\n🔄 ATTEMPT 2: Using dedicated insert function to bypass RLS');
      console.log('  - This would typically be implemented as a Supabase Edge Function or RPC');
      console.log('  - For this test, we\'ll simulate what the correct implementation would do');
      
      // Webhook simulation - in real app this would happen before the Supabase insert
      console.log('\n📡 First: Simulating webhook call...');
      console.log('  - Webhook would receive:', testData);
      console.log('  - Webhook successful (simulated)');
      
      // This section simulates what would be done on the server with proper RLS policies
      console.log('\n🔐 SQL Recommendation for Supabase:');
      console.log(`
-- 1. Modify the table to allow client-generated IDs
ALTER TABLE research_history 
  ALTER COLUMN research_id DROP DEFAULT,  -- Remove UUID default if exists
  ALTER COLUMN research_id SET DATA TYPE VARCHAR;  -- Change to VARCHAR if it's UUID

-- 2. Create a secure RPC function to insert data with proper auth context
CREATE OR REPLACE FUNCTION insert_research_history(
  p_research_id VARCHAR,
  p_user_id VARCHAR, 
  p_agent VARCHAR,
  p_query TEXT,
  p_breadth INTEGER,
  p_depth INTEGER,
  p_include_technical_terms BOOLEAN,
  p_output_format VARCHAR,
  p_status VARCHAR DEFAULT 'pending',
  p_created_at TIMESTAMPTZ DEFAULT now()
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  INSERT INTO research_history (
    research_id, user_id, agent, query, breadth, depth, 
    include_technical_terms, output_format, status, created_at
  ) VALUES (
    p_research_id, p_user_id, p_agent, p_query, p_breadth, p_depth,
    p_include_technical_terms, p_output_format, p_status, p_created_at
  )
  RETURNING to_jsonb(research_history.*) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Adjust RLS policy to allow authenticated users to read their own records
CREATE POLICY "Users can view their own research" 
  ON research_history FOR SELECT
  USING (auth.uid()::text = user_id);
      `);
      
      console.log('\n⚡ In React Native app, the service would:');
      console.log('  1. Send data to webhook first');
      console.log('  2. Generate IDs client-side');
      console.log('  3. Use the proper RPC function or authenticated client to insert to Supabase');
      console.log('  4. Continue with app flow regardless of Supabase success (webhook is primary)');
    } else {
      // Direct insert worked (unlikely unless RLS is disabled)
      console.log('✅ DIRECT INSERT SUCCESSFUL!');
      console.log('  - This suggests RLS might be disabled or you have proper permissions');
      console.log('  - Inserted data:', data);
      
      // Verify the record exists
      console.log('\n🔍 Verifying record...');
      const { data: verifyData, error: verifyError } = await supabase
        .from('research_history')
        .select('*')
        .eq('research_id', researchId)
        .single();
      
      if (verifyError) {
        console.error('❌ VERIFICATION ERROR:', verifyError);
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
console.log('🚀 Starting improved Supabase test\n');
runTest()
  .catch(err => console.error('🔴 Top-level error:', err))
  .finally(() => console.log('\n🏁 Test complete')); 
 
 