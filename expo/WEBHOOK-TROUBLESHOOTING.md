# Webhook Troubleshooting Guide

If you're experiencing issues with webhook requests not being sent to n8n or other webhook endpoints after submitting answers, follow these troubleshooting steps:

## 1. Test Basic Webhook Connectivity

Run the webhook connectivity test script to verify that your device can reach the webhook endpoints:

```bash
cd a0-project
node test-webhook-connectivity.js
```

This script will test connectivity to both the webhook.site test URL and any n8n URLs you've added to the script. Look for success messages or error responses.

## 2. Check the Webhook URL Format

Ensure that your webhook URLs are formatted correctly:

- They should begin with `http://` or `https://`
- The URL should be complete and valid
- For n8n, the webhook URL typically looks like: `https://your-n8n-instance.com/webhook/your-endpoint-id`

The latest code automatically adds `https://` if missing, but it's better to provide complete URLs.

## 3. Test with Fresh Question Data

Run the test question generation script to create new questions with the correct webhook URL:

```bash
cd a0-project
node test-questions-submission.js
```

This script creates questions with a properly formatted webhook URL for the test research ID `test-research-1234`.

## 4. Check Network Connectivity

Make sure your device has internet connectivity and can reach external services. Corporate firewalls or network restrictions might block outgoing webhook requests.

## 5. Examine Console Logs

When submitting answers, check the console logs for detailed information:

- Look for the "WEBHOOK PAYLOAD" section showing what's being sent
- Check the webhook response status code
- Look for any error messages related to the fetch operation

## 6. Test with webhook.site

If you're having issues with n8n specifically, try using [webhook.site](https://webhook.site) to create a temporary webhook endpoint for testing:

1. Go to webhook.site
2. Copy your unique URL
3. Update the `MOCK_WEBHOOK` constant in `test-questions-submission.js`
4. Run the script again to create questions with this URL
5. Submit answers in the app and check webhook.site for the received data

## 7. Verify n8n Configuration

If using n8n:

1. Make sure your n8n instance is running and accessible
2. Verify the webhook node is correctly configured to accept POST requests 
3. Check n8n logs for any errors when receiving webhook requests
4. Test the webhook endpoint directly using a tool like Postman or curl

## Common Issues and Solutions

### "No research ID provided" Error

If you see this error when trying to access the questions screen:

1. Make sure you're going through the normal app flow starting from Login
2. When submitting a research query, check that the `research_id` is correctly passed to the ResearchQuestionsScreen
3. You can test directly with the known test ID: `test-research-1234`

### Webhook Returns Error Status

If the webhook request returns an error status:

1. Check if the webhook endpoint is reachable (use the connectivity test script)
2. Verify that the payload format matches what the endpoint expects
3. Check for any authentication requirements on the webhook endpoint

### Nothing Happens After Submitting Answers

If the answers are updated in Supabase but not sent to the webhook:

1. Check that the questions have a valid `reply_webhook_url` in the database
2. Verify network connectivity
3. Look for any JavaScript errors in the console that might be interrupting execution

## Getting Additional Help

If you're still experiencing issues:

1. Gather the full console logs when submitting answers
2. Note any error messages displayed on screen or in the console
3. Document the steps you've taken to reproduce the issue
4. Contact technical support with this information 
 
 