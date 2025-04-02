# Supabase Integration with Client-Side ID Generation

This document explains how the application integrates with Supabase for data persistence while using client-side ID generation.

## Overview

The application uses a dual-storage approach:
1. **Primary**: Webhook to n8n (primary system of record)
2. **Secondary**: Supabase database (for persistence and history)

Client-side ID generation ensures consistency between these systems.

## Database Schema

We use VARCHAR-based IDs in our Supabase tables:

- `research_history_new`: Stores research queries
- `research_questions_new`: Stores questions related to research
- `research_progress_new`: Tracks research progress
- `research_results_new`: Stores research results

All tables use client-generated IDs and maintain foreign key relationships.

## Key Features

1. **Client-Side ID Generation**
   - IDs like `research-${timestamp}-${random}` are generated in the frontend
   - The same ID is used for both webhook and database operations
   - No reliance on Supabase for UUID generation

2. **Row-Level Security (RLS)**
   - RLS policies control access to tables
   - RPC functions bypass RLS when needed
   - Direct queries work with permissive policies

3. **Resilient Architecture**
   - Webhook calls happen first
   - Supabase storage is secondary
   - App continues to function even if database operations fail

## Implementation Details

### 1. Client-Side ID Generation Functions

```typescript
// Generate a unique research ID
export function generateResearchId(): string {
  return `research-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

// Generate a user ID (for testing or when auth is not available)
export function generateUserId(): string {
  return `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

// Generate IDs for other entities
export function generateEntityId(type: 'question' | 'progress' | 'result'): string {
  return `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}
```

### 2. Data Storage Functions

The app includes functions for storing and retrieving:
- Research history
- Research questions
- Research progress
- Research results

All functions handle errors gracefully and include fallbacks when RPC functions fail.

### 3. RPC Functions

SQL RPC functions are used to bypass RLS when needed:

```sql
-- Example RPC function to insert research history
CREATE OR REPLACE FUNCTION insert_research_history(
  p_research_id VARCHAR,
  p_user_id VARCHAR, 
  p_agent VARCHAR,
  p_query TEXT,
  p_breadth INTEGER,
  p_depth INTEGER,
  p_include_technical_terms BOOLEAN,
  p_output_format VARCHAR,
  p_status VARCHAR DEFAULT 'pending',
  p_created_at TIMESTAMPTZ DEFAULT now()
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  INSERT INTO research_history_new (
    research_id, user_id, agent, query, breadth, depth, 
    include_technical_terms, output_format, status, created_at
  ) VALUES (
    p_research_id, p_user_id, p_agent, p_query, p_breadth, p_depth,
    p_include_technical_terms, p_output_format, p_status, p_created_at
  )
  RETURNING to_jsonb(research_history_new.*) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Usage Example

```typescript
// In your component or service
import { sendResearchQuery } from '../backend/services/sendResearchQuery';
import { generateUserId } from '../utils/supabase';

const handleSubmit = async () => {
  // Generate user ID (or get from auth system in production)
  const userId = generateUserId();
  
  // Prepare parameters
  const params = {
    user_id: userId,
    agent: 'general',
    query: 'My research question',
    breadth: 3,
    depth: 4,
    include_technical_terms: true,
    output_format: 'Research Paper'
  };
  
  // Send query (handles both webhook and database)
  const result = await sendResearchQuery(params);
  
  if (result.success) {
    console.log('Generated research ID:', result.research_id);
    // Continue with app flow
  }
};
```

## Production Considerations

1. **Authentication**
   - In production, use authenticated user IDs instead of generated ones
   - Tighten RLS policies to ensure proper data isolation

2. **Error Handling**
   - The app continues to function even if Supabase operations fail
   - Webhook remains the primary system of record

3. **RLS Policies**
   - The current policies are deliberately permissive for testing
   - Review and tighten policies before deploying to production 
 
 