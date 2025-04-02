# Array-Based Questions Implementation

This document outlines the implementation of the array-based questions feature, which allows for storing multiple questions in a single record and submitting all answers at once.

## Database Structure

The feature uses a new table called `research_questions_array` with the following structure:

```sql
CREATE TABLE research_questions_array (
  question_id VARCHAR PRIMARY KEY,
  research_id VARCHAR NOT NULL,
  user_id VARCHAR NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  answers JSONB DEFAULT '[]'::jsonb,
  reply_webhook_url VARCHAR,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Data Format

Questions and answers are stored as JSONB arrays with the following structure:

**Questions:**
```json
[
  {
    "id": "q1",
    "text": "What is your main research objective?",
    "answered": false
  },
  {
    "id": "q2",
    "text": "What methodology do you plan to use?",
    "answered": false
  }
]
```

**Answers:**
```json
[
  {
    "id": "q1",
    "answer": "My objective is to develop a new theoretical framework",
    "answered": true
  },
  {
    "id": "q2",
    "answer": "I plan to use mixed methods research",
    "answered": true
  }
]
```

## Integration Notes

The implementation maintains backward compatibility with the previous single-question-per-row format while adding new capabilities:

1. **Backward Compatibility**: The `questionsManager.ts` utility maintains backward compatibility by converting array-based questions to the old format when needed.

2. **Single Submit Button**: The UI now displays a single "Submit All Answers" button at the bottom of the question list instead of individual submit buttons for each question.

3. **Comprehensive Webhook Payload**: When submitting answers, both questions and answers are sent to the webhook, providing complete context for the research session.

4. **Real-time Updates**: The implementation includes real-time subscription to keep the UI updated when questions change.

## Setting Up

To use this feature, the following steps are required:

1. **Execute SQL**: Run the SQL commands in `a0-project/sql/update_research_questions.sql` in your Supabase SQL Editor to create the necessary table, policies, and functions.

2. **Frontend Integration**: The `ResearchQuestions` component is now integrated into the `ResearchChatScreen` and will display questions for the current research session.

## Benefits

The array-based approach offers several benefits:

1. **Efficiency**: Reduces the number of database records and API calls needed to manage questions.

2. **Atomic Operations**: All answers can be submitted in a single transaction, ensuring data consistency.

3. **Improved UX**: Users can see all questions at once and decide which ones to answer before submitting.

4. **Context-Rich Webhook Integration**: The webhook receives both questions and answers, providing full context.

5. **Performance**: Reduces the load on the database by storing multiple questions in a single record.

## Data Flow

1. **Creation**: Questions are created for a research session and stored in the array-based table.

2. **Retrieval**: The `ResearchQuestions` component fetches questions for the current research ID.

3. **Monitoring**: Real-time updates keep the UI in sync with the database.

4. **Submission**: All answers are submitted at once and sent to the webhook if a URL is provided.

## Error Handling

The implementation includes robust error handling:

1. **Graceful Fallback**: If the array-based table is not available, the system will fall back to the legacy table.

2. **Webhook Failures**: If the webhook request fails, the answers are still saved to the database.

3. **Loading States**: The UI displays loading indicators while questions are being fetched.

## Implementation Details

The feature is implemented across several files:

1. **SQL**: `a0-project/sql/update_research_questions.sql` contains the database setup.

2. **Backend Logic**: `a0-project/utils/questionsManager.ts` contains the utility functions for managing questions.

3. **UI Component**: `a0-project/components/ResearchQuestions.tsx` handles the rendering and interaction.

4. **Screen Integration**: `a0-project/screens/ResearchChatScreen.tsx` integrates the component into the main flow.
1. When a research session starts, a single record with multiple questions is created
2. The frontend retrieves and monitors this record for changes
3. As users answer questions, the `answers` array is updated with the responses
4. Real-time functionality notifies the frontend of any changes to the record

### Error Handling

- If the table doesn't exist, the system falls back to the legacy table
- Comprehensive error logging helps diagnose issues
- Backward compatibility ensures the app continues to function during migration

## Next Steps

1. Migrate existing data from the old structure to the new structure
2. Update webhook integration to handle the new array format
3. Gradually phase out the legacy table once all systems are updated