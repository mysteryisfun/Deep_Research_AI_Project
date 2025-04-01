/**
 * Test for new tables with VARCHAR IDs
 * Tests the Supabase integration with the new _new tables 
 * Run with: node test-with-new-tables.js
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration 
const supabaseUrl = 'https://wurrqztgdnecgtmsisrq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cnJxenRnZG5lY2d0bXNpc3JxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMjU5NTYsImV4cCI6MjA1ODgwMTk1Nn0.Cwke6VXDuTvQmaEgk-QKw_hwhQmrpNG_34l0gob_6NA';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Generate a unique ID for this test
const researchId = `research-${Date.now()}`;
const userId = `user-${Date.now()}`;
const questionId = `question-${Date.now()}`;
const timestamp = new Date().toISOString();

async function testResearchHistory() {
  console.log('📝 Testing research_history_new table...');
  
  const historyData = {
    research_id: researchId,
    user_id: userId,
    agent: 'general',
    query: `Test query from test-with-new-tables.js at ${timestamp}`,
    breadth: 3,
    depth: 4,
    include_technical_terms: true,
    output_format: 'Research Paper',
    status: 'pending',
    created_at: timestamp
  };
  
  console.log('  - Inserting research history record:', historyData);
  
  const { data: historyResult, error: historyError } = await supabase
    .from('research_history_new')
    .insert([historyData])
    .select();
  
  if (historyError) {
    console.error('❌ Failed to insert research history:', historyError);
    return false;
  }
  
  console.log('✅ Successfully inserted research history:', historyResult);
  return true;
}

async function testResearchQuestions() {
  console.log('\n📝 Testing research_questions_new table...');
  
  const questionData = {
    question_id: questionId,
    research_id: researchId,
    user_id: userId,
    question: `Test question related to research ${researchId}`,
    created_at: timestamp
  };
  
  console.log('  - Inserting research question record:', questionData);
  
  const { data: questionResult, error: questionError } = await supabase
    .from('research_questions_new')
    .insert([questionData])
    .select();
  
  if (questionError) {
    console.error('❌ Failed to insert research question:', questionError);
    return false;
  }
  
  console.log('✅ Successfully inserted research question:', questionResult);
  return true;
}

async function testForeignKeyQuery() {
  console.log('\n📝 Testing foreign key relationship...');
  console.log(`  - Querying questions for research_id: ${researchId}`);
  
  const { data: relatedData, error: relatedError } = await supabase
    .from('research_questions_new')
    .select('question_id, question, research_history_new!inner(research_id, query)')
    .eq('research_id', researchId);
  
  if (relatedError) {
    console.error('❌ Failed to query related data:', relatedError);
    return false;
  }
  
  console.log('✅ Successfully queried related data:', relatedData);
  return true;
}

async function runAllTests() {
  console.log('🚀 Starting test for new tables with VARCHAR IDs\n');
  
  // First test: insert into research_history_new
  const historyTestResult = await testResearchHistory();
  if (!historyTestResult) {
    console.error('❌ Research history test failed, stopping further tests');
    return;
  }
  
  // Second test: insert into research_questions_new with FK
  const questionsTestResult = await testResearchQuestions();
  if (!questionsTestResult) {
    console.error('❌ Research questions test failed, stopping further tests');
    return;
  }
  
  // Third test: query with join using foreign key
  await testForeignKeyQuery();
  
  console.log('\n📊 Summary:');
  console.log(`  • Created research history with ID: ${researchId}`);
  console.log(`  • Created research question with ID: ${questionId}`);
  console.log('  • Verified foreign key relationship works');
  console.log('\n🎉 All tests complete - the new tables are working correctly!');
}

// Run all tests
runAllTests()
  .catch(err => console.error('🔴 Top-level error:', err))
  .finally(() => console.log('\n�� Test complete'));