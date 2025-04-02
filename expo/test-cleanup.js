/**
 * Cleanup Script
 * 
 * This script removes all test questions from the database.
 * Run this to clean up after testing to prevent accumulation of test data.
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://wurrqztgdnecgtmsisrq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cnJxenRnZG5lY2d0bXNpc3JxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMjU5NTYsImV4cCI6MjA1ODgwMTk1Nn0.Cwke6VXDuTvQmaEgk-QKw_hwhQmrpNG_34l0gob_6NA';
const supabase = createClient(supabaseUrl, supabaseKey);

// IDs of test research entries to clean up
const TEST_IDS = [
  'test-research-1234',
  'test-n8n-webhook'
];

async function cleanupDatabase() {
  console.log('========== DATABASE CLEANUP ==========');
  console.log(`Cleaning up test data for research IDs: ${TEST_IDS.join(', ')}`);
  
  try {
    // 1. Clean up array-based questions
    console.log('\nCleaning up array-based questions...');
    const { data: arrayData, error: arrayError } = await supabase
      .from('research_questions_array')
      .delete()
      .in('research_id', TEST_IDS);
    
    if (arrayError) {
      console.error('Error cleaning up array questions:', arrayError);
    } else {
      console.log('Successfully removed array-based questions');
    }
    
    // 2. Clean up legacy questions
    console.log('\nCleaning up legacy questions...');
    const { data: legacyData, error: legacyError } = await supabase
      .from('research_questions_new')
      .delete()
      .in('research_id', TEST_IDS);
    
    if (legacyError) {
      console.error('Error cleaning up legacy questions:', legacyError);
    } else {
      console.log('Successfully removed legacy questions');
    }
    
    console.log('\n✅ Cleanup completed!');
    console.log('You can now run your tests with a clean database.');
    
  } catch (error) {
    console.error('Unexpected error during cleanup:', error);
  }
}

// Run the cleanup
cleanupDatabase(); 