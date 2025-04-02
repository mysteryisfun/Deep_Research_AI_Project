// Simple test file to check Supabase connectivity
// Run with: node TestSupabase.js

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://wurrqztgdnecgtmsisrq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cnJxenRnZG5lY2d0bXNpc3JxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMjU5NTYsImV4cCI6MjA1ODgwMTk1Nn0.Cwke6VXDuTvQmaEgk-QKw_hwhQmrpNG_34l0gob_6NA';

// Create the Supabase client without AsyncStorage (for direct testing)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * STANDALONE TEST FUNCTION
 * Tests inserting a record into the research_history table in Supabase
 * This can be run directly with Node.js
 */
async function testSupabaseInsert() {
  console.log('=== SUPABASE TEST: STARTING ===');
  
  // Create a test record with timestamp to make it unique
  const timestamp = new Date().toISOString();
  const testRecord = {
    research_id: `test-${Date.now()}`,
    user_id: 'test-user-direct',
    agent: 'general',
    query: `Test query from direct test script - ${timestamp}`,
    breadth: 3,
    depth: 3,
    include_technical_terms: true,
    output_format: 'Research Paper',
    status: 'pending',
    created_at: timestamp,
    completed_at: null
  };
  
  console.log('Test record:', testRecord);
  
  try {
    console.log('Attempting to insert into research_history table...');
    
    // Insert the test record
    const { data, error } = await supabase
      .from('research_history')
      .insert([testRecord])
      .select();
    
    if (error) {
      console.error('ERROR inserting into Supabase:', error);
      console.error('Error details:', error.message, error.details, error.hint);
      return;
    }
    
    console.log('SUCCESS! Record inserted:', data);
    
    // Verify by fetching the record
    console.log('Verifying by fetching the inserted record...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('research_history')
      .select('*')
      .eq('research_id', testRecord.research_id)
      .single();
    
    if (verifyError) {
      console.error('ERROR verifying record:', verifyError);
      return;
    }
    
    console.log('VERIFICATION SUCCESS! Record found:', verifyData);
    console.log('=== SUPABASE TEST: COMPLETED SUCCESSFULLY ===');
  } catch (e) {
    console.error('UNEXPECTED ERROR:', e);
    console.error(e.stack);
  }
}

// Run the test function
testSupabaseInsert()
  .catch(err => {
    console.error('Top-level error caught:', err);
  })
  .finally(() => {
    console.log('Test execution completed');
  }); 
 
 