import { supabase, generateEntityId } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Interface for individual question data
 */
export interface QuestionItem {
  id: string;
  text: string;
  answer?: string;
  answered: boolean;
}

/**
 * Interface for research question data with array structure
 */
export interface ResearchQuestionArray {
  question_id: string;
  research_id: string;
  user_id: string;
  questions: QuestionItem[];
  answers: QuestionItem[];
  reply_webhook_url?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Legacy interface for research question data (single question per row)
 * Kept for backward compatibility
 */
export interface ResearchQuestion {
  question_id: string;
  research_id: string;
  user_id: string;
  question: string;
  answer?: string;
  answered: boolean;
  reply_webhook_url?: string;
  created_at: string;
}

/**
 * Helper function to check if a Supabase table exists
 * @param tableName The name of the table to check
 * @returns Boolean indicating if the table exists
 */
export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    // Try to get a single row from the table
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error && error.code === 'PGRST116') {
      // Table doesn't exist
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
}

/**
 * Direct function to fetch questions from Supabase
 * This is the new recommended approach for better performance
 * 
 * @param researchId The ID of the research to fetch questions for
 * @param userId Optional user ID to filter questions
 * @returns Array of research questions
 */
export async function directFetchQuestions(
  researchId: string,
  userId?: string
): Promise<ResearchQuestion[]> {
  try {
    console.log(`Directly fetching questions for research: ${researchId}`);
    
    // First try the array-based table (research_questions_array)
    const { data: batchData, error: batchError } = await supabase
      .from('research_questions_array')
      .select('*')
      .eq('research_id', researchId)
      .maybeSingle();
    
    if (batchError && batchError.code !== 'PGRST116') {
      console.error('Error fetching question batch:', batchError);
      throw batchError;
    }
    
    let questionsArray: ResearchQuestion[] = [];
    
    if (batchData && batchData.questions && Array.isArray(batchData.questions)) {
      console.log(`Found batch with ${batchData.questions.length} questions`);
      
      // Format the questions from the batch
      questionsArray = batchData.questions.map((q: any, index: number) => ({
        question_id: q.id || `${batchData.question_id}-q${index + 1}`,
        research_id: researchId,
        user_id: userId || batchData.user_id,
        question: q.text || q.question,
        answer: q.answer || null,
        answered: !!q.answer,
        created_at: batchData.created_at || new Date().toISOString()
      }));
    } else {
      // Fallback to direct questions if no batch is found
      const { data: directQuestions, error: directError } = await supabase
        .from('research_questions')
      .select('*')
      .eq('research_id', researchId)
      .order('created_at', { ascending: true });
    
      if (directError) {
        console.error('Error fetching direct questions:', directError);
        // Continue with an empty array, don't throw error
      }
      
      if (directQuestions && directQuestions.length > 0) {
        console.log(`Found ${directQuestions.length} direct questions`);
        questionsArray = directQuestions;
      }
    }
    
    return questionsArray;
  } catch (error) {
    console.error('Unexpected error in directFetchQuestions:', error);
    return [];
  }
}

/**
 * Direct function to submit answers to Supabase
 * This is the new recommended approach for better performance
 * 
 * @param researchId The ID of the research to submit answers for
 * @param answers Object mapping question IDs to answer strings
 * @returns Object with success flag and data or error
 */
export async function directSubmitAnswers(
  researchId: string,
  answers: Record<string, string>
): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    console.log(`Directly submitting answers for research: ${researchId}`);
    
    // For each answer, insert or update in the database
    const allSubmissions = Object.entries(answers).map(async ([questionId, answer]) => {
      if (!answer || answer.trim() === '') return null;
      
      // Determine if we should update research_questions_array or direct questions
      if (questionId.includes('-q')) {
        // This is a batch question, update the batch
        const batchId = questionId.split('-q')[0];
        const questionIndex = parseInt(questionId.split('-q')[1]) - 1;
        
        // Get the current batch
        const { data: currentBatch, error: getBatchError } = await supabase
          .from('research_questions_array')
          .select('*')
          .eq('question_id', batchId)
          .single();
        
        if (getBatchError) {
          console.error('Error getting batch for update:', getBatchError);
          throw getBatchError;
        }
        
        if (currentBatch && currentBatch.questions) {
          // Update the specific question in the batch
          const updatedQuestions = [...currentBatch.questions];
          if (updatedQuestions[questionIndex]) {
            updatedQuestions[questionIndex].answer = answer;
            
            // Update the batch in the database
            const { error: updateError } = await supabase
              .from('research_questions_array')
              .update({
                questions: updatedQuestions
              })
              .eq('question_id', batchId);
            
            if (updateError) {
              console.error('Error updating batch questions:', updateError);
              throw updateError;
            }
          
          return {
              question_id: questionId,
              answer
            };
          }
        }
      } else {
        // Direct question, update research_questions table if it exists
        try {
          const { error: updateError } = await supabase
            .from('research_questions')
            .update({
              answer,
              answered: true
            })
            .eq('question_id', questionId);
          
          if (updateError) {
            console.error('Error updating direct question:', updateError);
            // Don't throw here as the table might not exist
          }
          
          return {
            question_id: questionId,
            answer
          };
        } catch (updateErr) {
          console.error('Error in direct question update:', updateErr);
          // Continue with the next question
        }
      }
      
      return null;
    });
    
    // Wait for all submissions to complete
    const results = await Promise.all(allSubmissions);
    const successfulSubmissions = results.filter(Boolean);
    
    console.log(`Successfully submitted ${successfulSubmissions.length} answers`);
    
    return {
      success: successfulSubmissions.length > 0,
      data: { answers: successfulSubmissions },
      error: successfulSubmissions.length === 0 ? { message: 'No answers were successfully submitted' } : null
    };
  } catch (error) {
    console.error('Error in directSubmitAnswers:', error);
    return {
      success: false,
      error
    };
  }
}

