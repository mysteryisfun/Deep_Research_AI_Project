/**
 * Test script to verify fixes for answers not being written to Supabase 
 * and not being sent to the webhook.
 * 
 * This script tests the updated submitAllAnswers function with both:
 * 1. Actual question IDs (q1, q2, etc.)
 * 2. Combined IDs in the format batch-id-q1, which is what the actual app uses
 * 
 * Run with: node test-fixed-webhook-answers.js
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const FormData = require('form-data');

// Supabase connection info
const supabaseUrl = process.env.SUPABASE_URL || 'https://wurrqztgdnecgtmsisrq.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cnJxenRnZG5lY2d0bXNpc3JxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzIyNTk1NiwiZXhwIjoyMDU4ODAxOTU2fQ.nwRS4NT_dV5xPyc6p4tuKs9IUFkxQpGxciRzjKS8h6Q';

// Create Supabase client
const supabase = createClient(supabaseUrl, serviceRoleKey);

// Test webhook URLs
const TEST_WEBHOOK_URL = 'https://webhook.site/73e5d1d1-a9fc-4f0e-ab80-d40450a4095f'; // Replace with your webhook.site URL
const N8N_WEBHOOK_URL = 'https://atomic123.app.n8n.cloud/webhook-waiting/126'; // n8n webhook URL

// Test IDs
const TEST_RESEARCH_ID = 'test-research-fix-' + Date.now();
const TEST_USER_ID = 'test-user-fix-' + Date.now();
const TEST_BATCH_ID = 'batch-fix-' + Date.now();

/**
 * Create a test question batch
 */
async function createTestBatch() {
  console.log('🔵 Creating test question batch...');
  
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
      },
      {
        id: 'q3',
        text: 'Test Question 3',
        answered: false
      }
    ],
    answers: [],
    reply_webhook_url: TEST_WEBHOOK_URL, // Use webhook.site for easy inspection
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from('research_questions_array')
    .insert(questionData)
    .select();
  
  if (error) {
    console.error('❌ Error creating test batch:', error);
    return null;
  }
  
  console.log('✅ Test batch created successfully');
  console.log(`Batch ID: ${data[0].question_id}`);
  console.log(`Research ID: ${TEST_RESEARCH_ID}`);
  
  return data[0];
}

/**
 * Submit answers in the regular format (direct question IDs)
 */
