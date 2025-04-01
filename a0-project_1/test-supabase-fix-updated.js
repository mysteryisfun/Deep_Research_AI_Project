/**
 * Updated Supabase Test Script with FK-Compatible SQL Fix
 * Addresses foreign key constraint issues when changing column types
 * Run with: node test-supabase-fix-updated.js
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration 
const supabaseUrl = 'https://wurrqztgdnecgtmsisrq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cnJxenRnZG5lY2d0bXNpc3JxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMjU5NTYsImV4cCI6MjA1ODgwMTk1Nn0.Cwke6VXDuTvQmaEgk-QKw_hwhQmrpNG_34l0gob_6NA';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTest() {
  console.log('🔶 SUPABASE TEST WITH FOREIGN KEY COMPATIBLE FIX\n');
  
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
      
      // This section provides the UPDATED SQL that handles foreign key constraints
      console.log('\n🔐 UPDATED SQL Recommendation for Supabase with Foreign Key Handling:');
      console.log(`
-- APPROACH 1: Create a new varchar-based schema (RECOMMENDED)
-- This avoids FK issues by creating new tables and migrating data

-- 1. First create new tables with varchar IDs
CREATE TABLE research_history_new (
  research_id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  agent VARCHAR NOT NULL,
  query TEXT NOT NULL,
  breadth INTEGER NOT NULL,
  depth INTEGER NOT NULL,
  include_technical_terms BOOLEAN NOT NULL,
  output_format VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE research_questions_new (
  question_id VARCHAR PRIMARY KEY,
  research_id VARCHAR REFERENCES research_history_new(research_id),
  user_id VARCHAR NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  answered BOOLEAN DEFAULT false,
  reply_webhook_url VARCHAR,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create other related tables with VARCHAR references
CREATE TABLE research_progress_new (
  progress_id VARCHAR PRIMARY KEY,
  research_id VARCHAR REFERENCES research_history_new(research_id),
  user_id VARCHAR NOT NULL,
  status VARCHAR NOT NULL,
  topic VARCHAR,
  progress_percentage INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE research_results_new (
  result_id VARCHAR PRIMARY KEY,
  research_id VARCHAR REFERENCES research_history_new(research_id),
  user_id VARCHAR NOT NULL,
  result TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Migrate data (if needed)
-- INSERT INTO research_history_new SELECT research_id::VARCHAR, ... FROM research_history;

-- 4. Create appropriate RLS policies
ALTER TABLE research_history_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_questions_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_progress_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_results_new ENABLE ROW LEVEL SECURITY;

-- 5. Create policy to allow authenticated users to insert
CREATE POLICY "Allow inserts for authenticated users" 
  ON research_history_new FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 6. Create policy to allow users to view their own research
CREATE POLICY "Users can view their own research" 
  ON research_history_new FOR SELECT
  USING (user_id = auth.uid()::text);

-- 7. Create an RPC function for anon inserts (allows skipping auth for testing)
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
  INSERT INTO research_history_new (
    research_id, user_id, agent, query, breadth, depth, 
    include_technical_terms, output_format, status, created_at
  ) VALUES (
    p_research_id, p_user_id, p_agent, p_query, p_breadth, p_depth,
    p_include_technical_terms, p_output_format, p_status, p_created_at
  )
  RETURNING to_jsonb(research_history_new.*) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ALTERNATIVE APPROACH: Using type casting (only if you can't create new tables)
-- 1. Create a temporary fix function that uses type casting
CREATE OR REPLACE FUNCTION insert_research_with_cast(
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
  uuid_research_id UUID;
  result JSONB;
BEGIN
  -- Try to cast the VARCHAR to UUID
  BEGIN
    -- For UUIDs, use an IF statement to handle client-generated IDs
    IF p_research_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      uuid_research_id := p_research_id::UUID;
    ELSE
      -- Generate a new UUID if the string isn't in UUID format
      uuid_research_id := gen_random_uuid();
    END IF;
    
    INSERT INTO research_history (
      research_id, user_id, agent, query, breadth, depth, 
      include_technical_terms, output_format, status, created_at
    ) VALUES (
      uuid_research_id, p_user_id, p_agent, p_query, p_breadth, p_depth,
      p_include_technical_terms, p_output_format, p_status, p_created_at
    )
    RETURNING to_jsonb(research_history.*) INTO result;
    
    -- Add the original client ID to the result
    result := result || jsonb_build_object('client_research_id', p_research_id);
    
    RETURN result;
  EXCEPTION WHEN others THEN
    RETURN jsonb_build_object('error', SQLERRM);
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
      `);
      
      console.log('\n⚡ In React Native app, the service would:');
      console.log('  1. Send data to webhook first (no changes needed)');
      console.log('  2. Update code to use the new tables OR the cast function');
      console.log('  3. Continue with app flow regardless of Supabase success');
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
console.log('🚀 Starting improved Supabase test with FK-compatible fix\n');
runTest()
  .catch(err => console.error('🔴 Top-level error:', err))
  .finally(() => console.log('\n🏁 Test complete')); 
 
 