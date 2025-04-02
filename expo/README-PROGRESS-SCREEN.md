# Research Progress Screen

This document outlines the Research Progress feature, including its functionality, database structure, and testing procedures.

## The Problem

There are two key issues that were addressed in implementing the Research Progress feature:

1. **UUID vs TEXT IDs**: The `research_progress_new` table uses TEXT as the data type for `progress_id`, not UUID. The original stored procedure for adding links was expecting a UUID parameter, causing errors when trying to add links to topics with TEXT IDs.

2. **Foreign Key Constraint**: The `research_progress_new` table has a foreign key constraint that requires a valid `research_id` to exist in the `research_history_new` table before a topic can be added.

## The Fix

### 1. TEXT ID Fix

The `add_link_to_topic` function has been simplified to work only with TEXT IDs. The SQL script in `a0-project/sql/link_function_fix.sql` contains the corrected function that:

- Uses TEXT data type for the `p_progress_id` parameter
- Properly initializes the links array if it is NULL
- Adds a timestamp to each link
- Checks if the topic exists and reports a clear error message
- Prevents duplicate links from being added to a topic
- Includes comprehensive error handling

### 2. Row Level Security (RLS) Access

If you encounter permission errors when using the RPC function, you can use the service role key to bypass RLS:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cnJxenRnZG5lY2d0bXNpc3JxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzIyNTk1NiwiZXhwIjoyMDU4ODAxOTU2fQ.nwRS4NT_dV5xPyc6p4tuKs9IUFkxQpGxciRzjKS8h6Q
```

This is useful for server-side operations or testing where you need to bypass the access restrictions.

### 3. Foreign Key Constraint

The test implementation now handles the foreign key constraint by:
- First checking if a matching research history entry exists
- Creating a parent entry in the `research_history_new` table if needed
- Then creating topics in the `research_progress_new` table

## Testing the Research Progress Feature

The improved test script `test-progress-screen.js` provides comprehensive testing capabilities for the Research Progress feature.

### Running the Tests

To run the tests, follow these steps:

1. Install the required dependencies if not already installed:
   ```
   npm install @supabase/supabase-js crypto
   ```

2. Run the basic tests with anonymous key (normal user access):
   ```
   node test-progress-screen.js
   ```

3. Run the tests with service role key (bypasses RLS):
   ```
   node test-progress-screen.js --use-service-role
   ```

4. Run the tests and generate sample topics:
   ```
   node test-progress-screen.js --generate-samples
   ```

### What the Tests Cover

The test script covers several key aspects of the Research Progress feature:

1. **Topic Creation**: Tests creating topics with TEXT IDs in the `research_progress_new` table
2. **Direct Link Addition**: Tests adding links directly to a topic by updating the links array
3. **RPC Function Testing**: Tests the `add_link_to_topic` RPC function with TEXT IDs
4. **Sample Data Generation**: Creates sample topics with links for testing the UI

### Viewing Test Results in the App

After running the tests with the `--generate-samples` flag, you can view the generated sample topics in the app:

1. Navigate to the Research Progress screen
2. Look for the research ID displayed in the test output
3. The sample topics and links should be displayed in the UI

## ResearchProgressScreen Features

The ResearchProgressScreen now includes:

1. A floating action button to add links directly to the current active topic
2. A modal with input fields for URL and title
3. Integration with the ResearchProgressMonitor for real-time updates

## Manual Testing with Curl

You can test the `add_link_to_topic` RPC function directly using curl with either the anonymous key or service role key:

### Using Anonymous Key (Client-Side)

```bash
curl -X POST 'https://wurrqztgdnecgtmsisrq.supabase.co/rest/v1/rpc/add_link_to_topic' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "p_progress_id": "your-topic-id",
    "p_url": "https://example.com/test",
    "p_title": "Test Link"
  }'
```

### Using Service Role Key (Server-Side/Admin)

```bash
curl -X POST 'https://wurrqztgdnecgtmsisrq.supabase.co/rest/v1/rpc/add_link_to_topic' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cnJxenRnZG5lY2d0bXNpc3JxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzIyNTk1NiwiZXhwIjoyMDU4ODAxOTU2fQ.nwRS4NT_dV5xPyc6p4tuKs9IUFkxQpGxciRzjKS8h6Q' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cnJxenRnZG5lY2d0bXNpc3JxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzIyNTk1NiwiZXhwIjoyMDU4ODAxOTU2fQ.nwRS4NT_dV5xPyc6p4tuKs9IUFkxQpGxciRzjKS8h6Q' \
  -H 'Content-Type: application/json' \
  -d '{
    "p_progress_id": "your-topic-id",
    "p_url": "https://example.com/test",
    "p_title": "Test Link"
  }'
