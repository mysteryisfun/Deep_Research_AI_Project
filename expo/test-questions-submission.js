const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Initialize Supabase client
const supabaseUrl = 'https://wurrqztgdnecgtmsisrq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cnJxenRnZG5lY2d0bXNpc3JxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMjU5NTYsImV4cCI6MjA1ODgwMTk1Nn0.Cwke6VXDuTvQmaEgk-QKw_hwhQmrpNG_34l0gob_6NA';
const supabase = createClient(supabaseUrl, supabaseKey);

// Mock webhook to validate data is sent properly
// Use a real webhook.site URL or your actual n8n webhook endpoint
const MOCK_WEBHOOK = 'https://webhook.site/3a1f3c1f-9e7d-4a2c-9de0-1b8c2f99d5a0';
// If you're using n8n, uncomment and use this instead:
// const MOCK_WEBHOOK = 'https://your-n8n-instance.com/webhook/your-endpoint-id';

// Generate a unique ID
function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
}

// Fixed test IDs for easier testing
const TEST_RESEARCH_ID = 'test-research-1234';
const TEST_USER_ID = 'test-user-1234';

// Create test questions for the research
async function createTestQuestions(researchId, userId) {
  try {
    console.log(`Creating questions for research ID: ${researchId}`);
    
    // Try the array-based table first
    const arrayQuestions = {
      question_id: generateId('batch'),
      research_id: researchId,
      user_id: userId,
      questions: [
        {
          id: 'q1',
          text: 'What specific aspects of this research are most important to you?',
          answered: false
        },
        {
          id: 'q2',
          text: 'Would you like the results to focus on practical applications or theoretical concepts?',
          answered: false
        },
        {
          id: 'q3',
          text: 'Do you need quantitative data, qualitative insights, or both?',
          answered: false
        }
      ],
      answers: [],
      reply_webhook_url: MOCK_WEBHOOK,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log(`Using webhook URL: ${MOCK_WEBHOOK}`);
    
    const { data: arrayData, error: arrayError } = await supabase
      .from('research_questions_array')
      .insert([arrayQuestions])
      .select();
      
    if (arrayError) {
      console.error('Error creating array questions:', arrayError);
      
      // Fall back to individual questions
      console.log('Falling back to legacy table format...');
      
      const questions = [
        {
          question_id: generateId('q'),
          research_id: researchId,
          user_id: userId,
          question: 'What specific aspects of this research are most important to you?',
          answered: false,
          reply_webhook_url: MOCK_WEBHOOK,
          created_at: new Date().toISOString()
        },
        {
          question_id: generateId('q'),
          research_id: researchId,
          user_id: userId,
          question: 'Would you like the results to focus on practical applications or theoretical concepts?',
          answered: false,
          reply_webhook_url: MOCK_WEBHOOK,
          created_at: new Date().toISOString()
        },
        {
          question_id: generateId('q'),
          research_id: researchId,
          user_id: userId,
          question: 'Do you need quantitative data, qualitative insights, or both?',
          answered: false,
          reply_webhook_url: MOCK_WEBHOOK,
          created_at: new Date().toISOString()
        }
      ];
      
      const { data: questionsData, error: questionsError } = await supabase
        .from('research_questions_new')
        .insert(questions)
        .select();
        
      if (questionsError) {
        console.error('Error creating legacy questions:', questionsError);
        return false;
      }
      
      console.log(`Successfully created ${questionsData.length} questions in legacy format`);
      return true;
    }
    
    console.log(`Successfully created array-based questions batch`);
    return true;
  } catch (error) {
    console.error('Unexpected error creating questions:', error);
    return false;
  }
}

// Monitor for changes to questions
function setupRealTimeMonitoring(researchId) {
  console.log(`Setting up real-time monitoring for research ID: ${researchId}`);
  
  const channel = supabase
    .channel('research_questions_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'research_questions_array',
        filter: `research_id=eq.${researchId}`
      },
      (payload) => {
        console.log('\n🔔 Real-time update detected!');
        console.log('Action:', payload.eventType);
        console.log('Updated record:', JSON.stringify(payload.new, null, 2));
      }
    )
    .subscribe();
    
  console.log('Real-time monitoring activated');
  return channel;
}

// Run the test
async function runTest() {
  console.log('========== RESEARCH QUESTIONS SUBMISSION TEST ==========');
  
  // Use fixed test IDs instead of creating new ones
  const researchId = TEST_RESEARCH_ID;
  const userId = TEST_USER_ID;
  console.log(`Using fixed test IDs for easier testing:`);
  console.log(`- Research ID: ${researchId}`);
  console.log(`- User ID: ${userId}`);
  
  // Step 1: Create test questions
  const questionsCreated = await createTestQuestions(researchId, userId);
  if (!questionsCreated) {
    console.error('Failed to create test questions. Aborting test.');
    return;
  }
  
  // Step 2: Set up real-time monitoring
  const channel = setupRealTimeMonitoring(researchId);
  
  // Step 3: Provide test instructions
  console.log('\n✅ Test setup completed successfully!');
  console.log('\nTo test the questions functionality:');
  console.log('1. Launch the app and navigate to the Research Parameters screen');
  console.log('2. After submitting the research query, the app should navigate to the ResearchQuestionsScreen');
  console.log('3. OR use this research ID directly in your testing:', researchId);
  console.log('\nWhen you submit answers, this script will detect the real-time updates from Supabase.');
  console.log('\nPress Ctrl+C to exit when done testing.');
}

// Run the test
runTest(); 