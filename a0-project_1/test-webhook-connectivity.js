/**
 * Webhook Connectivity Test Script
 * 
 * This script tests direct connectivity to the webhook URL
 * to help diagnose issues with submitting answers.
 */

const fetch = require('node-fetch');

// Constants
const WEBHOOK_URLS = [
  // Test webhooks to verify connectivity - try both with and without https
  'https://webhook.site/3a1f3c1f-9e7d-4a2c-9de0-1b8c2f99d5a0',
  'webhook.site/3a1f3c1f-9e7d-4a2c-9de0-1b8c2f99d5a0',
  // Add your n8n webhook URL here to test it directly
  // 'https://your-n8n-instance.com/webhook/your-endpoint-id' 
];

// Test payload
const TEST_PAYLOAD = {
  question_batch_id: 'test-batch-123',
  research_id: 'test-research-1234',
  user_id: 'test-user-1234',
  questions: [
    { id: 'q1', text: 'Test question 1', answered: true },
    { id: 'q2', text: 'Test question 2', answered: true }
  ],
  answers: [
    { id: 'q1', question: 'Test question 1', answer: 'Test answer 1', answered: true },
    { id: 'q2', question: 'Test question 2', answer: 'Test answer 2', answered: true }
  ],
  submitted_at: new Date().toISOString()
};

// Function to test a webhook URL
async function testWebhookConnectivity(webhookUrl) {
  console.log(`\n===== Testing webhook URL: ${webhookUrl} =====`);
  
  try {
    // Fix URL if needed
    let url = webhookUrl;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
      console.log(`Added https:// prefix. Using URL: ${url}`);
    }
    
    console.log('Sending test payload...');
    const startTime = Date.now();
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_PAYLOAD),
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`Response status: ${response.status} (${duration}ms)`);
    
    if (response.ok) {
      console.log('✅ SUCCESS: Webhook connectivity test passed');
      try {
        const responseData = await response.json();
        console.log('Response data:', JSON.stringify(responseData, null, 2));
      } catch (e) {
        const responseText = await response.text();
        console.log('Response text:', responseText || '(empty response)');
      }
    } else {
      console.log('❌ FAILED: Webhook returned error status');
      const responseText = await response.text();
      console.log('Error response:', responseText || '(empty response)');
    }
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    console.error(error);
  }
}

// Main function
async function runTests() {
  console.log('========== WEBHOOK CONNECTIVITY TEST ==========');
  console.log('Testing connectivity to webhook URLs...');
  
  for (const url of WEBHOOK_URLS) {
    await testWebhookConnectivity(url);
  }
  
  console.log('\n========== TEST COMPLETED ==========');
}

// Run the tests
runTests(); 
 
 