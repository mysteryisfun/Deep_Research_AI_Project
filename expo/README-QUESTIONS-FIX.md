# Research Questions Webhook Fix

This document explains the fix for the research questions answer webhook functionality to ensure answers are properly stored in the database and sent to the webhook with complete data.

## The Problem

Two key issues were identified in the research questions functionality:

1. **Incomplete Webhook Payload**: When submitting an individual answer through the `submitAnswer` function, only that single answer was being sent to the webhook, without the context of other questions and answers in the batch.

2. **Unreliable Database Updates**: The client-side update process could potentially miss saving answers if there were connection issues or conflicts with the database state.

3. **Missing Answers in Webhook**: Answers were not being written to Supabase, and only the questions were being sent to the webhook.

## Summary of Solution

The solution works in two parts:

1. **Client-side improvements**:
   - More robust answer storage with multiple fallback mechanisms
   - Enhanced error handling and logging
   - Comprehensive payload sent to webhooks that includes both questions and answers
   
2. **Server-side improvements** (optional but recommended):
   - Added a server-side SQL function for more reliable answer updates
   - Improved data integrity with proper timestamps
   - Automatic question status updates

**Important Note**: The fix will work even if you don't add the server-side SQL function, thanks to the robust client-side fallback mechanisms.

## Test Results

The solution has been verified with the test script, which confirms:

✅ Answers are correctly stored in the database through direct updates  
✅ Both questions AND answers are sent to the webhook  
✅ The approach is resilient, with fallback mechanisms if the primary method fails  
✅ Payloads include full context for both regular webhooks and n8n wait nodes

## The Fix

### 1. Enhanced Webhook Payload

The `submitAnswer` function has been updated to:

- Send a comprehensive payload to the webhook that includes:
  - The individual answer being submitted (for backward compatibility)
  - All questions in the batch with their status
  - All answers submitted so far
  - Metadata about the research and question batch

- Support both regular webhooks and n8n wait nodes by:
  - Detecting n8n webhooks automatically
  - Using the appropriate format (JSON or multipart/form-data)
  - Including additional fields for easier processing in n8n

### 2. Robust Answer Storage

The system now uses a multi-layered approach to ensure answers are reliably stored:

1. **Primary Method**: Server-side function `update_single_batch_answer` with improved error handling
2. **Fallback Method 1**: Client-side array manipulation with full error handling
3. **Fallback Method 2**: Simplified minimal update if other methods fail

The SQL function now also:
- Properly updates the questions' answered status
- Adds timestamps to answers
- Provides detailed error reporting
- Enforces data integrity

### 3. Comprehensive Testing

A new test script (`test-webhook-answers.js`) is provided to verify:
- Answer storage in the database
- Webhook payload format and content
- Support for both regular webhooks and n8n wait nodes

## Applying the Fix

### Step 1: Apply the SQL Function (Optional)

#### Option A: Manual SQL Execution

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of the `a0-project/sql/update_research_answers.sql` file
4. Execute the SQL

#### Option B: Try the Automated Script (if you have pgexec permission)

```bash
node a0-project/scripts/apply-questions-fix.js
```

This script will:
1. Create the `update_single_batch_answer` function in your Supabase database with the more robust implementation
2. Test the function with sample data
3. Provide a curl example for manual testing

### Step 2: Verify the Fix

Run the comprehensive test script to verify that answers are properly stored and sent to the webhook:

```bash
node a0-project/test-webhook-answers.js
```

This script will:
1. Create a test question batch
2. Add answers using different methods (RPC, direct update)
3. Send the payload to both regular webhook and n8n webhook
4. Verify that answers are correctly stored and sent

### Step 3: Check Your Webhook Endpoints

After running the test script:
1. Check your webhook.site URL to see the complete payload with both questions and answers
2. Check your n8n workflow to verify it received the form data correctly

## Testing in the App

1. Open your app and navigate to a research session with questions
2. Answer a question and check:
   - The console logs for the complete webhook payload
   - The database to verify the answer was saved
   - The n8n workflow to confirm it received the full context with both questions and answers

## SQL Function Code

If you need to manually add the function to your database, here's the SQL code to paste into the Supabase SQL Editor:

