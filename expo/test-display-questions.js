const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://wurrqztgdnecgtmsisrq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cnJxenRnZG5lY2d0bXNpc3JxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMjU5NTYsImV4cCI6MjA1ODgwMTk1Nn0.Cwke6VXDuTvQmaEgk-QKw_hwhQmrpNG_34l0gob_6NA';
const supabase = createClient(supabaseUrl, supabaseKey);

// Generate a unique ID
function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
}

// Create test questions for the given research ID
async function createTestQuestions(researchId, userId) {
  try {
    console.log(`Creating test questions for research ID: ${researchId}`);
    
    // First try to create using the array-based table
    const arrayQuestions = {
      question_id: generateId('batch'),
      research_id: researchId,
      user_id: userId,
      questions: [
        {
          id: 'q1',
          text: 'What specific aspects of this topic interest you the most?',
          answered: false
        },
        {
          id: 'q2',
          text: 'Would you like a general overview or deep technical analysis?',
          answered: false
        },
        {
          id: 'q3',
          text: 'Is there any particular aspect you want to focus on?',
          answered: false
        }
      ],
      answers: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: arrayData, error: arrayError } = await supabase
      .from('research_questions_array')
      .insert([arrayQuestions])
      .select();
    
    if (arrayError) {
      console.error('Error creating array-based questions:', arrayError);
      
      // Fallback to creating individual questions in the legacy table
      console.log('Falling back to legacy table...');
      
      const questions = [
        {
          question_id: generateId('q'),
          research_id: researchId,
          user_id: userId,
          question: 'What specific aspects of this topic interest you the most?',
          answered: false,
          created_at: new Date().toISOString()
        },
        {
          question_id: generateId('q'),
          research_id: researchId,
          user_id: userId,
          question: 'Would you like a general overview or deep technical analysis?',
          answered: false,
          created_at: new Date().toISOString()
        },
        {
          question_id: generateId('q'),
          research_id: researchId,
          user_id: userId,
          question: 'Is there any particular aspect you want to focus on?',
          answered: false,
          created_at: new Date().toISOString()
        }
      ];
      
      const { data: legacyData, error: legacyError } = await supabase
        .from('research_questions_new')
        .insert(questions)
        .select();
      
      if (legacyError) {
        console.error('Error creating legacy questions:', legacyError);
        return false;
      }
      
      console.log('Successfully created legacy questions:', legacyData.length);
      return true;
    }
    
    console.log('Successfully created array-based questions:', arrayData);
    return true;
  } catch (error) {
    console.error('Unexpected error:', error);
    return false;
  }
}

// Create a test research history record
async function createTestResearchHistory(researchId, userId) {
  try {
    console.log(`Creating test research history for ID: ${researchId}`);
    
    const researchData = {
      research_id: researchId,
      user_id: userId,
      agent: 'General Research',
      query: 'Financial markets analysis',
      breadth: 3,
      depth: 3,
      include_technical_terms: false,
      output_format: 'Research Paper',
      status: 'in_progress',
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('research_history_new')
      .insert([researchData])
      .select();
    
    if (error) {
      console.error('Error creating research history:', error);
      return false;
    }
    
    console.log('Successfully created research history:', data);
    return true;
  } catch (error) {
    console.error('Unexpected error:', error);
    return false;
  }
}

// Run the test
async function runTest() {
  // Generate test IDs
  const researchId = generateId('research');
  const userId = generateId('user');
  
  console.log('========== TEST DISPLAY QUESTIONS ==========');
  console.log(`Research ID: ${researchId}`);
  console.log(`User ID: ${userId}`);
  
  // First create a research history record
  const historyCreated = await createTestResearchHistory(researchId, userId);
  if (!historyCreated) {
    console.error('Failed to create research history. Aborting test.');
    return;
  }
  
  // Then create test questions
  const questionsCreated = await createTestQuestions(researchId, userId);
  if (!questionsCreated) {
    console.error('Failed to create test questions.');
    return;
  }
  
  // Success message
  console.log('\n✅ Test setup completed successfully!');
  console.log('\nTo test the questions display:');
  console.log('1. Start your React Native app');
  console.log('2. Enter this Research ID in the test interface:');
  console.log(`   ${researchId}`);
  console.log('3. The questions should load and display properly');
}

// Run the test
runTest(); 
 
 