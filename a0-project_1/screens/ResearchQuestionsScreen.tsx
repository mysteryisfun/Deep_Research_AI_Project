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
import { fetchQuestions, submitAllAnswers, monitorQuestions } from '../utils/questionsManager';
import { supabase } from '../utils/supabase';

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
  
  // Get the research ID from the route params
  const { research_id, query } = route.params || {};
  
  const [questions, setQuestions] = useState<ResearchQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [hasQuestions, setHasQuestions] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const stopMonitoringRef = useRef<(() => void) | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Load questions when the component mounts
  useEffect(() => {
    if (!research_id) {
      setError('No research ID provided');
      setLoading(false);
      return;
    }
    
    loadQuestions();
    
    // Setup real-time monitoring for questions
    const stopMonitoring = monitorQuestions(research_id, (updatedQuestions) => {
      setQuestions(updatedQuestions);
      
      // Update answers state with any new answers
      setAnswers(prev => {
        const newAnswers = { ...prev };
        updatedQuestions.forEach(q => {
          if (q.answer && !prev[q.question_id]) {
            newAnswers[q.question_id] = q.answer;
          }
        });
        return newAnswers;
      });
      
      setHasQuestions(updatedQuestions.length > 0);
    });
    
    stopMonitoringRef.current = stopMonitoring;
    
    // Cleanup on unmount
    return () => {
      if (stopMonitoringRef.current) {
        stopMonitoringRef.current();
      }
    };
  }, [research_id]);
  
  // Load initial questions
  const loadQuestions = async () => {
    setLoading(true);
    try {
      const fetchedQuestions = await fetchQuestions(research_id);
      setQuestions(fetchedQuestions);
      
      // Initialize answers state with any existing answers
      const initialAnswers: Record<string, string> = {};
      fetchedQuestions.forEach(q => {
        if (q.answer) {
          initialAnswers[q.question_id] = q.answer;
        }
      });
      setAnswers(initialAnswers);
      
      setHasQuestions(fetchedQuestions.length > 0);
    } catch (err) {
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
      console.log('Raw answers to submit:', JSON.stringify(answers));
      
      // Debug question IDs format
      const questionIds = Object.keys(answers);
      console.log(`Question IDs in submission: ${questionIds.join(', ')}`);
      
      // Get any available questions from the database to double-check format
      const { data: batchData, error: batchError } = await supabase
        .from('research_questions_array')
        .select('*')
        .eq('research_id', research_id)
        .maybeSingle();
        
      if (batchData) {
        console.log(`Found question batch: ${batchData.question_id}`);
        console.log(`Batch contains ${batchData.questions?.length || 0} questions`);
        if (batchData.questions?.length > 0) {
          console.log(`Sample question ID format: ${batchData.questions[0].id}`);
        }
      } else if (batchError) {
        console.warn(`Error checking question batch: ${batchError.message}`);
      }
      
      const result = await submitAllAnswers(research_id, answers);
      
      if (result.success) {
        console.log('Successfully submitted answers');
        
        // Verbose logging to help with debugging
        if (result.data) {
          console.log('Submission result:', JSON.stringify(result.data));
          
          // Check if answers were actually saved
          const savedAnswers = result.data.answers || [];
          console.log(`Saved ${savedAnswers.length} answers to database`);
          
          if (savedAnswers.length > 0) {
            console.log('First saved answer:', JSON.stringify(savedAnswers[0]));
          }
        }
        
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
        console.error('Failed to submit answers:', result.error);
        setError('Failed to submit answers. Please try again.');
        
        // More detailed error message
        Alert.alert(
          'Submission Error',
          `Failed to submit answers: ${result.error?.message || 'Unknown error'}`,
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
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