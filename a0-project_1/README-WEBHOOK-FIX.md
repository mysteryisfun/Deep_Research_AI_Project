# Research Questions Webhook Fix

This document explains the recent fixes made to ensure answers are properly stored in Supabase and sent to webhook endpoints.

## Issues Fixed

1. **Answers Not Being Stored in Supabase:**
   - Answer updates weren't being properly saved to the database in some cases.
   - Answers were missing when questions had combined IDs (e.g., `batch-123-q1`).

2. **Incomplete Webhook Payloads:**
   - Only questions were being sent to the webhook, without the answers.
   - The payload was missing context, making it difficult for n8n to process.

## Solution Implemented

### 1. ID Normalization

We implemented a robust ID normalization system that can handle both direct question IDs (e.g., `q1`) and combined IDs (e.g., `batch-123-q1`):

```javascript
// Extract and normalize the question IDs from the provided answers
const normalizedAnswers = {};

for (const fullQuestionId in answers) {
  // Check if this is a combined ID (batch-id-question-id format)
  const parts = fullQuestionId.split('-');
  let questionId;
  
  if (parts.length > 1 && fullQuestionId.includes(arrayData.question_id)) {
    // This is a combined ID in the format "batch-id-question-id"
    // The question ID is the last part (e.g., q1, q2, etc.)
    questionId = parts[parts.length - 1];
  } else {
    // This is already a direct question ID
    questionId = fullQuestionId;
  }
  
  normalizedAnswers[questionId] = answerText;
}
```

### 2. Enhanced Database Updates

Updates to the database now:
- Include timestamps for better tracking
- Include the question text for context
- Mark questions as answered
- Work with both direct and combined IDs

### 3. Comprehensive Webhook Payload

Webhook calls now include:
- Complete questions array with their answered status
- Complete answers array with the question text
- Metadata about the research, user, and timestamps
- Support for both regular webhooks and n8n wait nodes

Example webhook payload:
```json
{
  "question_batch_id": "batch-123",
  "research_id": "research-456",
  "user_id": "user-789",
  "questions": [
    {"id": "q1", "text": "Question 1 text", "answered": true},
    {"id": "q2", "text": "Question 2 text", "answered": false}
  ],
  "answers": [
    {
      "id": "q1",
      "question": "Question 1 text",
      "answer": "User's answer to question 1",
      "answered": true
    }
  ],
  "submitted_at": "2023-05-15T10:30:00Z"
}
```

### 4. Improved Error Handling and Logging

Added extensive logging to help diagnose issues:
- Logging of raw answers received
- Logging of question ID normalization
- Logging of database update results
- Logging of webhook response status

## Files Updated

1. **utils/questionsManager.ts**
   - Updated `submitAllAnswers` function to properly handle different ID formats
   - Enhanced the webhook payload creation
   - Added detailed logging and more robust error handling

2. **components/ResearchQuestions.tsx**
   - Added logging to track answer submission
   - Fixed handling of question IDs in the `handleSubmitAll` function

3. **screens/ResearchQuestionsScreen.tsx**
   - Added diagnostic logging and enhanced error handling
   - Added verification of answer storage success

## Testing

A dedicated test script (`test-fixed-webhook-answers.js`) was created to verify:
1. Storage of answers with direct question IDs
2. Storage of answers with combined IDs (as used in the real app)
3. Proper inclusion of both questions and answers in webhook payloads
4. Support for different webhook formats (JSON and multipart/form-data)

## How to Verify

1. Run the test script:
   ```
   node a0-project/test-fixed-webhook-answers.js
   ```

2. Test in the actual app:
   - Navigate to a research questions screen
   - Submit answers using the "Submit All Answers" button
   - Check the logs to verify the answers are saved and sent to the webhook

3. Check webhook receiver:
   - Verify the payload includes both questions and answers
   - Confirm the format matches the expected format for n8n processing 