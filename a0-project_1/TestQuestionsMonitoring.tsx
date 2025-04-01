import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  TextInput
} from 'react-native';
import ResearchQuestions from './components/ResearchQuestions';
import { generateResearchId, generateUserId } from './utils/supabase';
import { createTestQuestion } from './utils/questionsManager';

/**
 * Test component for monitoring and answering research questions
 * This component is for testing only and would not be part of the final app
 */
const TestQuestionsMonitoring: React.FC = () => {
  const [researchId, setResearchId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
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

  // Create a test question
  const handleCreateQuestion = async () => {
    if (!researchId || !userId) {
      addLog('Error: Please generate IDs first');
      return;
    }
    
    addLog('Creating test question...');
    
    try {
      const question = await createTestQuestion(researchId, userId);
      
      if (question) {
        addLog(`Successfully created question: "${question.question}"`);
        addLog(`Question ID: ${question.question_id}`);
      } else {
        addLog('Failed to create test question');
      }
    } catch (error) {
      addLog(`Error creating question: ${error}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Questions Monitoring</Text>
      
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
      
      {/* Actions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
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
        
        <TouchableOpacity 
          style={[styles.button, styles.createButton]}
          onPress={handleCreateQuestion}
          disabled={!researchId || !userId}
        >
          <Text style={styles.buttonText}>Create Test Question</Text>
        </TouchableOpacity>
      </View>
      
      {/* Questions Section */}
      {isMonitoring && (
        <View style={styles.questionsContainer}>
          <Text style={styles.sectionTitle}>Questions</Text>
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
    height: 200,
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

export default TestQuestionsMonitoring; 
 
 