# N8n Webhook Integration Guide

This guide explains how to test the n8n webhook functionality, particularly for the "Wait" node which requires a specific request format.

## The Problem

When using n8n's "Wait" node, it requires data to be sent in `multipart/form-data` format, not in the standard JSON format that we were using. This was causing the webhook calls to fail when submitting answers to research questions.

## The Solution

The webhook functionality has been updated to:

1. Detect whether the webhook URL is for an n8n "Wait" node (containing "webhook-waiting" in the URL)
2. Use `multipart/form-data` format for n8n wait nodes and regular JSON format for other webhooks
3. Include all relevant data in both formats to ensure compatibility

## Testing the Functionality

A test screen has been created to help verify that the webhook functionality is working correctly. Here's how to use it:

1. Run the app - it will open directly to the test screen
2. Enter the n8n webhook URL (or use the pre-filled one)
3. Optionally modify the research ID, user ID, or test questions
4. Click "Create Test Questions" to create test questions in Supabase
5. Enter test answers in the input fields
6. Click "Submit Answers" to test the full submission flow, or "Test Webhook Directly" to bypass the database
7. Check the logs on the screen for detailed information about each step
8. Verify in n8n that the webhook was successfully received

## Files Modified

- `utils/questionsManager.ts`: Updated to support both normal webhooks and n8n wait webhooks
- `App.tsx`: Added the test screen as the initial route
- Added new test files:
  - `TestN8nWebhook.tsx`: Test screen for n8n webhook submission
  - `test-cleanup.js`: Script to clean up test data from Supabase

## Testing Flow

1. **Create Test Questions**:
   - Generates a new batch ID
   - Creates a record in the `research_questions_array` table with test questions
   - Sets the `reply_webhook_url` to your n8n webhook URL

2. **Submit Answers**:
   - Uses the same flow as the real app (through `submitAllAnswers`)
   - Detects the n8n webhook URL and sends data in the correct format
   - Updates the Supabase database with the answers
   - Logs detailed information about each step

3. **Direct Webhook Test**:
   - Bypasses the database updates
   - Directly constructs and sends a webhook request
   - Useful for isolating webhook issues from database issues

## How to Clean Up

After testing, run the cleanup script to remove all test data:

```bash
cd a0-project
node test-cleanup.js
```

## Returning to Normal App

To revert the app back to its normal flow, edit `App.tsx` and reorder the screens to have `Login` as the first screen:

```jsx
<Stack.Navigator 
  screenOptions={{
    headerShown: false,
    animation: 'slide_from_right'
  }}
>
  <Stack.Screen name="Login" component={LoginScreen} />
  {/* Other screens */}
  <Stack.Screen name="TestN8nWebhook" component={TestN8nWebhook} />
</Stack.Navigator>
```

## Troubleshooting

- If you see "Network request failed" errors, check your internet connection
- If the webhook is sent but not received by n8n, verify that your n8n instance is running and accessible
- Check the format of your webhook URL - it should include "webhook-waiting" to be detected as an n8n wait node
- If the request is failing with a 404 error, verify that the webhook endpoint exists in n8n

## Implementation Details

The key change is in the webhook sending logic in `submitAllAnswers`:

```javascript
// Check if this is an n8n wait node webhook
const isN8nWaitNode = webhookUrl.includes('webhook-waiting');

if (isN8nWaitNode) {
  // For n8n wait node, use multipart-form-data
  const formData = new FormData();
  formData.append('payload', JSON.stringify(webhookPayload));
  // Add individual fields for easier access in n8n
  formData.append('research_id', arrayData.research_id);
  // ... other fields
  
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
```

This ensures compatibility with both n8n wait nodes and regular webhooks. 