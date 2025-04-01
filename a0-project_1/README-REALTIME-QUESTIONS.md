# Real-time Array-Based Questions Implementation

This document explains how to set up and use the real-time array-based questions feature in the application.

## Overview

The real-time array-based questions feature allows:

1. Storing multiple questions in a single database record
2. Real-time monitoring of questions and updates
3. Single-click submission of all answers
4. Sending both questions and answers to the webhook

## Setup Instructions

### Database Setup

1. Run the SQL commands in `sql/update_research_questions.sql` to create the necessary table structure
2. Run the SQL commands in `sql/setup-realtime.sql` to enable real-time functionality for the table

### Testing with the Test Script

You can test the functionality by running:

```bash
node test-array-questions.js
```

This script demonstrates:
- Creating a batch of questions with a webhook URL
- Monitoring for real-time updates
- Submitting all answers at once
- Sending the complete data to the webhook

## Using in the App

The feature is integrated into the ResearchChatScreen and works as follows:

1. Questions are loaded and displayed in real-time when the research session starts
2. Users can enter answers to the questions
3. When ready, users can submit all answers at once with the "Submit All Answers" button
4. The complete set of questions and answers is sent to the webhook URL

## Data Structure

### Questions Format

Questions are stored in a JSONB array with this structure:

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

### Answers Format

Answers are stored in a similar JSONB array:

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

## Webhook Integration

When answers are submitted, the webhook receives a comprehensive payload that includes:

- The question batch ID
- The research ID and user ID
- The full questions array with updated answered status
- The full answers array with corresponding question text for context

This ensures that the webhook has complete context for processing the answers.

## Implementation Details

The implementation consists of several key components:

1. **Database Table**: `research_questions_array` stores questions and answers as JSONB arrays
2. **Real-time Subscription**: Monitors for updates to questions and answers
3. **User Interface**: Shows questions with a loading animation while fetching
4. **Submission Logic**: Handles submitting all answers at once and sending them to the webhook

## Troubleshooting

### No Questions Displayed

If questions are not displaying:

1. Make sure the SQL commands in both SQL files have been executed
2. Check that the research ID is correctly passed to the ResearchQuestions component
3. Verify that the Supabase URL and key are correct

### Real-time Updates Not Working

If real-time updates are not working:

1. Ensure the `supabase_realtime` publication includes the `research_questions_array` table
2. Check the console for any subscription errors
3. Try restarting the Supabase client

### Webhook Not Receiving Data

If the webhook is not receiving data:

1. Verify the webhook URL is correct in your database
2. Check that the URL is accessible from your application
3. Inspect the network requests in your browser's developer tools 
 
 