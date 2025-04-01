import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  TextInput,
  Alert
} from 'react-native';
import { generateResearchId, generateUserId } from './utils/supabase';
import { createBatchTestQuestions, fetchQuestions } from './utils/questionsManager';
import ResearchQuestions from './components/ResearchQuestions';

/**
 * Test component for demonstrating array-based questions
 * This component allows creating and testing the new question array format
 */
const TestArrayQuestions: React.FC = () => {
  const [researchId, setResearchId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [questions, setQuestions] = useState<string[]>(['']);
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Add a log message
  const addLog = (message: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
  };

  // Generate new IDs
  const handleGenerateIds = () => {
    const newResearchId = generateResearchId();
    const newUserId = generateUserId();
    
    setResearchId(newResearchId);
    setUserId(newUserId);
    
    addLog(`Generated new IDs:`);
    addLog(`- Research ID: ${newResearchId}`);
    addLog(`- User ID: ${newUserId}`);
  };

  // Update a question in the list
  const updateQuestion = (index: number, text: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = text;
    setQuestions(newQuestions);
  };

  // Add a new question to the list
  const addQuestion = () => {
    setQuestions(prev => [...prev, '']);
  };

  // Remove a question from the list
  const removeQuestion = (index: number) => {
    if (questions.length <= 1) {
      Alert.alert('Cannot remove', 'You need at least one question');
      return;
    }
    
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  // Create batch of questions
  const handleCreateQuestions = async () => {
    if (!researchId || !userId) {
      addLog('Error: Please generate IDs first');
      return;
    }
    
    // Filter out empty questions
    const validQuestions = questions.filter(q => q.trim() !== '');
    
    if (validQuestions.length === 0) {
      addLog('Error: Please add at least one question');
      return;
    }
    
    addLog(`Creating batch of ${validQuestions.length} questions...`);
    
    try {
      const result = await createBatchTestQuestions(researchId, userId, validQuestions);
      
      if (result) {
        addLog(`Successfully created batch of questions!`);
        addLog(`Question batch ID: ${result.question_id}`);
        addLog(`Number of questions: ${result.questions.length}`);
        
        // Start monitoring automatically
        handleStartMonitoring();
      } else {
        addLog('Failed to create questions batch');
      }
    } catch (error) {
      addLog(`Error creating questions: ${error}`);
    }
  };

  // Start monitoring for questions
  const handleStartMonitoring = () => {
    if (!researchId) {
      addLog('Error: Please generate IDs first');
      return;
    }
    
    setIsMonitoring(true);
    addLog(`Started monitoring for research ID: ${researchId}`);
  };

  // Stop monitoring
  const handleStopMonitoring = () => {
    setIsMonitoring(false);
    addLog('Stopped monitoring for questions');
  };
  
  // Test fetching questions
  const handleTestFetch = async () => {
    if (!researchId) {
      addLog('Error: Please generate IDs first');
      return;
    }
    
    addLog('Testing fetch questions from array...');
    
    try {
      const fetchedQuestions = await fetchQuestions(researchId);
      
      if (fetchedQuestions.length > 0) {
        addLog(`Successfully fetched ${fetchedQuestions.length} questions`);
        fetchedQuestions.forEach((q, i) => {
          addLog(`Question ${i+1}: ${q.question.substring(0, 30)}${q.question.length > 30 ? '...' : ''}`);
        });
      } else {
        addLog('No questions found');
      }
    } catch (error) {
      addLog(`Error fetching questions: ${error}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Array-Based Questions</Text>
      
      {/* IDs Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>IDs</Text>
        <View style={styles.idContainer}>
          <Text style={styles.idLabel}>Research ID:</Text>
          <TextInput
            style={styles.idInput}
            value={researchId}
            onChangeText={setResearchId}
            placeholder="Enter research ID or generate one"
          />
        </View>
        <View style={styles.idContainer}>
          <Text style={styles.idLabel}>User ID:</Text>
          <TextInput
            style={styles.idInput}
            value={userId}
            onChangeText={setUserId}
            placeholder="Enter user ID or generate one"
          />
        </View>
        <TouchableOpacity 
          style={styles.button}
          onPress={handleGenerateIds}
        >
          <Text style={styles.buttonText}>Generate New IDs</Text>
        </TouchableOpacity>
      </View>
      
      {/* Questions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Questions</Text>
        <ScrollView style={styles.questionsInputContainer}>
          {questions.map((question, index) => (
            <View key={index} style={styles.questionInputRow}>
              <TextInput
                style={styles.questionInput}
                value={question}
                onChangeText={(text) => updateQuestion(index, text)}
                placeholder={`Enter question ${index + 1}`}
                multiline
              />
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => removeQuestion(index)}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity 
            style={styles.addButton}
            onPress={addQuestion}
          >
            <Text style={styles.addButtonText}>+ Add Question</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      {/* Actions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <TouchableOpacity 
          style={[styles.button, styles.createButton]}
          onPress={handleCreateQuestions}
          disabled={!researchId || !userId}
        >
          <Text style={styles.buttonText}>Create Batch of Questions</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={handleTestFetch}
          disabled={!researchId}
        >
          <Text style={styles.buttonText}>Test Fetch Questions</Text>
        </TouchableOpacity>
        
        {isMonitoring ? (
          <TouchableOpacity 
            style={[styles.button, styles.stopButton]}
            onPress={handleStopMonitoring}
          >
            <Text style={styles.buttonText}>Stop Monitoring</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.button}
            onPress={handleStartMonitoring}
            disabled={!researchId}
          >
            <Text style={styles.buttonText}>Start Monitoring</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Questions Display Section */}
      {isMonitoring && (
        <View style={styles.questionsContainer}>
          <Text style={styles.sectionTitle}>Questions Display</Text>
          <ResearchQuestions 
            researchId={researchId}
            onQuestionsLoaded={(hasQuestions) => {
              addLog(`Questions loaded. Has questions: ${hasQuestions}`);
            }}
          />
        </View>
      )}
      
      {/* Logs Section */}
      <View style={styles.logsContainer}>
        <Text style={styles.sectionTitle}>Logs</Text>
        <ScrollView style={styles.logs}>
          {logs.map((log, index) => (
            <Text key={index} style={styles.logText}>{log}</Text>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  section: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  idLabel: {
    width: 100,
    fontWeight: '500',
  },
  idInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    backgroundColor: '#fff',
  },
  questionsInputContainer: {
    maxHeight: 200,
    marginBottom: 8,
  },
  questionInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    backgroundColor: '#fff',
    minHeight: 40,
  },
  removeButton: {
    marginLeft: 8,
    width: 30,
    height: 30,
    backgroundColor: '#ff6b6b',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#e6f2ff',
    borderRadius: 4,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#0066cc',
    borderStyle: 'dashed',
  },
  addButtonText: {
    color: '#0066cc',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#0066cc',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  stopButton: {
    backgroundColor: '#cc0000',
  },
  createButton: {
    backgroundColor: '#009900',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 16,
  },
  questionsContainer: {
    flex: 1,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  logsContainer: {
    height: 150,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  logs: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 4,
    padding: 8,
  },
  logText: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 4,
  },
});

export default TestArrayQuestions; 
 
 