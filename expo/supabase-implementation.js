/**
 * IMPLEMENTATION GUIDE FOR SUPABASE INTEGRATION
 * 
 * This guide outlines the steps to integrate the Supabase VARCHAR-based 
 * tables with client-side ID generation into your React Native app.
 */

// ===== OVERVIEW =====

/*
What we've accomplished:
1. Created new tables with VARCHAR IDs instead of UUIDs
2. Set up foreign key relationships between these tables
3. Added RLS policies to control access
4. Created RPC functions to bypass RLS when needed
5. Tested both direct queries and RPC function calls

The test results show that:
- The RPC function method works perfectly for inserts
- Direct queries now work with the updated RLS policies
- Foreign key relationships are maintained properly
*/

// ===== IMPLEMENTATION STEPS =====

/*
Follow these steps to update your React Native app:

1. Update utils/supabase.ts with the new storeResearchHistory function
2. Update backend/services/sendResearchQuery.tsx to generate client-side IDs
3. Update any screens that retrieve research history to use the new tables
*/

// ===== EXAMPLE 1: Updated storeResearchHistory function =====

/*
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_KEY } from '@env';

// Update the interface to specify research_id as a string
export interface ResearchData {
  research_id: string;  // Client-generated ID
  user_id: string;
  agent: string;
  query: string;
  breadth: number;
  depth: number;
  include_technical_terms: boolean;
  output_format: string;
  status?: string;
  created_at?: string;
  completed_at?: string | null;
}

// Create a Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Updated function to work with both the new tables and legacy tables
export async function storeResearchHistory(data: ResearchData): Promise<{ success: boolean; data?: any; error?: any }> {
  if (!data.research_id) {
    console.error('Research ID is required for storing research history');
    return { success: false, error: 'Missing research_id' };
  }

  try {
    console.log('Attempting to store research history with ID:', data.research_id);
    
    // 1. First try direct insert to the new table
    const { data: insertedData, error: insertError } = await supabase
      .from('research_history_new')
      .insert([data])
      .select();
    
    if (insertError) {
      console.log('Direct insert failed, attempting RPC function:', insertError.message);
      
      // 2. If direct insert fails, try using the RPC function
      const { data: rpcData, error: rpcError } = await supabase.rpc('insert_research_history', {
        p_research_id: data.research_id,
        p_user_id: data.user_id,
        p_agent: data.agent,
        p_query: data.query,
        p_breadth: data.breadth,
        p_depth: data.depth,
        p_include_technical_terms: data.include_technical_terms,
        p_output_format: data.output_format,
        p_status: data.status || 'pending',
        p_created_at: data.created_at || new Date().toISOString()
      });
      
      if (rpcError) {
        console.error('Both direct insert and RPC function failed:', rpcError.message);
        return { success: false, error: rpcError };
      }
      
      console.log('Successfully stored research history using RPC function');
      return { success: true, data: rpcData };
    }
    
    console.log('Successfully stored research history with direct insert');
    return { success: true, data: insertedData };
  } catch (error) {
    console.error('Unexpected error storing research history:', error);
    return { success: false, error };
  }
}
*/

// ===== EXAMPLE 2: Updated sendResearchQuery service =====

/*
import { storeResearchHistory } from '../utils/supabase';

export interface ResearchQueryParams {
  user_id: string;
  agent: string;
  query: string;
  breadth: number;
  depth: number;
  include_technical_terms: boolean;
  output_format: string;
}

export interface ResearchQueryResponse {
  success: boolean;
  data?: any;
  error?: any;
  research_id?: string;
}

export async function sendResearchQuery(params: ResearchQueryParams): Promise<ResearchQueryResponse> {
  try {
    // Generate a client-side research_id
    const research_id = `research-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    console.log(`Generated research_id: ${research_id}`);
    
    // Prepare the payload with the client-generated research_id
    const payload = {
      ...params,
      research_id,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    
    // 1. FIRST send the data to the webhook (primary system of record)
    console.log('Sending data to webhook...');
    const webhookUrl = 'https://atomic123.app.n8n.cloud/webhook-test/055cedaa-a313-4625-a41c-7e7f9560b7a3';
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`Webhook error: ${response.status} ${response.statusText}`);
    }
    
    const webhookResult = await response.json();
    console.log('Webhook response:', webhookResult);
    
    // 2. THEN store the data in Supabase (but continue even if this fails)
    console.log('Storing data in Supabase...');
    const supabaseResult = await storeResearchHistory(payload);
    
    if (!supabaseResult.success) {
      console.warn('Supabase storage failed, but continuing with app flow:', supabaseResult.error);
    } else {
      console.log('Supabase storage successful');
    }
    
    // Return success as long as the webhook worked
    return {
      success: true,
      data: webhookResult,
      research_id,
    };
  } catch (error) {
    console.error('Error in sendResearchQuery:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
*/

