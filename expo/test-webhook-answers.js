/**
 * Test Script for Verifying Answer Storage and Webhook Functionality
 * 
 * This script tests that:
 * 1. Answers are properly stored in the database
 * 2. Answers are sent to the webhook correctly
 * 
 * Run with: node test-webhook-answers.js
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Supabase connection info
const supabaseUrl = process.env.SUPABASE_URL || 'https://wurrqztgdnecgtmsisrq.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cnJxenRnZG5lY2d0bXNpc3JxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzIyNTk1NiwiZXhwIjoyMDU4ODAxOTU2fQ.nwRS4NT_dV5xPyc6p4tuKs9IUFkxQpGxciRzjKS8h6Q';

// Create Supabase client
const supabase = createClient(supabaseUrl, serviceRoleKey);

// Test webhook URLs
const TEST_WEBHOOK_URL = 'https://webhook.site/73e5d1d1-a9fc-4f0e-ab80-d40450a4095f'; // Replace with your webhook.site URL
const N8N_WEBHOOK_URL = 'https://atomic123.app.n8n.cloud/webhook-waiting/126'; // n8n webhook URL

// Generate unique IDs for testing
const TEST_RESEARCH_ID = 'test-' + Date.now();
const TEST_USER_ID = 'user-' + Date.now();
const TEST_BATCH_ID = 'batch-' + Date.now();

/**
 * Create a test question batch for testing
 */
