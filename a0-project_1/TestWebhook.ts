import axios from 'axios';
import { supabase } from './utils/supabase';

// Webhook URL
const WEBHOOK_URL = 'https://atomic123.app.n8n.cloud/webhook-test/055cedaa-a313-4625-a41c-7e7f9560b7a3';

// A direct function to test the webhook
export const testWebhook = async () => {
  console.log('Test webhook function called');
  
  try {
    const testData = {
      user_id: "test-user-function-123",
      agent: "general",
      query: "Test query from utility function",
      breadth: 3,
      depth: 3,
      include_technical_terms: true,
      output_format: "Research Paper",
      timestamp: new Date().toISOString()
    };
    
    console.log('Sending test data to webhook:', JSON.stringify(testData));
    
    const response = await axios.post(WEBHOOK_URL, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Webhook response:', response.status, JSON.stringify(response.data));
    
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    console.error('Webhook error:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Function to mark a research as complete with a final "research_done" topic
export const markResearchAsComplete = async (
  researchId: string, 
  userId: string = "system"
): Promise<boolean> => {
  try {
    console.log(`Marking research ${researchId} as complete`);
    
    // Check if the research already has a completion topic
    const { data: existingData, error: existingError } = await supabase
      .from('research_progress_new')
      .select('progress_id')
      .eq('research_id', researchId)
      .ilike('topic', '%research_done%')
      .limit(1);
    
    if (existingError) {
      console.error('Error checking for existing completion topic:', existingError);
      return false;
    }
    
    // If a completion topic already exists, don't create another
    if (existingData && existingData.length > 0) {
      console.log('Research already marked as complete');
      return true;
    }
    
    // Create a completion ID
    const completionId = `topic-${Date.now()}-done`;
    
    // Insert the completion topic
    const { error: insertError } = await supabase
      .from('research_progress_new')
      .insert({
        progress_id: completionId,
        research_id: researchId,
        user_id: userId,
        topic: 'Research Complete research_done',
        links: [
          { 
            url: '#summary', 
            title: 'Research Summary Available' 
          }
        ],
        created_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.error('Error marking research as complete:', insertError);
      return false;
    }
    
    console.log(`Successfully marked research ${researchId} as complete`);
    
    // Update the research history status
    const { error: updateError } = await supabase
      .from('research_history_new')
      .update({ status: 'completed' })
      .eq('research_id', researchId);
    
    if (updateError) {
      console.error('Error updating research history status:', updateError);
    }
    
    // Send completion notification to webhook
    try {
      const completionNotification = {
        research_id: researchId,
        user_id: userId,
        event: 'research_completed',
        timestamp: new Date().toISOString()
      };
      
      await axios.post(WEBHOOK_URL, completionNotification, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Sent completion notification to webhook');
    } catch (webhookError) {
      console.error('Error sending completion notification:', webhookError);
      // Continue even if webhook fails
    }
    
    return true;
  } catch (error) {
    console.error('Error in markResearchAsComplete:', error);
    return false;
  }
};

// Function to check if a research is complete based on its criteria
export const checkResearchCompletion = async (researchId: string): Promise<boolean> => {
  try {
    // Get research history to check parameters
    const { data: historyData, error: historyError } = await supabase
      .from('research_history_new')
      .select('*')
      .eq('research_id', researchId)
      .single();
    
    if (historyError || !historyData) {
      console.error('Error checking research history:', historyError);
      return false;
    }
    
    // Get progress topics count
    const { data: progressData, error: progressError } = await supabase
      .from('research_progress_new')
      .select('topic')
      .eq('research_id', researchId);
    
    if (progressError) {
      console.error('Error checking research progress:', progressError);
      return false;
    }
    
    // Check if there's already a completion topic
    const hasCompletionTopic = progressData?.some(item => 
      item.topic && typeof item.topic === 'string' && 
      item.topic.toLowerCase().includes('research_done')
    );
    
    if (hasCompletionTopic) {
      return true;
    }
    
    // Calculate expected topics based on breadth and depth
    const expectedTopics = Math.round((historyData.breadth * historyData.depth) / 1.5);
    
    // Check if we have enough topics
    return progressData && progressData.length >= expectedTopics;
  } catch (error) {
    console.error('Error in checkResearchCompletion:', error);
    return false;
  }
};

export default testWebhook; 
 
 