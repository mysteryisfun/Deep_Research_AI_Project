/**
 * Simple Webhook Test Script
 * Run directly with Node.js: node test-webhook.js
 */

// Import axios for HTTP requests
const axios = require('axios');

// n8n webhook URL
const WEBHOOK_URL = 'https://atomic123.app.n8n.cloud/webhook-test/055cedaa-a313-4625-a41c-7e7f9560b7a3';

// Main test function
async function runTest() {
  console.log('🔶 Starting webhook test...');
  
  // Generate a unique test ID for this run
  const testId = `test-${Date.now()}`;
  const timestamp = new Date().toISOString();
  
  // Create test data
  const testData = {
    research_id: testId,
    user_id: 'test-user-webhook',
    agent: 'general',
    query: `Test query from Node.js webhook script ${timestamp}`,
    breadth: 3,
    depth: 4,
    include_technical_terms: true,
    output_format: 'Blog',
    status: 'pending',
    created_at: timestamp
  };
  
  console.log('📝 Test data prepared:', testData);
  
  try {
    // Attempt to send to webhook
    console.log('📤 Sending data to webhook...');
    const response = await axios.post(WEBHOOK_URL, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ SUCCESS! Response received:');
    console.log('  - Status:', response.status);
    console.log('  - Data:', response.data);
    console.log('\n🎉 Webhook test completed successfully!');
    
  } catch (err) {
    console.error('❌ ERROR sending to webhook:');
    if (err.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('  - Status:', err.response.status);
      console.error('  - Data:', err.response.data);
      console.error('  - Headers:', err.response.headers);
    } else if (err.request) {
      // The request was made but no response was received
      console.error('  - No response received');
      console.error('  - Request:', err.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('  - Error message:', err.message);
    }
  }
}

// Run the test
console.log('🚀 Running webhook direct test\n');
runTest()
  .catch(err => console.error('🔴 Top-level error:', err))
  .finally(() => console.log('\n🏁 Test script execution complete')); 
 
 