```

Replace `your-topic-id` with an actual topic ID from your database.

## Applying the SQL Fix

To apply the SQL fix to your database, you can run:

```bash
node scripts/apply-sql-fix.js
```

This script:
1. Drops any existing `add_link_to_topic` functions
2. Creates a new TEXT-only version of the function
3. Tests the function to ensure it works
4. Generates curl command examples for later use

## TestProgressScreen

A TestProgressScreen is also available for interactive testing of the Research Progress feature. It provides:

1. Functions to prepare research history entries
2. Functions to create topics and add links
3. A clean interface for testing different aspects of the feature
4. Detailed logging of all actions and errors

Access it through the app's developer menu or navigation.

## Research Completion

The Research Progress screen has been enhanced with automatic research completion detection. When the research is complete, a final topic with "research_done" indicator is added to mark completion.

### How Research Completion Works

1. **Automatic Detection**: The system monitors progress and considers research complete when:
   - The expected number of topics (calculated from breadth/depth) has been reached
   - OR a topic containing "research_done" is found

2. **Completion Marking**: When research is deemed complete:
   - A final topic with "Research Complete research_done" title is added
   - The research history status is updated to "completed"
   - UI shows completion indicators and animations
   - A "View Results" button appears to take users to the results screen

3. **Manual Triggering**: Research can also be marked as complete:
   - From the test screen using the `markResearchAsComplete` function
   - From the n8n webhook by sending a completion event

### Visual Indicators

The Research Progress screen uses visual cues to show completion:
- A green progress bar (instead of gradient) when complete
- A "Research Complete" badge in the progress summary
- The final topic card has green styling and a "Research Complete" badge
- The "View Results" button appears at the bottom of the screen

## Removing the Test Screen

When you're ready to remove the test screen:

1. Remove or comment out the test button in the initialization screen in `App.tsx`.
2. Remove or comment out the `<Stack.Screen name="TestProgressScreen" component={TestProgressScreen} />` line in `App.tsx`.

The test screen is designed to be easily removable without affecting the rest of the application.

## Function Overloading Fix

There was an issue with function overloading that caused an error:

```
300 - {"code":"PGRST203","details":null,"hint":"Try renaming the parameters or the function itself in the database so function overloading can be resolved","message":"Could not choose the best candidate function between: public.add_link_to_topic(p_progress_id => text, p_url => text, p_title => text), public.add_link_to_topic(p_progress_id => uuid, p_url => text, p_title => text)"}
```

This has been fixed by:

1. Properly implementing function overloading in PostgreSQL by creating two separate functions:
   - One that handles TEXT IDs: `add_link_to_topic(p_progress_id TEXT, p_url TEXT, p_title TEXT)`
   - One that handles UUID IDs: `add_link_to_topic(p_progress_id UUID, p_url TEXT, p_title TEXT)`

2. Running the SQL script in `sql/link_function_fix.sql` using the `scripts/apply-sql-fix.js` script, which:
   - Drops the existing functions to avoid conflicts
   - Creates both versions with proper parameter typing
   - Tests the functions to ensure they work correctly

## New Features in Research Progress Screen

The Research Progress screen has been enhanced with new capabilities:

1. **Add Link Button**: A floating action button that appears when:
   - There are topics in the research session
   - The research is not yet complete

2. **Add Link Modal**: Allows adding links to the current active topic:
   - Enter a URL and title
   - Uses the fixed RPC function `add_link_to_topic`
   - Validates inputs before submission
   - Shows success/error notifications
   - Auto-refreshes the screen after adding a link

3. **Integration with ResearchProgressMonitor**: Automatically monitors research progress and marks it as complete when criteria are met.

## Usage Instructions

### Adding Links Directly

1. Navigate to the Research Progress screen
2. Tap the floating "+" button in the bottom-right corner
3. Enter the URL and title for the link
4. Tap "Add Link"

The link will be added to the most recent topic (the one at the top of the list). This is useful for manually adding references during the research process. 