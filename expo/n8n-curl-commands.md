# N8N Webhook Curl Commands

These commands help you test and debug the n8n webhook integration for your research app.

## Upload Research Result

Use this curl command to upload a research result directly to your application using the n8n webhook. Replace the placeholder values with your actual data.

```bash
curl -X POST "https://your-n8n-server.com/webhook/your-webhook-path" \
  -H "Content-Type: application/json" \
  -d '{
    "research_id": "your-research-id",
    "user_id": "user-id",
    "result": "# Research Result\n\nThis is a sample research result with Markdown formatting.\n\n## Key Findings\n\n1. Finding one\n2. Finding two\n3. Finding three\n\n## Conclusion\n\nThis is a conclusion paragraph that summarizes the research.",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }'
```

## Complete Flow Test

This command simulates the full n8n workflow by sending a research request and getting a result:

```bash
curl -X POST "https://your-n8n-server.com/webhook/your-trigger-webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "research_id": "test-'$(date +%s)'",
    "user_id": "test-user-id",
    "agent": "GeneralAgent",
    "query": "Latest developments in renewable energy",
    "breadth": 3,
    "depth": 3,
    "include_technical_terms": true,
    "output_format": "markdown"
  }'
```

## Direct Supabase Insert (For Testing)

If you need to bypass n8n for testing, you can insert a result directly to Supabase:

```bash
curl -X POST "https://your-supabase-url/rest/v1/research_results_new" \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{
    "result_id": "result-'$(date +%s)'",
    "research_id": "your-research-id",
    "user_id": "user-id",
    "result": "This is a test result inserted directly via API"
  }'
```

## Debugging Guidelines

1. Always check the n8n logs for any errors during webhook execution
2. Verify that your research_id exists in the research_history_new table before inserting a result
3. For webhook failures, check:
   - Correct URL and authentication 
   - JSON format in the payload
   - Network connectivity between n8n and your database

## Handling Multiple Results

If you're dealing with multiple results for the same research, ensure you're:
1. Using a unique result_id for each result
2. Setting the correct research_id to link back to the history
3. Sorting by created_at (descending) to get the latest result 