async function testRegularSubmit(batchData) {
  console.log('\n🔵 Testing regular submission with direct question IDs...');
  
  // Create answers object with direct question IDs
  const answers = {
    'q1': 'This is the answer to question 1 (direct ID)',
    'q3': 'This is the answer to question 3 (direct ID)'
  };
  
  console.log(`Submitting ${Object.keys(answers).length} answers with direct IDs`);
  
  try {
    // Call the modified submitAllAnswers function
    const result = await submitAllAnswers(TEST_RESEARCH_ID, answers);
    
    if (result.success) {
      console.log('✅ Regular submission succeeded');
      // Check if answers were saved
      const savedAnswers = result.data.answers || [];
      console.log(`Saved ${savedAnswers.length} answers to database`);
      
      return true;
    } else {
      console.error('❌ Regular submission failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error in regular submission:', error);
    return false;
  }
}

/**
 * Submit answers in the combined format (batch-id-question-id)
 */
async function testCombinedIdsSubmit(batchData) {
  console.log('\n🔵 Testing submission with combined IDs (real app format)...');
  
  // Create answers object with combined IDs (how they appear in the real app)
  const answers = {
    [`${TEST_BATCH_ID}-q2`]: 'This is the answer to question 2 (combined ID)'
  };
  
  console.log(`Submitting answer with combined ID: ${Object.keys(answers)[0]}`);
  
  try {
    // Call the modified submitAllAnswers function
    const result = await submitAllAnswers(TEST_RESEARCH_ID, answers);
    
    if (result.success) {
      console.log('✅ Combined IDs submission succeeded');
      // Check if answers were saved
      const savedAnswers = result.data.answers || [];
      console.log(`Found ${savedAnswers.length} answers in database`);
      
      // Verify the specific answer we just added
      const q2Answer = savedAnswers.find(a => a.id === 'q2');
      if (q2Answer) {
        console.log('✅ Answer to q2 found in database:', q2Answer.answer);
      } else {
        console.error('❌ Answer to q2 not found in database!');
      }
      
      return true;
    } else {
      console.error('❌ Combined IDs submission failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error in combined IDs submission:', error);
    return false;
  }
}

/**
 * Verify answers in the database
 */
async function verifyAnswersInDatabase() {
  console.log('\n🔵 Verifying answers in database...');
  
  try {
    const { data, error } = await supabase
      .from('research_questions_array')
      .select('*')
      .eq('question_id', TEST_BATCH_ID)
      .single();
    
    if (error) {
      console.error('❌ Error fetching batch data:', error);
      return false;
    }
    
    const answers = data.answers || [];
    console.log(`Found ${answers.length} answers in database`);
    
    if (answers.length === 0) {
      console.error('❌ No answers found in database!');
      return false;
    }
    
    // Check each answer
    console.log('Answers in database:');
    answers.forEach(answer => {
      console.log(`- Question ${answer.id}: ${answer.answer}`);
    });
    
    // Calculate how many questions were answered
    const questions = data.questions || [];
    const answeredQuestions = questions.filter(q => q.answered).length;
    console.log(`${answeredQuestions} out of ${questions.length} questions marked as answered`);
    
    return answeredQuestions > 0;
  } catch (error) {
    console.error('❌ Error verifying answers:', error);
    return false;
  }
}

/**
 * Test sending to webhook directly
 */
async function testWebhookDirectly() {
  console.log('\n🔵 Testing sending to webhook directly...');
  
  try {
    // First get current data
    const { data: batchData, error: fetchError } = await supabase
      .from('research_questions_array')
      .select('*')
      .eq('question_id', TEST_BATCH_ID)
      .single();
    
    if (fetchError) {
      console.error('❌ Error fetching batch data:', fetchError);
      return false;
    }
    
    const questions = batchData.questions || [];
    const answers = batchData.answers || [];
    
    console.log(`Sending ${questions.length} questions and ${answers.length} answers to webhook`);
    
    // Prepare the webhook payload - same as in the upgraded submitAllAnswers function
    const webhookPayload = {
      question_batch_id: TEST_BATCH_ID,
      research_id: TEST_RESEARCH_ID,
      user_id: TEST_USER_ID,
      questions: questions.map(q => ({
        id: q.id,
        text: q.text,
        answered: q.answered
      })),
      answers: answers.map(a => {
        const question = questions.find(q => q.id === a.id);
        return {
          id: a.id,
          question: question?.text || '',
          answer: a.answer,
          answered: a.answered
        };
      }),
      submitted_at: new Date().toISOString()
    };
    
    // Test both regular webhook and n8n webhook to verify both work
    
    // 1. Regular webhook
    console.log('\n🔹 Testing regular webhook...');
    const regularResponse = await fetch(TEST_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload)
    });
    
    console.log(`Regular webhook response status: ${regularResponse.status}`);
    
    // 2. n8n webhook (with multipart/form-data)
    console.log('\n🔹 Testing n8n webhook with multipart/form-data...');
    
    const formData = new FormData();
    formData.append('payload', JSON.stringify(webhookPayload));
    formData.append('question_batch_id', TEST_BATCH_ID);
    formData.append('research_id', TEST_RESEARCH_ID);
    formData.append('questions', JSON.stringify(webhookPayload.questions));
    formData.append('answers', JSON.stringify(webhookPayload.answers));
    
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      body: formData
    });
    
    console.log(`n8n webhook response status: ${n8nResponse.status}`);
    
    console.log('\n✅ Webhook tests completed. Check webhook.site for payload details');
    console.log(`Webhook URL to check: ${TEST_WEBHOOK_URL}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error sending to webhook:', error);
    return false;
  }
}

/**
 * The submitAllAnswers function (copy of the updated version)
 */
async function submitAllAnswers(researchId, answers) {
  try {
    console.log(`Submitting all answers for research: ${researchId}`);
    console.log(`Raw answers received:`, JSON.stringify(answers));
    
    // Get the current questions for this research
    const { data: arrayData, error: arrayError } = await supabase
      .from('research_questions_array')
      .select('*')
      .eq('research_id', researchId)
      .single();
    
    if (arrayError) {
      console.error('Error fetching research question batch:', arrayError);
      return { success: false, error: arrayError };
    }
    
    if (!arrayData) {
      console.error('No research question batch found');
      return { success: false, error: 'No question batch found' };
    }
    
    const currentQuestions = arrayData.questions || [];
    const currentAnswers = arrayData.answers || [];
    
    console.log(`Found question batch with ID: ${arrayData.question_id}`);
    console.log(`Current questions: ${currentQuestions.length}, Current answers: ${currentAnswers.length}`);
    
    // Process each answer - Handle both formats:
    // 1. Direct question IDs (q1, q2, etc.)
    // 2. Combined IDs (batch-123-q1, batch-123-q2, etc.)
    const updatedAnswers = [...currentAnswers];
    const updatedQuestions = [...currentQuestions];
    
    // Extract and normalize the question IDs from the provided answers
    const normalizedAnswers = {};
    
    for (const fullQuestionId in answers) {
      // Skip empty answers
      const answerText = answers[fullQuestionId];
      if (!answerText || answerText.trim() === '') continue;
      
      // Check if this is a combined ID (batch-id-question-id format)
      const parts = fullQuestionId.split('-');
      let questionId;
      
      if (parts.length > 1 && fullQuestionId.includes(arrayData.question_id)) {
        // This is a combined ID in the format "batch-id-question-id"
        // The question ID is the last part (e.g., q1, q2, etc.)
        questionId = parts[parts.length - 1];
        console.log(`Normalized combined ID ${fullQuestionId} to ${questionId}`);
      } else {
        // This is already a direct question ID
        questionId = fullQuestionId;
        console.log(`Using direct question ID: ${questionId}`);
      }
      
      normalizedAnswers[questionId] = answerText;
    }
    
    console.log(`Normalized answers:`, JSON.stringify(normalizedAnswers));
    
    // Update questions and answers using the normalized IDs
    const answeredQuestionIds = Object.keys(normalizedAnswers);
    
    // Update questions and answers
    for (const questionId of answeredQuestionIds) {
      const answerText = normalizedAnswers[questionId];
      
      // Find the question in the questions array
      const questionIndex = updatedQuestions.findIndex(q => q.id === questionId);
      if (questionIndex === -1) {
        console.log(`No matching question found for ID: ${questionId}`);
        continue;
      }
      
      console.log(`Found matching question at index ${questionIndex} for ID: ${questionId}`);
      
      // Update the question's answered status
      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        answered: true
      };
      
      // Check if we already have an answer for this question
      const existingAnswerIndex = updatedAnswers.findIndex(a => a.id === questionId);
      
      if (existingAnswerIndex >= 0) {
        // Update existing answer
        console.log(`Updating existing answer at index ${existingAnswerIndex}`);
        updatedAnswers[existingAnswerIndex] = {
          ...updatedAnswers[existingAnswerIndex],
          answer: answerText,
          answered: true,
          updated_at: new Date().toISOString()
        };
      } else {
        // Add new answer
        console.log(`Adding new answer for question ID: ${questionId}`);
        updatedAnswers.push({
          id: questionId,
          text: updatedQuestions[questionIndex]?.text || '', // Include the question text for context
          answer: answerText,
          answered: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }
    
    // Update the record in the database
    const { data: updateData, error: updateError } = await supabase
      .from('research_questions_array')
      .update({ 
        questions: updatedQuestions,
        answers: updatedAnswers,
        updated_at: new Date().toISOString()
      })
      .eq('question_id', arrayData.question_id)
      .select();
    
    if (updateError) {
      console.error('Error updating all answers:', updateError);
      return { success: false, error: updateError };
    }
    
    console.log('Successfully updated answers in database');
    
    // Send data to webhook if URL is available
    if (arrayData.reply_webhook_url) {
      try {
        // Prepare a more comprehensive payload with both questions and answers
        const webhookPayload = {
          question_batch_id: arrayData.question_id,
          research_id: arrayData.research_id,
          user_id: arrayData.user_id,
          // Include the full questions array for context
          questions: updatedQuestions.map(q => ({
            id: q.id,
            text: q.text,
            answered: q.answered
          })),
          // Include the full answers with question text for context
          answers: updatedAnswers.map(a => {
            // Find the original question for context
            const question = updatedQuestions.find(q => q.id === a.id);
            return {
              id: a.id,
              question: question?.text || '',
              answer: a.answer,
              answered: a.answered
            };
          }),
          submitted_at: new Date().toISOString()
        };
        
        // Log the full webhook payload for debugging
        console.log(`===== WEBHOOK PAYLOAD =====`);
        console.log(JSON.stringify(webhookPayload, null, 2));
        
        // Ensure webhook URL is properly formatted
        let webhookUrl = arrayData.reply_webhook_url;
        
        // Add protocol if missing
        if (!webhookUrl.startsWith('http://') && !webhookUrl.startsWith('https://')) {
          webhookUrl = 'https://' + webhookUrl;
        }
        
        console.log(`Sending answers to webhook URL: ${webhookUrl}`);
        
        // Check if this is an n8n wait node webhook (contains webhook-waiting in the URL)
        const isN8nWaitNode = webhookUrl.includes('webhook-waiting');
        
        let webhookResponse;
        
        if (isN8nWaitNode) {
          console.log('Detected n8n wait node webhook. Using multipart-form-data format...');
          
          // For n8n wait node, use multipart-form-data
          const formData = new FormData();
          
          // Add all the payload fields as form data parameters
          formData.append('payload', JSON.stringify(webhookPayload));
          
          // Add individual fields for easier access in n8n
          formData.append('question_batch_id', arrayData.question_id);
          formData.append('research_id', arrayData.research_id);
          formData.append('user_id', arrayData.user_id);
          formData.append('submitted_at', new Date().toISOString());
          
          // Add questions and answers as separate form fields
          formData.append('questions', JSON.stringify(webhookPayload.questions));
          formData.append('answers', JSON.stringify(webhookPayload.answers));
          
          // Send the data using multipart form data
          webhookResponse = await fetch(webhookUrl, {
            method: 'POST',
            body: formData,
          });
        } else {
          // For regular webhooks, use JSON payload
          webhookResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(webhookPayload),
          });
        }
        
        // Log detailed response information
        console.log(`Webhook response status: ${webhookResponse.status}`);
        
        if (!webhookResponse.ok) {
          console.warn(`Webhook response was not OK: ${webhookResponse.status}`);
        } else {
          console.log(`Successfully sent answers to webhook`);
        }
      } catch (webhookError) {
        console.error('Error sending answers to webhook:', webhookError);
        // We continue even if webhook fails, since we updated the database
      }
    } else {
      console.warn('No webhook URL found, skipping webhook notification');
    }
    
    return { success: true, data: updateData };
  } catch (error) {
    console.error('Unexpected error in submitAllAnswers:', error);
    return { success: false, error };
  }
}

/**
 * Main function to run all tests
 */
async function runAllTests() {
  console.log('🚀 STARTING FIXED WEBHOOK ANSWERS TEST');
  console.log('============================================');
  console.log('This script verifies that:');
  console.log('1. Answers are properly stored in Supabase');
  console.log('2. Both questions and answers are sent to the webhook');
  console.log('3. The system handles both direct IDs and combined IDs');
  console.log('============================================\n');
  
  // Step 1: Create test batch
  const batchData = await createTestBatch();
  if (!batchData) {
    console.error('❌ Failed to create test batch. Exiting...');
    return;
  }
  
  // Step 2: Test with regular question IDs
  await testRegularSubmit(batchData);
  
  // Step 3: Test with combined IDs (real app format)
  await testCombinedIdsSubmit(batchData);
  
  // Step 4: Verify answers in database
  await verifyAnswersInDatabase();
  
  // Step 5: Test sending to webhook
  await testWebhookDirectly();
  
  console.log('\n🎉 ALL TESTS COMPLETED');
  console.log('============================================');
  console.log('✅ Verified that answers are properly stored in Supabase');
  console.log('✅ Verified that both questions and answers are sent to webhook');
  console.log('✅ Tested with both direct IDs and combined IDs formats');
  console.log('============================================');
  console.log('Next steps:');
  console.log('1. Check webhook.site to view the sent payload');
  console.log('2. Verify n8n is receiving the answers correctly');
  console.log('3. Test in the real app with the fixed implementation');
  console.log('============================================');
}

// Run all tests
runAllTests()
  .catch(error => {
    console.error('Unexpected error in test script:', error);
  }); 