async function createTestBatch() {
  console.log('\n🔶 Creating test question batch...');
  
  // Question data
  const questionData = {
    question_id: TEST_BATCH_ID,
    research_id: TEST_RESEARCH_ID,
    user_id: TEST_USER_ID,
    questions: [
      {
        id: 'q1',
        text: 'Test Question 1',
        answered: false
      },
      {
        id: 'q2',
        text: 'Test Question 2',
        answered: false
      }
    ],
    answers: [],
    reply_webhook_url: TEST_WEBHOOK_URL, // Use webhook.site for easy inspection
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  // Insert into Supabase
  try {
    const { data, error } = await supabase
      .from('research_questions_array')
      .insert(questionData)
      .select();
    
    if (error) {
      console.error('❌ Error creating test batch:', error);
      return false;
    }
    
    console.log('✅ Test batch created successfully:', data[0].question_id);
    console.log('📝 Test research ID:', TEST_RESEARCH_ID);
    console.log('👤 Test user ID:', TEST_USER_ID);
    return true;
  } catch (err) {
    console.error('❌ Exception creating test batch:', err);
    return false;
  }
}

/**
 * Test the direct RPC function for adding an answer
 */
async function testRpcFunction() {
  console.log('\n🔶 Testing RPC function directly...');
  
  const testAnswer = 'This is a test answer via RPC ' + Date.now();
  
  try {
    console.log('📤 Calling update_single_batch_answer RPC with:');
    console.log(`- Batch ID: ${TEST_BATCH_ID}`);
    console.log(`- Question ID: q1`);
    console.log(`- Answer: ${testAnswer.substring(0, 30)}...`);
    
    const { data, error } = await supabase.rpc('update_single_batch_answer', {
      p_question_id: TEST_BATCH_ID,
      p_question_item_id: 'q1',
      p_answer: testAnswer
    });
    
    if (error) {
      console.error('❌ RPC error:', error);
      return false;
    }
    
    console.log('✅ RPC call successful!');
    
    // Verify the answer was added
    if (data && data.answers && data.answers.length > 0) {
      const answer = data.answers.find(a => a.id === 'q1');
      if (answer && answer.answer === testAnswer) {
        console.log('✅ Answer was correctly added to the database!');
      } else {
        console.error('❌ Answer was NOT correctly added to the database!');
        console.log('Answers array:', JSON.stringify(data.answers, null, 2));
      }
    } else {
      console.error('❌ No answers were found in the response!');
    }
    
    return true;
  } catch (err) {
    console.error('❌ RPC exception:', err);
    return false;
  }
}

/**
 * Test direct database update
 */
async function testDirectUpdate() {
  console.log('\n🔶 Testing direct database update...');
  
  const testAnswer = 'This is a test answer via direct update ' + Date.now();
  
  try {
    // First get the current record
    const { data: currentBatch, error: fetchError } = await supabase
      .from('research_questions_array')
      .select('*')
      .eq('question_id', TEST_BATCH_ID)
      .single();
    
    if (fetchError) {
      console.error('❌ Error fetching batch:', fetchError);
      return false;
    }
    
    // Update the answers array
    const currentAnswers = currentBatch.answers || [];
    let updatedAnswers = [...currentAnswers];
    
    // Check if we already have an answer for q2
    const existingIndex = updatedAnswers.findIndex(a => a.id === 'q2');
    
    if (existingIndex >= 0) {
      // Update existing answer
      updatedAnswers[existingIndex] = {
        ...updatedAnswers[existingIndex],
        answer: testAnswer,
        answered: true,
        updated_at: new Date().toISOString()
      };
    } else {
      // Add new answer
      updatedAnswers.push({
        id: 'q2',
        text: '',
        answer: testAnswer,
        answered: true,
        created_at: new Date().toISOString()
      });
    }
    
    // Also update the question's answered status
    const questions = currentBatch.questions || [];
    const updatedQuestions = questions.map(q => {
      if (q.id === 'q2') {
        return { ...q, answered: true };
      }
      return q;
    });
    
    // Update the database
    const { data, error } = await supabase
      .from('research_questions_array')
      .update({
        questions: updatedQuestions,
        answers: updatedAnswers,
        updated_at: new Date().toISOString()
      })
      .eq('question_id', TEST_BATCH_ID)
      .select();
    
    if (error) {
      console.error('❌ Error updating batch:', error);
      return false;
    }
    
    console.log('✅ Direct update successful!');
    
    // Verify the answer was added
    if (data && data[0].answers && data[0].answers.length > 0) {
      const answer = data[0].answers.find(a => a.id === 'q2');
      if (answer && answer.answer === testAnswer) {
        console.log('✅ Answer was correctly added to the database!');
      } else {
        console.error('❌ Answer was NOT correctly added to the database!');
        console.log('Answers array:', JSON.stringify(data[0].answers, null, 2));
      }
    } else {
      console.error('❌ No answers were found in the response!');
    }
    
    return true;
  } catch (err) {
    console.error('❌ Exception in direct update:', err);
    return false;
  }
}

/**
 * Send answers to webhook directly
 */
async function testWebhookDirectly() {
  console.log('\n🔶 Testing webhook directly...');
  
  try {
    // First get the current batch data
    const { data: batch, error: fetchError } = await supabase
      .from('research_questions_array')
      .select('*')
      .eq('question_id', TEST_BATCH_ID)
      .single();
    
    if (fetchError) {
      console.error('❌ Error fetching batch:', fetchError);
      return false;
    }
    
    const questions = batch.questions || [];
    const answers = batch.answers || [];
    
    // Prepare the webhook payload
    const webhookPayload = {
      // Include batch metadata
      question_batch_id: TEST_BATCH_ID,
      research_id: TEST_RESEARCH_ID,
      user_id: TEST_USER_ID,
      
      // Include all questions and answers
      questions: questions.map(q => ({
        id: q.id,
        text: q.text,
        answered: answers.some(a => a.id === q.id)
      })),
      
      answers: answers.map(a => {
        const q = questions.find(q => q.id === a.id);
        return {
          id: a.id,
          question: q?.text || '',
          answer: a.answer,
          answered: a.answered
        };
      }),
      
      submitted_at: new Date().toISOString()
    };
    
    console.log('📤 Sending payload to webhook:', TEST_WEBHOOK_URL);
    console.log('Payload includes:');
    console.log(`- ${questions.length} questions`);
    console.log(`- ${answers.length} answers`);
    
    // Send to regular webhook (webhook.site)
    const regularResponse = await fetch(TEST_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    });
    
    console.log('✅ Regular webhook response status:', regularResponse.status);
    
    // Also try sending to n8n webhook in multipart/form-data format
    console.log('\n📤 Sending to n8n webhook as multipart form data:', N8N_WEBHOOK_URL);
    
    // Create a form data object
    const FormData = require('form-data');
    const formData = new FormData();
    
    // Add all fields
    formData.append('question_batch_id', TEST_BATCH_ID);
    formData.append('research_id', TEST_RESEARCH_ID);
    formData.append('questions', JSON.stringify(webhookPayload.questions));
    formData.append('answers', JSON.stringify(webhookPayload.answers));
    
    // Send to n8n webhook
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      body: formData,
    });
    
    console.log('✅ n8n webhook response status:', n8nResponse.status);
    
    return true;
  } catch (err) {
    console.error('❌ Exception in webhook test:', err);
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🧪 WEBHOOK ANSWERS TEST SCRIPT');
  console.log('=============================================');
  console.log('Testing that answers are properly:');
  console.log('1. Stored in the database');
  console.log('2. Sent to webhooks along with questions');
  console.log('=============================================\n');
  
  // Step 1: Create test batch
  const batchCreated = await createTestBatch();
  if (!batchCreated) {
    console.error('❌ Failed to create test batch. Exiting...');
    return;
  }
  
  // Step 2: Test RPC function
  await testRpcFunction();
  
  // Step 3: Test direct update
  await testDirectUpdate();
  
  // Step 4: Test sending to webhook
  await testWebhookDirectly();
  
  console.log('\n🎉 All tests completed!');
  console.log('\n📝 Summary of test results:');
  console.log('- Created test batch with ID:', TEST_BATCH_ID);
  console.log('- Added answers to questions q1 and q2');
  console.log('- Sent the answers to webhook.site and n8n webhook');
  console.log('\n⚠️ Next steps:');
  console.log('1. Check your webhook.site URL to verify the payload contains both questions and answers');
  console.log('2. Check your n8n workflow to verify it received the form data correctly');
  console.log('3. Run the app and verify the answers are displayed correctly');
}

// Run the tests
runTests()
  .catch(err => {
    console.error('Error in test script:', err);
  }); 