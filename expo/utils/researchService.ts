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
      console.log(`Research ${researchId} not found in history`);
      return false;
    }
    
    // If research is already marked as completed in history, return true
    if (historyData.status === 'completed') {
      console.log(`Research ${researchId} already marked as completed in history`);
      return true;
    }
    
    // Get progress topics
    const { data: progressData, error: progressError } = await supabase
      .from('research_progress_new')
      .select('topic')
      .eq('research_id', researchId)
      .order('created_at', { ascending: false });
    
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
      console.log(`Research ${researchId} already has completion topic`);
      return true;
    }
    
    // Calculate expected topics based on breadth and depth using the formula (Breadth × Depth) + 3
    // +3 accounts for: 1) firing the research topic, 2) preparing the final draft, 3) ready state
    const totalSerpQueries = historyData.breadth * historyData.depth;
    const expectedTopics = totalSerpQueries + 3;
    
    // Check if we have enough topics to consider it complete (at least 85% of expected)
    const completionThreshold = Math.floor(expectedTopics * 0.85);
    const hasEnoughTopics = progressData && progressData.length >= completionThreshold;
    
    // Check for results data as an additional completion indicator
    const { data: resultsData, error: resultsError } = await supabase
      .from('research_results_new')
      .select('result_id')
      .eq('research_id', researchId)
      .limit(1);
    
    if (resultsError) {
      console.error('Error checking research results:', resultsError);
    }
    
    const hasResults = !resultsError && resultsData && resultsData.length > 0;
    
    // Log the completion check details
    console.log(`Research ${researchId} completion check:`, {
      topicsCount: progressData?.length || 0,
      expectedTopics,
      completionThreshold,
      hasEnoughTopics,
      hasResults
    });
    
    // Research is complete if it has enough topics OR if results are available
    return hasEnoughTopics || hasResults;
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
    // First, check if the research is already marked as complete in research_history_new
    const { data: historyData, error: historyError } = await supabase
      .from('research_history_new')
      .select('status')
      .eq('research_id', researchId)
      .single();
      
    if (historyError) {
      console.error('Error checking research history status:', historyError);
      return false;
    }
    
    // If research is already marked as completed at the history level, no need to add another completion topic
    if (historyData?.status === 'completed') {
      console.log('Research already marked as completed in history. Skipping duplicate completion entry.');
      return true;
    }
    
    // Check if there's already a completion topic by querying with an exact match and case insensitivity
    const { data: existingData, error: existingError } = await supabase
      .from('research_progress_new')
      .select('progress_id, topic')
      .eq('research_id', researchId)
      .ilike('topic', '%research_done%')
      .order('created_at', { ascending: false });
    
    if (existingError) {
      console.error('Error checking for existing completion topics:', existingError);
      return false;
    }
    
    // If any completion topics already exist, don't create another
    if (existingData && existingData.length > 0) {
      console.log(`Found ${existingData.length} existing completion topics. Skipping duplicate.`);
      // Update research history status if it hasn't been updated
      await supabase
        .from('research_history_new')
        .update({ status: 'completed' })
        .eq('research_id', researchId);
      return true;
    }
    
    // Create a completion ID that's compatible with the table
    const completionId = `topic-${Date.now()}-done`;
    
    // Use a more descriptive topic name
    const completionTopic = 'Research Complete research_done';
    
    console.log(`Creating completion topic for research ${researchId}: "${completionTopic}"`);
    
    // Insert the completion topic
    const { error: insertError } = await supabase
      .from('research_progress_new')
      .insert({
        progress_id: completionId,
        research_id: researchId,
        user_id: userId,
        topic: completionTopic,
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
    
    console.log(`Successfully added completion topic for research ${researchId}`);
    
    // Update the research history status
    const { error: updateError } = await supabase
      .from('research_history_new')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('research_id', researchId);
    
    if (updateError) {
      console.error('Error updating research history status:', updateError);
    } else {
      console.log(`Successfully updated research history status to 'completed' for ${researchId}`);
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
    // First check if research is already marked as complete in history
    const { data: historyData, error: historyError } = await supabase
      .from('research_history_new')
      .select('status')
      .eq('research_id', researchId)
      .single();
    
    if (historyError) {
      console.error('Error checking research history status:', historyError);
      return;
    }
    
    // If already completed, don't do any further processing
    if (historyData?.status === 'completed') {
      console.log(`Research ${researchId} already completed. Skipping monitoring.`);
      return;
    }
    
    // Check if there are already completion topics
    const { data: existingTopics, error: topicsError } = await supabase
      .from('research_progress_new')
      .select('progress_id')
      .eq('research_id', researchId)
      .ilike('topic', '%research_done%')
      .limit(1);
    
    if (topicsError) {
      console.error('Error checking existing completion topics:', topicsError);
      return;
    }
    
    // If a completion topic already exists, don't create a new one
    if (existingTopics && existingTopics.length > 0) {
      console.log(`Research ${researchId} already has completion topic. Just updating history status.`);
      // Ensure history status is updated
      await supabase
        .from('research_history_new')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('research_id', researchId);
      return;
    }
    
    // If no completion topic exists, check if it should be complete
    const isComplete = await checkResearchCompletion(researchId);
    
    if (isComplete) {
      console.log(`Research ${researchId} meets completion criteria. Marking as complete...`);
      const marked = await markResearchAsComplete(researchId, userId);
      
      if (marked) {
        console.log(`Research ${researchId} successfully marked as complete.`);
      } else {
        console.log(`Failed to mark research ${researchId} as complete.`);
      }
    } else {
      console.log(`Research ${researchId} does not yet meet completion criteria.`);
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

// Clean up debug topics for a specific research
export const cleanupDebugTopics = async (researchId: string): Promise<boolean> => {
  try {
    console.log(`Cleaning up debug topics for research ${researchId}`);
    
    // Find all debug topics for this research
    const { data: debugTopics, error: findError } = await supabase
      .from('research_progress_new')
      .select('progress_id, topic')
      .eq('research_id', researchId)
      .or(`topic.ilike.%Debug Topic%,topic.ilike.%test%`)
      .order('created_at', { ascending: false });
    
    if (findError) {
      console.error('Error finding debug topics:', findError);
      return false;
    }
    
    if (!debugTopics || debugTopics.length === 0) {
      console.log(`No debug topics found for research ${researchId}`);
      return true;
    }
    
    console.log(`Found ${debugTopics.length} debug topics to clean up for research ${researchId}`);
    
    // Extract just the progress_ids
    const debugTopicIds = debugTopics.map(topic => topic.progress_id);
    
    // Delete all debug topics in a single operation
    const { error: deleteError } = await supabase
      .from('research_progress_new')
      .delete()
      .in('progress_id', debugTopicIds);
    
    if (deleteError) {
      console.error('Error deleting debug topics:', deleteError);
      return false;
    }
    
    console.log(`Successfully deleted ${debugTopicIds.length} debug topics for research ${researchId}`);
    return true;
  } catch (error) {
    console.error('Error cleaning up debug topics:', error);
    return false;
  }
};

// Submit feedback for a research
export const submitFeedback = async (
  researchId: string,
  rating: number,
  comment?: string
): Promise<boolean> => {
  try {
    // Validate input parameters
    if (!researchId) {
      console.error('Invalid researchId: researchId is required');
      toast.error('Missing research information');
      return false;
    }
    
    // Validate rating is between 1-5
    if (!rating || rating < 1 || rating > 5) {
      console.error(`Invalid rating: ${rating}. Must be between 1 and 5`);
      toast.error('Please provide a valid rating (1-5)');
      return false;
    }
    
    // Generate a unique feedback ID
    const feedbackId = `feedback-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    console.log(`Submitting feedback for research ${researchId}, rating: ${rating}, comment: ${comment || 'none'}`);
    
    // Prepare the feedback data
    const feedbackData = {
      feedback_id: feedbackId,
      research_id: researchId,
      rating,
      comment: comment || null,
      created_at: new Date().toISOString()
      // user_id is left null as requested
    };
    
    console.log('Feedback data to insert:', JSON.stringify(feedbackData));
    
    // Get list of available tables for debugging
    console.log('Attempting to submit feedback to research_feedback table');
    
    // Try both possible table names to handle potential naming issues
    try {
      const { data, error } = await supabase
        .from('research_feedback')
        .insert(feedbackData)
        .select();
      
      if (error) {
        console.error('Error submitting to research_feedback:', error);
        
        // Try alternative table name
        console.log('Trying alternative table name: research_feedbacks');
        const { data: altData, error: altError } = await supabase
          .from('research_feedbacks')
          .insert(feedbackData)
          .select();
        
        if (altError) {
          console.error('Error submitting to research_feedbacks:', altError);
          toast.error(`Failed to submit feedback: ${altError.message}`);
          return false;
        }
        
        if (!altData || altData.length === 0) {
          console.error('No feedback data returned after insert (alternative table)');
          toast.error('Failed to save feedback');
          return false;
        }
        
        console.log(`Successfully submitted feedback with ID: ${feedbackId} to research_feedbacks table`, altData);
        toast.success('Thank you for your feedback!');
        return true;
      }
      
      // Check if data was actually inserted
      if (!data || data.length === 0) {
        console.error('No feedback data returned after insert');
        toast.error('Failed to save feedback');
        return false;
      }
      
      console.log(`Successfully submitted feedback with ID: ${feedbackId}`, data);
      toast.success('Thank you for your feedback!');
      return true;
    } catch (mainError) {
      console.error('Critical error in feedback submission:', mainError);
      toast.error('Unable to save your feedback at this time');
      return false;
    }
  } catch (error) {
    console.error('Error in submitFeedback:', error);
    toast.error('An unexpected error occurred');
    return false;
  }
};

// Check if feedback has already been submitted for a research
export const checkFeedbackSubmitted = async (researchId: string): Promise<boolean> => {
  try {
    console.log(`Checking if feedback exists for research ${researchId}`);
    
    const { data, error, count } = await supabase
      .from('research_feedback')
      .select('*', { count: 'exact' })
      .eq('research_id', researchId)
      .limit(1);
    
    if (error) {
      console.error('Error checking feedback submission:', error);
      return false;
    }
    
    const hasSubmitted = count !== null && count > 0;
    console.log(`Feedback submission check for ${researchId}: ${hasSubmitted ? 'Already submitted' : 'Not submitted yet'}`);
    
    return hasSubmitted;
  } catch (error) {
    console.error('Error in checkFeedbackSubmitted:', error);
    return false;
  }
}; 