```sql
-- Drop any existing version first to avoid conflicts
DROP FUNCTION IF EXISTS public.update_single_batch_answer(VARCHAR, VARCHAR, TEXT);

-- Create a simpler and more robust function to update a single answer in the batch
CREATE OR REPLACE FUNCTION public.update_single_batch_answer(
  p_question_id VARCHAR,     -- Base question ID (batch ID)
  p_question_item_id VARCHAR, -- Individual question item ID
  p_answer TEXT               -- The answer text
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
  question_record RECORD;
  updated_answers JSONB;
  existing_index INTEGER := -1;
  i INTEGER;
BEGIN
  -- First get the current record
  SELECT * INTO question_record 
  FROM research_questions_array 
  WHERE question_id = p_question_id;
  
  -- If record not found, return error
  IF question_record IS NULL THEN
    RAISE EXCEPTION 'Question batch with ID % does not exist', p_question_id;
  END IF;
  
  -- Initialize updated answers with current answers or empty array
  IF question_record.answers IS NULL THEN
    updated_answers := '[]'::jsonb;
  ELSE
    updated_answers := question_record.answers;
  END IF;
  
  -- Check if we already have an answer for this question
  IF jsonb_array_length(updated_answers) > 0 THEN
    FOR i IN 0..jsonb_array_length(updated_answers) - 1 LOOP
      IF updated_answers->i->>'id' = p_question_item_id THEN
        existing_index := i;
        EXIT;
      END IF;
    END LOOP;
  END IF;
  
  -- Generate timestamp for the answer
  DECLARE answer_timestamp TEXT := (now() AT TIME ZONE 'UTC')::text;
  
  -- If found, update the existing answer
  IF existing_index >= 0 THEN
    updated_answers := jsonb_set(
      updated_answers,
      ARRAY[existing_index::text],
      jsonb_build_object(
        'id', p_question_item_id,
        'text', COALESCE(updated_answers->existing_index->>'text', ''),
        'answer', p_answer,
        'answered', true,
        'updated_at', answer_timestamp
      )
    );
  ELSE
    -- If not found, add a new answer
    updated_answers := updated_answers || jsonb_build_object(
      'id', p_question_item_id,
      'text', '',
      'answer', p_answer,
      'answered', true,
      'created_at', answer_timestamp,
      'updated_at', answer_timestamp
    );
  END IF;
  
  -- Update the question record's answered status too
  -- First get the questions array
  DECLARE updated_questions JSONB := question_record.questions;
  DECLARE question_index INTEGER := -1;
  
  -- Find the question in the array
  IF jsonb_array_length(updated_questions) > 0 THEN
    FOR i IN 0..jsonb_array_length(updated_questions) - 1 LOOP
      IF updated_questions->i->>'id' = p_question_item_id THEN
        question_index := i;
        EXIT;
      END IF;
    END LOOP;
  END IF;
  
  -- If found, update the question's answered status
  IF question_index >= 0 THEN
    updated_questions := jsonb_set(
      updated_questions,
      ARRAY[question_index::text, 'answered'],
      'true'
    );
  END IF;
  
  -- Update both the answers and questions arrays in the database
  UPDATE research_questions_array
  SET 
    answers = updated_answers,
    questions = COALESCE(updated_questions, questions),
    updated_at = now()
  WHERE question_id = p_question_id
  RETURNING to_jsonb(research_questions_array.*) INTO result;
  
  -- If no rows were updated, something went wrong
  IF result IS NULL THEN
    RAISE EXCEPTION 'Failed to update answers for batch %', p_question_id;
  END IF;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in update_single_batch_answer(%,%,%): %', 
      p_question_id, p_question_item_id, left(p_answer, 50), SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a new RPC endpoint for this function
COMMENT ON FUNCTION update_single_batch_answer IS 'Updates a single answer in a question batch and marks the question as answered';
```

## Webhook Payload Format

The enhanced webhook payload now includes:

```json
{
  "question_id": "batch123-q1",
  "question_item_id": "q1",
  "research_id": "research456",
  "question": "What is your name?",
  "answer": "John Doe",
  
  "question_batch_id": "batch123",
  "user_id": "user789",
  
  "questions": [
    {"id": "q1", "text": "What is your name?", "answered": true},
    {"id": "q2", "text": "What is your age?", "answered": false}
  ],
  
  "answers": [
    {
      "id": "q1",
      "question": "What is your name?",
      "answer": "John Doe",
      "answered": true
    }
  ],
  
  "submitted_at": "2023-05-15T10:30:00Z"
}
```

This format provides complete context to the n8n workflow, making it easier to process the full state of the questions and answers.

## Troubleshooting

If you're still experiencing issues:

1. **RPC Function Not Available**: 
   - Make sure you've added the SQL function manually through the Supabase SQL Editor
   - Check for any SQL errors when executing the function

2. **Answers Not Showing in Webhooks**:
   - Check the console logs for error messages
   - Verify the test script works correctly
   - Ensure your webhook URL is correctly formatted and accessible

3. **Database Update Failures**:
   - The system now includes multiple fallback mechanisms
   - Check the console logs to see which method succeeded
   - If all methods fail, there might be a network or permission issue
