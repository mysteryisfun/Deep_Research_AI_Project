import { supabase } from './supabase';
import { toast } from 'sonner-native';

/**
 * Utility service for handling Research Progress functions
 */

// Check if research is complete based on progress criteria
export const checkResearchCompletion = async (researchId: string): Promise<boolean> => {
  try {
    // Get research history to check parameters
    const { data: historyData, error: historyError } = await supabase
      .from('research_history_new')
      .select('*')
      .eq('research_id', researchId)
      .single();
    
    if (historyError) {
      console.error('Error checking research history:', historyError);
      return false;
    }
    
    if (!historyData) {
      return false;
    }
    
    // Get progress topics count
    const { data: progressData, error: progressError } = await supabase
      .from('research_progress_new')
      .select('progress_id')
      .eq('research_id', researchId);
    
    if (progressError) {
      console.error('Error checking research progress:', progressError);
      return false;
    }
    
    // Calculate expected topics based on breadth and depth
    const expectedTopics = Math.round((historyData.breadth * historyData.depth) / 1.5);
    
    // If we have enough topics, consider it complete
    // Check if there's already a completion topic
    const hasCompletionTopic = progressData?.some(item => 
      item.topic && typeof item.topic === 'string' && 
      item.topic.toLowerCase().includes('research_done')
    );
    
    if (hasCompletionTopic) {
      return true;
    }
    
    // Otherwise, check if we have enough topics
    return progressData && progressData.length >= expectedTopics;
  } catch (error) {
    console.error('Error in checkResearchCompletion:', error);
    return false;
  }
};

// Create a final "research_done" topic to mark completion
export const markResearchAsComplete = async (
  researchId: string, 
  userId: string
): Promise<boolean> => {
  try {
    // Check if there's already a completion topic
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
      return true;
    }
    
    // Create a completion ID that's compatible with the table
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
    
    // Update the research history status
    const { error: updateError } = await supabase
      .from('research_history_new')
      .update({ status: 'completed' })
      .eq('research_id', researchId);
    
    if (updateError) {
      console.error('Error updating research history status:', updateError);
    }
    
    return true;
  } catch (error) {
    console.error('Error in markResearchAsComplete:', error);
    return false;
  }
};

// Monitor research progress and mark as complete when criteria met
export const monitorResearchProgress = async (
  researchId: string, 
  userId: string
): Promise<void> => {
  try {
    const isComplete = await checkResearchCompletion(researchId);
    
    if (isComplete) {
      const marked = await markResearchAsComplete(researchId, userId);
      
      if (marked) {
        toast.success('Research has been completed!');
      }
    }
  } catch (error) {
    console.error('Error monitoring research progress:', error);
  }
};

// Manually trigger research completion
export const completeResearch = async (
  researchId: string, 
  userId: string
): Promise<boolean> => {
  try {
    const marked = await markResearchAsComplete(researchId, userId);
    
    if (marked) {
      toast.success('Research has been marked as complete!');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error completing research:', error);
    return false;
  }
}; 