/**
 * Direct function to set up real-time monitoring for questions
 * This is the new recommended approach for better performance
 * 
 * @param researchId The ID of the research to monitor
 * @param callback Function to call when questions change
 * @returns Function to call to stop monitoring
 */
export function directMonitorQuestions(
  researchId: string,
  callback: (questions: ResearchQuestion[]) => void
): () => void {
  console.log(`Setting up direct real-time monitoring for research ID: ${researchId}`);
  
  // Create and subscribe to a channel for research_questions_array
  const questionsChannel = supabase
    .channel(`research_questions:${researchId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'research_questions_array',
        filter: `research_id=eq.${researchId}`
      },
      async (payload: any) => {
        console.log('Question change received:', payload);
        
        // Handle different event types
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          // Refresh questions and call the callback
          const updatedQuestions = await directFetchQuestions(researchId);
          callback(updatedQuestions);
        }
      }
    )
    .subscribe();
  
  // Return a function to stop monitoring
  return () => {
    console.log(`Stopping direct real-time monitoring for research ID: ${researchId}`);
    supabase.removeChannel(questionsChannel);
  };
}

/**
 * LEGACY: Fetches questions for a specific research ID from the new array-based table
 * @param researchId The ID of the research to fetch questions for
 * @returns Array of research questions in the old format for compatibility
 */
export async function fetchQuestions(researchId: string): Promise<ResearchQuestion[]> {
  // Use the new direct function with backward compatibility
  return directFetchQuestions(researchId);
}

/**
 * LEGACY: Stores an answer for a specific question
 * @param questionId The ID of the question to answer
 * @param answer The answer to store
 * @returns Success flag and data or error
 */
export async function submitAnswer(questionId: string, answer: string): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    console.log(`Submitting answer for question: ${questionId}`);
    
    // Split the questionId to check if it's from the new array-based format
    const parts = questionId.split('-');
    const isArrayFormat = parts.length > 1;
    const baseQuestionId = isArrayFormat ? parts[0] : questionId;
    const questionItemId = isArrayFormat ? parts[1] : null;
    
    if (isArrayFormat && questionItemId) {
      // Handle array-based questions
      console.log(`Using array-based update for question ID: ${baseQuestionId}, item ID: ${questionItemId}`);
      
      // Fetch the current record to get the existing answers and questions
      const { data: currentRecord, error: fetchError } = await supabase
        .from('research_questions_array')
        .select('*')
        .eq('question_id', baseQuestionId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching question record:', fetchError);
        return { success: false, error: fetchError };
      }
      
      // Log current state for debugging
      console.log(`Got current record with ${currentRecord?.questions?.length || 0} questions and ${currentRecord?.answers?.length || 0} answers`);
      
      let updateData;
      let updateError;
      
      // STEP 1: Try multiple approaches to save the answer
      
      // First try - Attempt to use the update_single_batch_answer RPC function
      console.log('STEP 1: Trying to use the update_single_batch_answer RPC function...');
      try {
        const rpcResult = await supabase.rpc('update_single_batch_answer', {
          p_question_id: baseQuestionId,
          p_question_item_id: questionItemId,
          p_answer: answer
        });
        
        updateData = rpcResult.data;
        updateError = rpcResult.error;
        
        if (updateError) {
          console.error('1️⃣ RPC function error:', updateError);
        } else {
          console.log('1️⃣ RPC function success!');
        }
      } catch (rpcError) {
        console.error('1️⃣ RPC function exception:', rpcError);
        updateError = { message: rpcError.message };
      }
      
      // Second try - If RPC fails, try direct client-side update
      if (updateError) {
        console.log('STEP 2: RPC failed, trying direct client-side update...');
        
        // Update or create an answer for this specific question
        const existingAnswers = currentRecord.answers || [];
        let updatedAnswers = [...existingAnswers];
        
        // Check if we already have an answer for this question
        const existingAnswerIndex = updatedAnswers.findIndex((a: QuestionItem) => a.id === questionItemId);
        
        if (existingAnswerIndex >= 0) {
          // Update existing answer
          console.log('2️⃣ Updating existing answer at index', existingAnswerIndex);
          updatedAnswers[existingAnswerIndex] = {
            ...updatedAnswers[existingAnswerIndex],
            answer,
            answered: true
          };
        } else {
          // Add new answer
          console.log('2️⃣ Adding new answer');
          updatedAnswers.push({
            id: questionItemId,
            text: '', // We don't need the question text in the answers array
            answer,
            answered: true
          });
        }
        
        // Verify the update worked
        console.log(`Updated answers array now has ${updatedAnswers.length} items`);
        
        // Update the record in the database
        const fallbackResult = await supabase
          .from('research_questions_array')
          .update({ 
            answers: updatedAnswers,
            updated_at: new Date().toISOString()
          })
          .eq('question_id', baseQuestionId)
          .select();
        
        updateData = fallbackResult.data?.[0];
        updateError = fallbackResult.error;
        
        if (updateError) {
          console.error('2️⃣ Client-side update error:', updateError);
        } else {
          console.log('2️⃣ Client-side update success!');
        }
      }
      
      // If both previous attempts fail, try using directSubmitAnswers
      if (updateError) {
        console.log('STEP 3: Both attempts failed, trying directSubmitAnswers...');
        
        const answers: Record<string, string> = { [questionId]: answer };
        
        try {
          const result = await directSubmitAnswers(baseQuestionId, answers);
          updateData = result.data;
          updateError = result.error;
        
          if (result.success) {
            console.log('3️⃣ directSubmitAnswers success!');
              return {
              success: true,
              data: updateData
            };
          } else {
            console.error('3️⃣ directSubmitAnswers error:', updateError);
          }
        } catch (directError) {
          console.error('3️⃣ directSubmitAnswers exception:', directError);
          updateError = { message: directError.message };
            }
          }
      
      // Return the result
      if (updateError) {
        return {
          success: false,
          error: updateError
        };
      }
      
      return {
        success: true,
        data: updateData
      };
    } else {
      // Legacy format - single question in the research_questions table
      const { data, error } = await supabase
        .from('research_questions')
        .update({ 
          answer, 
          answered: true 
        })
        .eq('question_id', questionId)
        .select();
      
      if (error) {
        console.error('Error updating question answer:', error);
        return { success: false, error };
      }
      
      return {
        success: true,
        data
      };
    }
  } catch (error) {
    console.error('Unexpected error in submitAnswer:', error);
    return {
      success: false,
      error
    };
  }
}

/**
 * LEGACY: Sets up monitoring for new questions
 * @param researchId The ID of the research to monitor
 * @param onQuestionsUpdate Callback function to call when questions are updated
 * @param pollingInterval Optional polling interval in milliseconds
 * @returns Function to call to stop monitoring
 */
export function monitorQuestions(
  researchId: string,
  onQuestionsUpdate: (questions: ResearchQuestion[]) => void,
  pollingInterval = 2000
): () => void {
  // Use the new direct approach for better performance
  return directMonitorQuestions(researchId, onQuestionsUpdate);
}

/**
 * LEGACY: Submits multiple answers at once
 * @param researchId The ID of the research the answers are for
 * @param answers Object mapping question IDs to answer strings
 * @returns Success flag and data or error
 */
export async function submitAllAnswers(
  researchId: string,
  answers: Record<string, string>
): Promise<{ success: boolean; data?: any; error?: any }> {
  // Use the new direct approach
  return directSubmitAnswers(researchId, answers);
}

/**
 * Creates a batch of test questions for testing purposes
 * @param researchId The ID of the research to create questions for
 * @param userId The user ID (optional, will fetch from AsyncStorage if not provided)
 * @param questionTexts Array of question texts to create
 * @returns The created questions record
 */
export async function createBatchTestQuestions(
  researchId: string, 
  userId?: string,
  questionTexts: string[]
): Promise<ResearchQuestionArray | null> {
  try {
    // Skip if no questions provided
    if (!questionTexts || questionTexts.length === 0) {
      console.error('No question texts provided for batch creation');
      return null;
    }
    
    // If no userId is provided, try to get it from AsyncStorage
    let userIdToUse = userId;
    if (!userIdToUse) {
      try {
        userIdToUse = await AsyncStorage.getItem('user_id');
        if (!userIdToUse) {
          // Generate a temporary user ID if none exists
          userIdToUse = generateEntityId('user');
          console.log('Generated temporary user ID for batch test questions:', userIdToUse);
        } else {
          console.log('Using stored user ID from AsyncStorage for batch test questions:', userIdToUse);
        }
      } catch (error) {
        console.error('Error retrieving user ID from AsyncStorage:', error);
        // Fall back to generating a temporary ID
        userIdToUse = generateEntityId('user');
        console.log('Generated fallback user ID due to AsyncStorage error:', userIdToUse);
      }
    }
    
    const questionId = generateEntityId('question-batch');
    
    // Format questions as array items
    const questionItems: QuestionItem[] = questionTexts.map((text, index) => ({
      id: `q${index + 1}`,
      text,
      answered: false
    }));
    
    const questionData = {
      question_id: questionId,
      research_id: researchId,
      user_id: userIdToUse,
      questions: questionItems,
      answers: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('research_questions_array')
      .insert([questionData])
      .select();
    
    if (error) {
      console.error('Error creating batch test questions:', error);
      return null;
    }
    
    console.log(`Successfully created batch of ${questionItems.length} questions`);
    return data[0] as ResearchQuestionArray;
  } catch (error) {
    console.error('Unexpected error in createBatchTestQuestions:', error);
    return null;
  }
}

/**
 * Creates a test question for testing purposes
 * @param researchId The ID of the research to create a question for
 * @param userId The user ID (optional, will fetch from AsyncStorage if not provided)
 * @returns The created question
 */
export async function createTestQuestion(researchId: string, userId?: string): Promise<ResearchQuestion | null> {
  try {
    // If no userId is provided, try to get it from AsyncStorage
    let userIdToUse = userId;
    if (!userIdToUse) {
      try {
        userIdToUse = await AsyncStorage.getItem('user_id');
        if (!userIdToUse) {
          // Generate a temporary user ID if none exists
          userIdToUse = generateEntityId('user');
          console.log('Generated temporary user ID for test question:', userIdToUse);
        } else {
          console.log('Using stored user ID from AsyncStorage for test question:', userIdToUse);
        }
      } catch (error) {
        console.error('Error retrieving user ID from AsyncStorage:', error);
        // Fall back to generating a temporary ID
        userIdToUse = generateEntityId('user');
        console.log('Generated fallback user ID due to AsyncStorage error:', userIdToUse);
      }
    }
    
    const questionData = {
      question_id: generateEntityId('question'),
      research_id: researchId,
      user_id: userIdToUse,
      question: `Test question created at ${new Date().toISOString()}`,
      answered: false,
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('research_questions_new')
      .insert([questionData])
      .select();
    
    if (error) {
      console.error('Error creating test question:', error);
      return null;
    }
    
    return data[0] as ResearchQuestion;
  } catch (error) {
    console.error('Unexpected error in createTestQuestion:', error);
    return null;
  }
}

/**
 * Fetches research progress data for a specific research ID
 * @param researchId The ID of the research to fetch progress for
 * @returns Array of research progress items
 */
export async function fetchResearchProgress(researchId: string) {
  try {
    console.log(`Fetching research progress for: ${researchId}`);
    
    const { data, error } = await supabase
      .from('research_progress_new')
      .select('*')
      .eq('research_id', researchId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching research progress:', error);
      return [];
    }
    
    console.log(`Fetched ${data.length} progress items for research: ${researchId}`);
    
    // Transform data to ensure links is an array
    return data.map(item => ({
      ...item,
      links: Array.isArray(item.links) ? item.links : []
    }));
  } catch (error) {
    console.error('Unexpected error in fetchResearchProgress:', error);
    return [];
  }
}

/**
 * Sets up a real-time subscription to monitor research progress updates
 * @param researchId The ID of the research to monitor progress for
 * @param callback Function to call when new progress data is received
 * @returns Cleanup function to remove the subscription
 */
export function monitorResearchProgress(
  researchId: string,
  callback: (progressItems: any[]) => void
) {
  console.log(`Setting up realtime subscription for research progress: ${researchId}`);
  
  try {
    // Set up subscription
    const subscription = supabase
      .channel(`progress-${researchId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'research_progress_new',
        filter: `research_id=eq.${researchId}`
      }, (payload) => {
        console.log('Progress update received:', payload);
        
        // Fetch all progress items to keep them in sync
        fetchResearchProgress(researchId).then(callback);
      })
      .subscribe();
    
    // Return cleanup function
    return () => {
      console.log(`Removing progress subscription for: ${researchId}`);
      supabase.removeChannel(subscription);
    };
  } catch (error) {
    console.error('Error setting up progress monitoring:', error);
    return () => {}; // Return empty cleanup function
  }
}