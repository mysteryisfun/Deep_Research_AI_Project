# Research Questions Integration Guide

This guide explains how to use the new research questions system that supports array-based questions, allowing multiple questions to be loaded and answered at once.

## Overview

The research questions feature has been enhanced to:

1. Support storing multiple questions in a single record (array-based)
2. Poll for updates every 2 seconds (increased from 5 seconds)
3. Send comprehensive data to webhooks, including all questions and answers
4. Maintain backward compatibility with the legacy question format

## Database Structure

The system now uses a table called `research_questions_array` that stores:

- `question_id`: A unique identifier for the batch
- `research_id`: Links to the research session
- `user_id`: The user ID
- `questions`: A JSONB array of question objects
- `answers`: A JSONB array of answer objects 
- `reply_webhook_url`: Optional webhook URL for sending answers
- Timestamps for creation and updates

## Usage Flow

1. **Research Query Submission**: 
   - User submits a research query via `ResearchParametersScreen`
   - System generates a `research_id` and stores it in `research_history_new`
   - User is automatically navigated to `ResearchQuestionsScreen`

2. **Questions Generation (Background)**:
   - External system (n8n, etc.) receives webhook notification
   - It generates questions and inserts them into `research_questions_array`
   - Each question has a unique ID within the array

3. **Questions Display and Monitoring**:
   - `ResearchQuestionsScreen` loads and displays questions
   - It polls every 2 seconds to check for new questions
   - Questions are converted from array format to a flat list for display

4. **Answer Submission**:
   - User answers questions and submits them
   - Answers are stored in Supabase and sent to the webhook URL
   - User is navigated back to the previous screen

## Testing

To test this functionality:

1. Run the test script to create sample questions:
   ```
   node a0-project/test-questions-submission.js
   ```
   This creates questions for a fixed test ID: `test-research-1234`

2. Use the normal app flow:
   - Navigate through the app starting from Login
   - When you reach `ResearchParametersScreen`, the form submission will navigate you to `ResearchQuestionsScreen`
   - If testing directly, you can use `test-research-1234` as your research ID

## Webhook Integration

When answers are submitted, the system:

1. Updates the Supabase record with the new answers
2. Sends a comprehensive payload to the webhook URL containing:
   - The full batch ID and research ID
   - All questions with their text and status
   - All answers with their corresponding question text
   - Timestamp of submission

## Important Notes

- The polling interval has been reduced to 2 seconds for faster updates
- The system maintains backward compatibility with the legacy question format
- All data is sent to both Supabase and the webhook, ensuring consistency
- Real-time monitoring is active even if the user navigates away and returns

## Troubleshooting

If you encounter issues:

1. Check the console logs for error messages
2. Verify the `research_id` is valid and exists in the database
3. Check that the webhook URL is accessible and properly formatted
4. Ensure that RLS policies allow the current user to access and modify the questions

## Next Steps

For further improvements, consider:

1. Implementing true real-time subscriptions instead of polling
2. Adding offline support for questions and answers
3. Enhancing the UI with animations for new questions
4. Adding support for different question types (multiple choice, etc.) 
 
 