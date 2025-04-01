/**
 * Test script for array-based questions in Supabase
 * Run with: node test-array-questions.js
 */

// Import Supabase client
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://wurrqztgdnecgtmsisrq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cnJxenRnZG5lY2d0bXNpc3JxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMjU5NTYsImV4cCI6MjA1ODgwMTk1Nn0.Cwke6VXDuTvQmaEgk-QKw_hwhQmrpNG_34l0gob_6NA';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Generate unique IDs for this test
const generateTestId = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

// Test data
const testData = {
  researchId: generateTestId('research'),
  userId: generateTestId('user'),
  questions: [
    {
      id: 'q1',
      text: "What is your main research objective?",
      answered: false
    },
    {
      id: 'q2',
      text: "What methodology do you plan to use?",
      answered: false
    },
    {
      id: 'q3',
      text: "What is your research background?",
      answered: false
    }
  ]
};

// Function to create batch questions
async function createBatchQuestions() {
  console.log('🔶 ARRAY-BASED QUESTIONS TEST\n');
  console.log('Creating batch questions with the following data:');
  console.log(`- Research ID: ${testData.researchId}`);
  console.log(`- User ID: ${testData.userId}`);
  console.log(`- Number of questions: ${testData.questions.length}`);
  
  const questionData = {
    question_id: generateTestId('qbatch'),
    research_id: testData.researchId,
    user_id: testData.userId,
    questions: testData.questions,
    answers: [],
    reply_webhook_url: 'https://your-webhook-url.com/endpoint',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  console.log('\n📡 Inserting batch questions into Supabase...');
  
  try {
    const { data, error } = await supabase
      .from('research_questions_array')
      .insert([questionData])
      .select();
    
    if (error) {
      console.error('❌ Error inserting batch questions:', error);
      console.log('\n🔐 Make sure you have run the SQL commands in update_research_questions.sql');
      return null;
    }
    
    console.log('✅ Successfully inserted batch questions!');
    console.log('Inserted data:', data[0]);
    return data[0];
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return null;
  }
}

// Function to set up real-time subscription
function setupRealTimeSubscription(questionBatchId) {
  console.log('\n🔄 Setting up real-time subscription for updates...');
  
  const subscription = supabase
    .channel('array-questions-changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'research_questions_array',
        filter: `question_id=eq.${questionBatchId}`
      },
      (payload) => {
        console.log('\n📣 Real-time update received!');
        console.log('Updated record:', payload.new);
        
        // Compare answers before and after
        const oldAnswers = payload.old.answers || [];
        const newAnswers = payload.new.answers || [];
        
        console.log(`\nAnswers changed: ${oldAnswers.length} -> ${newAnswers.length}`);
        
        if (newAnswers.length > oldAnswers.length) {
          console.log('New answers added:');
          newAnswers.slice(oldAnswers.length).forEach((answer, index) => {
            console.log(`- Answer ${oldAnswers.length + index + 1}: ${JSON.stringify(answer)}`);
          });
        }
      }
    )
    .subscribe();
  
  console.log('✅ Real-time subscription set up successfully!');
  return subscription;
}

// Function to add an answer to a specific question
async function addAnswer(batchData, questionId, answer) {
  if (!batchData) return;
  
  // Find the question in the questions array
  const questions = batchData.questions || [];
  const questionIndex = questions.findIndex(q => q.id === questionId);
  
  if (questionIndex === -1) {
    console.error(`❌ Question with ID ${questionId} not found`);
    return;
  }
  
  const question = questions[questionIndex];
  console.log(`\n📝 Adding answer to question "${question.text}"`);
  
  // Update the question's answered status
  const updatedQuestions = [...questions];
  updatedQuestions[questionIndex] = {
    ...question,
    answered: true
  };
  
  // Prepare the answer data
  const existingAnswers = batchData.answers || [];
  const updatedAnswers = [...existingAnswers];
  
  // Check if we already have an answer for this question
  const existingAnswerIndex = updatedAnswers.findIndex(a => a.id === questionId);
  
  if (existingAnswerIndex >= 0) {
    updatedAnswers[existingAnswerIndex] = {
      ...updatedAnswers[existingAnswerIndex],
      answer,
      answered: true
    };
  } else {
    updatedAnswers.push({
      id: questionId,
      answer,
      answered: true
    });
  }
  
  console.log('📡 Updating answers in Supabase...');
  
  try {
    const { data, error } = await supabase
      .from('research_questions_array')
      .update({ 
        questions: updatedQuestions,
        answers: updatedAnswers,
        updated_at: new Date().toISOString()
      })
      .eq('question_id', batchData.question_id)
      .select();
    
    if (error) {
      console.error('❌ Error updating answers:', error);
      return;
    }
    
    console.log('✅ Successfully updated answers!');
    return data[0];
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return null;
  }
}

// Main function
async function runTest() {
  console.log('=== ARRAY-BASED QUESTIONS TEST START ===\n');
  
  // Step 1: Create batch questions
  const batchData = await createBatchQuestions();
  if (!batchData) {
    console.log('❌ Test failed at creating batch questions. Exiting...');
    return;
  }
  
  // Step 2: Set up real-time subscription
  const subscription = setupRealTimeSubscription(batchData.question_id);
  
  // Step 3: Add some answers after a delay to demonstrate real-time updates
  console.log('\n⏱️ Waiting 3 seconds before adding answers...');
  
  setTimeout(async () => {
    // Add first answer
    await addAnswer(batchData, 'q1', "My objective is to develop a new theoretical framework");
    
    // Wait a bit more and add another answer
    setTimeout(async () => {
      await addAnswer(batchData, 'q2', "I plan to use mixed methods research");
      
      // Wait a bit more and add a third answer
      setTimeout(async () => {
        await addAnswer(batchData, 'q3', "I have 5 years of research experience");
        
        console.log('\n✅ Test completed successfully!');
        console.log('Note: Real-time subscription is still active.');
        console.log('You can continue to see updates if you add more answers manually.');
        console.log('Press Ctrl+C to exit the script.');
      }, 3000);
    }, 3000);
  }, 3000);
}

// Run the test
runTest(); 