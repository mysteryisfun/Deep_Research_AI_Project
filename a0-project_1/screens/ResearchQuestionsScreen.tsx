import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MotiView } from 'moti';
import { supabase } from '../utils/supabase';
import { useUser } from '../context/UserContext';

// Define types for the route params
type RouteParams = {
  research_id: string;
  query?: string;
};

type ResearchQuestion = {
  question_id: string;
  research_id: string;
  user_id: string;
  question: string;
  answer?: string;
  answered: boolean;
  reply_webhook_url?: string;
  created_at: string;
};

const ResearchQuestionsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const { userId: globalUserId } = useUser();
  
  // Get the research ID from the route params
  const { research_id, query } = route.params || {};
  
  const [questions, setQuestions] = useState<ResearchQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [hasQuestions, setHasQuestions] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const supabaseSubscriptionRef = useRef<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Load questions when the component mounts
  useEffect(() => {
    if (!research_id) {
      setError('No research ID provided');
      setLoading(false);
      return;
    }
    
    // Initial fetch of questions
    loadQuestions();
    
    // Set up real-time subscription for questions
    setupQuestionSubscription();
    
    // Cleanup on unmount
    return () => {
      cleanupSubscription();
    };
  }, [research_id]);
  
  // Set up Supabase real-time subscription for questions
  const setupQuestionSubscription = () => {
    if (!research_id) return;
    
    console.log(`Setting up real-time subscription for research_id: ${research_id}`);
    
    // Create and subscribe to a channel for research_questions_array
    const questionsChannel = supabase
      .channel(`research_questions:${research_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'research_questions_array',
          filter: `research_id=eq.${research_id}`
        },
        (payload: any) => {
          console.log('Question change received:', payload);
          
          // Handle different event types
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            // Refresh questions on insert or update
            loadQuestions();
          }
        }
      )
      .subscribe();
    
    // Store subscription ref for cleanup
    supabaseSubscriptionRef.current = questionsChannel;
  };
  
  // Clean up Supabase subscription
  const cleanupSubscription = () => {
    if (supabaseSubscriptionRef.current) {
      supabase.removeChannel(supabaseSubscriptionRef.current);
      supabaseSubscriptionRef.current = null;
    }
  };
  
  // Load initial questions
  const loadQuestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching questions for research ID: ${research_id}`);
      
      // First, try to get questions from research_questions_array table
      const { data: batchData, error: batchError } = await supabase
        .from('research_questions_array')
        .select('*')
        .eq('research_id', research_id)
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
          research_id: research_id,
          user_id: globalUserId || batchData.user_id,
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
          .eq('research_id', research_id)
          .order('created_at', { ascending: true });
        
        if (directError) {
          console.error('Error fetching direct questions:', directError);
          // Don't throw here, just log the error as we might not have this table
        }
        
        if (directQuestions && directQuestions.length > 0) {
          console.log(`Found ${directQuestions.length} direct questions`);
          questionsArray = directQuestions;
        }
      }
      
      // Set the questions state
      setQuestions(questionsArray);
      
      // Initialize answers state with any existing answers
      const initialAnswers: Record<string, string> = {};
      questionsArray.forEach(q => {
        if (q.answer) {
          initialAnswers[q.question_id] = q.answer;
        }
      });
      setAnswers(initialAnswers);
      
      setHasQuestions(questionsArray.length > 0);
      
    } catch (err: any) {
      console.error('Error loading questions:', err);
      setError('Failed to load questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle text input changes for answers
  const handleAnswerChange = (questionId: string, text: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: text
    }));
  };
  
  // Submit all answers at once
  const handleSubmitAll = async () => {
    // Check if we have any answers to submit
    const hasAnswersToSubmit = Object.values(answers).some(answer => answer && answer.trim() !== '');
    if (!hasAnswersToSubmit) {
      Alert.alert('No Answers', 'Please answer at least one question before submitting.');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      console.log(`Submitting answers for research ID: ${research_id}`);
      console.log('Answers to submit:', JSON.stringify(answers));
      
      // For each answer, insert or update in the database
      const allSubmissions = Object.entries(answers).map(async ([questionId, answer]) => {
        if (!answer || answer.trim() === '') return null;
        
        // Find the corresponding question
        const question = questions.find(q => q.question_id === questionId);
        if (!question) return null;
        
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
      
      if (successfulSubmissions.length > 0) {
        // Update the questions list with the new answers
        const updatedQuestions = questions.map(q => {
          const answer = answers[q.question_id];
          if (answer && answer.trim() !== '') {
            return { ...q, answer, answered: true };
          }
          return q;
        });
        
        setQuestions(updatedQuestions);
        setSuccess(true);
        
        // Display success message
        Alert.alert(
          'Answers Submitted',
          'Your answers have been successfully submitted. Thank you!',
          [{ text: 'OK' }]
        );
        
        // Navigate to the research progress screen after a successful submission
        setTimeout(() => {
          navigation.navigate('ResearchProgressScreen', { 
            research_id,
            query,
            breadth: route.params?.breadth || 3,
            depth: route.params?.depth || 3
          });
        }, 2000);
      } else {
        setError('No answers were successfully submitted. Please try again.');
      }
    } catch (err: any) {
      console.error('Error submitting answers:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`An unexpected error occurred: ${errorMessage}`);
      
      Alert.alert(
        'Unexpected Error',
        `There was a problem submitting your answers: ${errorMessage}`,
        [{ text: 'OK' }]
      );
    } finally {
      setSubmitting(false);
    }
  };
  
  // Render each question item
  const renderQuestion = (question: ResearchQuestion, index: number) => {
    return (
      <MotiView
        key={question.question_id}
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{
          opacity: { duration: 300, delay: index * 100 },
          translateY: { duration: 300, delay: index * 100 }
        }}
        style={styles.questionContainer}
      >
        <View style={styles.questionHeader}>
          <Text style={styles.questionNumber}>Q{index + 1}</Text>
          <Text style={styles.questionText}>{question.question}</Text>
        </View>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your answer here..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={answers[question.question_id] || ''}
            onChangeText={(text) => handleAnswerChange(question.question_id, text)}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            editable={!submitting && !question.answered}
          />
        </View>
        
        {question.answered && (
          <View style={styles.answeredBadge}>
            <MaterialIcons name="check-circle" size={16} color="#4ade80" />
            <Text style={styles.answeredText}>Answered</Text>
          </View>
        )}
      </MotiView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={['#1e293b', '#0f172a']}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerLogoContainer}>
          <MaterialIcons name="question-answer" size={24} color="white" />
          <Text style={styles.headerLogoText}>Research Questions</Text>
        </View>
        
        <View style={styles.rightPlaceholder} />
      </LinearGradient>
      
      {/* Research Info */}
      {query && (
        <View style={styles.queryContainer}>
          <Text style={styles.queryLabel}>Research Query:</Text>
          <Text style={styles.queryText}>{query}</Text>
        </View>
      )}
      
      {/* Main Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6c63ff" />
            <Text style={styles.loadingText}>Loading research questions...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={48} color="#ff6b6b" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={loadQuestions}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : !hasQuestions ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#6c63ff" />
            <Text style={styles.emptyText}>
              Please wait while we load questions...
            </Text>
            <MotiView
              from={{ opacity: 0.6 }}
              animate={{ opacity: 1 }}
              transition={{
                type: 'timing',
                duration: 1000,
                loop: true,
              }}
              style={styles.loadingIndicator}
            >
              <MaterialIcons name="sync" size={24} color="#6c63ff" />
            </MotiView>
          </View>
        ) : (
          <>
            <ScrollView 
              ref={scrollViewRef}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sectionTitle}>Please answer the following questions:</Text>
              
              {questions.map((question, index) => renderQuestion(question, index))}
              
              <View style={styles.spacer} />
            </ScrollView>
            
            {/* Submit Button */}
            <View style={styles.submitContainer}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (submitting || success) && styles.disabledButton
                ]}
                onPress={handleSubmitAll}
                disabled={submitting || success}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : success ? (
                  <View style={styles.successContainer}>
                    <MaterialIcons name="check-circle" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>Answers Submitted!</Text>
                  </View>
                ) : (
                  <View style={styles.submitContent}>
                    <Text style={styles.submitButtonText}>Submit All Answers</Text>
                    <MaterialIcons name="send" size={20} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
              
              <Text style={styles.noteText}>
                Your answers help improve your research results.
              </Text>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(108, 99, 255, 0.2)',
  },
  backButton: {
    padding: 8,
  },
  headerLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogoText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  rightPlaceholder: {
    width: 40,
  },
  queryContainer: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(108, 99, 255, 0.2)',
  },
  queryLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  queryText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  keyboardAvoidView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: 'rgba(108, 99, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.5)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#6c63ff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    maxWidth: '80%',
    marginBottom: 16,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  questionContainer: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.3)',
  },
  questionHeader: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6c63ff',
    backgroundColor: 'rgba(108, 99, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    overflow: 'hidden',
  },
  questionText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
    flex: 1,
    lineHeight: 22,
  },
  inputContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.3)',
    padding: 2,
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    color: 'white',
    padding: 12,
    minHeight: 100,
  },
  answeredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  answeredText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#4ade80',
  },
  spacer: {
    height: 80,
  },
  submitContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(108, 99, 255, 0.3)',
  },
  submitButton: {
    backgroundColor: '#6c63ff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteText: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginTop: 12,
  },
  loadingIndicator: {
    alignItems: 'center',
    marginTop: 10,
  },
});

export default ResearchQuestionsScreen; 