// ===== EXAMPLE 3: Updated research history query =====

/*
// Example function to fetch research history for a user
export async function fetchResearchHistory(userId: string) {
  try {
    // Method 1: Using RPC function (most reliable, bypasses RLS)
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_research_history', { p_user_id: userId });
    
    if (rpcError) {
      console.error('Error fetching research history with RPC:', rpcError);
      
      // Method 2: Direct query fallback
      const { data: directData, error: directError } = await supabase
        .from('research_history_new')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (directError) {
        console.error('Error fetching research history with direct query:', directError);
        return [];
      }
      
      return directData;
    }
    
    return rpcData;
  } catch (error) {
    console.error('Unexpected error fetching research history:', error);
    return [];
  }
}

// Example function to fetch research by ID
export async function fetchResearchById(researchId: string) {
  try {
    // Method 1: Using RPC function
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_research_by_id', { p_research_id: researchId });
    
    if (rpcError) {
      console.error('Error fetching research by ID with RPC:', rpcError);
      
      // Method 2: Direct query fallback
      const { data: directData, error: directError } = await supabase
        .from('research_history_new')
        .select('*')
        .eq('research_id', researchId)
        .single();
      
      if (directError) {
        console.error('Error fetching research by ID with direct query:', directError);
        return null;
      }
      
      return directData;
    }
    
    return rpcData;
  } catch (error) {
    console.error('Unexpected error fetching research by ID:', error);
    return null;
  }
}
*/

// ===== INTEGRATING WITH SCREENS =====

/*
In ResearchParametersScreen.tsx:

1. Update the handleSubmit function to use the updated sendResearchQuery service
2. Make sure user_id is provided (client-generated if needed)
3. Navigate to the chat screen with the research_id returned from the service

Example:
async function handleSubmit() {
  try {
    // Generate a user ID if not available (in production, use Auth)
    const userId = user?.id || `user-${Date.now()}`;
    
    // Prepare the query parameters
    const queryParams = {
      user_id: userId,
      agent,
      query,
      breadth: sliderValue1,
      depth: sliderValue2,
      include_technical_terms,
      output_format
    };
    
    // Send the query
    const result = await sendResearchQuery(queryParams);
    
    if (result.success) {
      // The research_id is now generated by the service and returned
      const { research_id } = result;
      
      // Navigate to the chat screen with the research ID
      navigation.navigate('ResearchChat', {
        research_id,
        query,
        agent
      });
    } else {
      // Handle error
      console.error('Failed to send research query:', result.error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to send research query. Please try again.'
      });
    }
  } catch (error) {
    console.error('Error in handleSubmit:', error);
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: 'An unexpected error occurred. Please try again.'
    });
  }
}
*/

// ===== FINAL NOTES =====

/**
 * IMPORTANT CONSIDERATIONS:
 * 
 * 1. Client-side ID generation
 *    - All IDs are now generated on the client side as strings
 *    - Format: `research-${timestamp}-${random}` or similar
 *    - This ensures consistency between webhook and database
 * 
 * 2. Error handling
 *    - The app should continue to function even if Supabase operations fail
 *    - The webhook remains the primary system of record
 * 
 * 3. Querying data
 *    - Use RPC functions when possible for reliable access
 *    - Direct queries work with the updated RLS policies
 * 
 * 4. RLS policies
 *    - In production, review and tighten the permissive policies
 *    - The current policies are deliberately permissive for testing
 * 
 * 5. Rollout strategy
 *    - Test thoroughly on staging before deploying to production
 *    - Consider migrating existing data if needed
 */ 
 
 