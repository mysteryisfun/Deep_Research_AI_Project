const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Initialize Supabase client with the same credentials used in the app
const supabaseUrl = 'https://wurrqztgdnecgtmsisrq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cnJxenRnZG5lY2d0bXNpc3JxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMjU5NTYsImV4cCI6MjA1ODgwMTk1Nn0.Cwke6VXDuTvQmaEgk-QKw_hwhQmrpNG_34l0gob_6NA';
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to generate test IDs
function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Run the test
async function runTest() {
  console.log('========== QUESTION DISPLAY TEST ==========');
  
  // Generate IDs for testing
  const researchId = generateId('research');
  const userId = generateId('user');
  
  console.log(`Research ID: ${researchId}`);
  console.log(`User ID: ${userId}`);
  console.log('\nThis script will create test questions and monitor them.');
  console.log('Use this Research ID in your app to test the question display functionality.');
  
  // Create a batch of questions
  const questionBatchId = generateId('question-batch');
  
  // Define test questions
  const questions = [
    {
      id: 'q1',
      text: 'What are your main research objectives for this topic?',
      answered: false
    },
    {
      id: 'q2',
      text: 'What specific aspects of this topic are you most interested in?',
      answered: false
    },
    {
      id: 'q3',
      text: 'Do you have any prior knowledge about this subject?',
      answered: false
    },
    {
      id: 'q4',
      text: 'Would you like a summary of the findings or a detailed analysis?',
      answered: false
    }
  ];
  
  // Insert batch questions
  try {
    console.log('\nCreating test questions...');
    
    const { data, error } = await supabase
      .from('research_questions_array')
      .insert([
        {
          question_id: questionBatchId,
          research_id: researchId,
          user_id: userId,
          questions: questions,
          answers: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select();
    
    if (error) {
      console.error('❌ Error creating test questions:', error);
      console.log('\nTroubleshooting tips:');
      console.log('1. Make sure you have run the SQL scripts to create the necessary tables');
      console.log('2. Check that your Supabase credentials are correct');
      console.log('3. Verify that the database has the research_questions_array table');
      return;
    }
    
    console.log('✅ Test questions created successfully!');
    console.log(`Created ${questions.length} questions for research ID: ${researchId}`);
    
    // Set up real-time monitoring for testing
    console.log('\nSetting up real-time monitoring...');
    
    const subscription = supabase
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
          console.log('\n🔔 Real-time update received!');
          const answers = payload.new.answers || [];
          console.log(`Answers count: ${answers.length}`);
          if (answers.length > 0) {
            console.log('Latest answers:');
            answers.forEach(answer => {
              console.log(`- Question ${answer.id}: ${answer.answer} (Answered: ${answer.answered})`);
            });
          }
        }
      )
      .subscribe();
    
    console.log('✅ Real-time monitoring active!');
    
    // Simulate question updates if needed
    console.log('\n✨ App testing instructions:');
    console.log('1. In your app, use this Research ID:', researchId);
    console.log('2. Go to the Research Chat Screen and make sure questions are displayed');
    console.log('3. Test the different question display modes (inline, floating, fullscreen)');
    console.log('4. Submit answers to questions and check if they update in real-time');
    
    console.log('\n⏱️ This script will keep running to monitor real-time updates.');
    console.log('Press Ctrl+C to exit when done testing.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the test
runTest(); 
 
 