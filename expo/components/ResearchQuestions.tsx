import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  FlatList,
  ScrollView
} from 'react-native';
import { ResearchQuestion, fetchQuestions, submitAnswer, monitorQuestions, submitAllAnswers } from '../utils/questionsManager';

interface ResearchQuestionsProps {
  researchId: string;
  onQuestionsLoaded?: (hasQuestions: boolean) => void;
}

const ResearchQuestions: React.FC<ResearchQuestionsProps> = ({ 
  researchId,
  onQuestionsLoaded 
}) => {
  const [questions, setQuestions] = useState<ResearchQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const stopMonitoringRef = useRef<(() => void) | null>(null);

  // Load initial questions and set up monitoring
  useEffect(() => {
    if (!researchId) return;
    
    console.log('Starting questions component with research ID:', researchId);
    
    // Initial fetch of questions
    const loadQuestions = async () => {
      setLoading(true);
      const fetchedQuestions = await fetchQuestions(researchId);
      setQuestions(fetchedQuestions);
      
      // Initialize answers state with any existing answers
      const initialAnswers: Record<string, string> = {};
      fetchedQuestions.forEach(q => {
        if (q.answer) {
          initialAnswers[q.question_id] = q.answer;
        }
      });
      setAnswers(initialAnswers);
      
      setLoading(false);
      
      // Notify parent component if provided
      if (onQuestionsLoaded) {
        onQuestionsLoaded(fetchedQuestions.length > 0);
      }
    };
    
    loadQuestions();
    
    // Set up monitoring for new questions
    const stopMonitoring = monitorQuestions(researchId, (updatedQuestions) => {
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
      
      // Notify parent component about updates if provided
      if (onQuestionsLoaded) {
        onQuestionsLoaded(updatedQuestions.length > 0);
      }
    });
    
    stopMonitoringRef.current = stopMonitoring;
    
    // Clean up monitoring when component unmounts
    return () => {
      if (stopMonitoringRef.current) {
        stopMonitoringRef.current();
      }
    };
  }, [researchId]);
  
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
    const hasAnswers = Object.values(answers).some(answer => answer && answer.trim() !== '');
    if (!hasAnswers) return;
    
    setSubmitting(true);
    
    try {
      console.log(`Submitting all answers for research ID: ${researchId}`);
      console.log(`Current answers object:`, JSON.stringify(answers));
      
      // Convert combined question IDs to actual question IDs if needed
      // This step is important because the ResearchQuestion objects have formatted IDs like "batch-id-q1"
      // but to properly save answers we need to send both formats to the submitAllAnswers function
      
      const result = await submitAllAnswers(researchId, answers);
      
      if (result.success) {
        console.log('Submit all answers succeeded');
        
        // Update the questions list with the new answers
        const updatedQuestions = questions.map(q => {
          const answer = answers[q.question_id];
          if (answer && answer.trim() !== '') {
            return { ...q, answer, answered: true };
          }
          return q;
        });
        
        setQuestions(updatedQuestions);
        
        // Clear answered questions from the form
        const remainingAnswers: Record<string, string> = {};
        Object.keys(answers).forEach(id => {
          const question = updatedQuestions.find(q => q.question_id === id);
          if (question && !question.answered) {
            remainingAnswers[id] = answers[id];
          }
        });
        setAnswers(remainingAnswers);
        
        console.log('All answers submitted successfully');
      } else {
        console.error('Failed to submit answers:', result.error);
        // You could show an error message to the user here
      }
    } catch (error) {
      console.error('Error submitting answers:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Render each question item
  const renderQuestion = ({ item }: { item: ResearchQuestion }) => {
    return (
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{item.question}</Text>
        
        {item.answered ? (
          <View style={styles.answerContainer}>
            <Text style={styles.answerLabel}>Your answer:</Text>
            <Text style={styles.answerText}>{item.answer}</Text>
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type your answer here..."
              value={answers[item.question_id] || ''}
              onChangeText={(text) => handleAnswerChange(item.question_id, text)}
              multiline
              editable={!submitting}
            />
          </View>
        )}
      </View>
    );
  };

  if (loading && questions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading questions...</Text>
      </View>
    );
  }

  if (questions.length === 0 && !loading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          No questions available yet. Questions will appear here as they are generated.
        </Text>
      </View>
    );
  }

  // Count unanswered questions
  const unansweredCount = questions.filter(q => !q.answered).length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Research Questions</Text>
      <FlatList
        data={questions}
        renderItem={renderQuestion}
        keyExtractor={(item) => item.question_id}
        contentContainerStyle={styles.listContainer}
      />
      
      {unansweredCount > 0 && (
        <View style={styles.submitAllContainer}>
          <TouchableOpacity 
            style={[
              styles.submitAllButton, 
              submitting && styles.disabledButton
            ]}
            onPress={handleSubmitAll}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitAllButtonText}>
                Submit All Answers
              </Text>
            )}
          </TouchableOpacity>
          <Text style={styles.questionsRemainingText}>
            {unansweredCount} question{unansweredCount !== 1 ? 's' : ''} remaining
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 80, // Add padding to make room for the submit button
  },
  questionContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  inputContainer: {
    marginTop: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitAllContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  submitAllButton: {
    backgroundColor: '#0066cc',
    borderRadius: 4,
    padding: 14,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  submitAllButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  questionsRemainingText: {
    textAlign: 'center',
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  answerContainer: {
    backgroundColor: '#e6f2ff',
    padding: 12,
    borderRadius: 4,
    marginTop: 8,
  },
  answerLabel: {
    fontWeight: '500',
    fontSize: 14,
    marginBottom: 4,
    color: '#0066cc',
  },
  answerText: {
    fontSize: 16,
  },
});

export default ResearchQuestions; 