import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { ResearchQuestion, fetchQuestions, monitorQuestions } from './utils/questionsManager';
import { generateResearchId, generateUserId } from './utils/supabase';
import ResearchQuestions from './components/ResearchQuestions';

/**
 * Test component for displaying questions without changing existing functionality
 */
const TestQuestionsDisplay: React.FC = () => {
  const [researchId, setResearchId] = useState<string>('');
  const [customResearchId, setCustomResearchId] = useState<string>('');
  const [userId, setUserId] = useState<string>(generateUserId());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasQuestions, setHasQuestions] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Generate a new research ID
  const generateNewId = () => {
    const newId = generateResearchId();
    setResearchId(newId);
    setCustomResearchId('');
    addLog(`Generated new research ID: ${newId}`);
  };

  // Update with custom ID
  const updateCustomId = () => {
    if (customResearchId.trim()) {
      setResearchId(customResearchId);
      addLog(`Using custom research ID: ${customResearchId}`);
    }
  };

  // Add a log message
  const addLog = (message: string) => {
    setLogs(prev => [message, ...prev].slice(0, 20));
  };

  // Handle when questions are loaded
  const handleQuestionsLoaded = (hasQuestionsLoaded: boolean) => {
    setIsLoading(false);
    setHasQuestions(hasQuestionsLoaded);
    addLog(`Questions loaded: ${hasQuestionsLoaded ? 'Yes' : 'No'}`);
  };

  // Fetch questions when research ID changes
  useEffect(() => {
    if (researchId) {
      setIsLoading(true);
      addLog(`Fetching questions for research ID: ${researchId}`);
    }
  }, [researchId]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      <View style={styles.header}>
        <Text style={styles.headerText}>Test Questions Display</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {/* ID Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Research ID</Text>
          
          <View style={styles.idContainer}>
            <Text style={styles.idLabel}>Current ID:</Text>
            <Text style={styles.idValue}>{researchId || 'No ID set'}</Text>
          </View>
          
          <View style={styles.idInputContainer}>
            <TextInput
              style={styles.idInput}
              placeholder="Enter research ID..."
              value={customResearchId}
              onChangeText={setCustomResearchId}
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
            <TouchableOpacity 
              style={[styles.button, styles.smallButton]} 
              onPress={updateCustomId}
              disabled={!customResearchId.trim()}
            >
              <Text style={styles.buttonText}>Use</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={generateNewId}
          >
            <Text style={styles.buttonText}>Generate New ID</Text>
          </TouchableOpacity>
        </View>
        
        {/* Questions Display Section */}
        {researchId ? (
          <View style={styles.section}>
            <View style={styles.questionsHeader}>
              <Text style={styles.sectionTitle}>Questions</Text>
              {isLoading && <ActivityIndicator color="#6c63ff" />}
            </View>
            
            <View style={styles.questionsContainer}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#6c63ff" />
                  <Text style={styles.loadingText}>Loading questions...</Text>
                </View>
              ) : (
                <ResearchQuestions 
                  researchId={researchId}
                  onQuestionsLoaded={handleQuestionsLoaded}
                />
              )}
            </View>
          </View>
        ) : (
          <View style={styles.noIdContainer}>
            <Text style={styles.noIdText}>
              Generate or enter a research ID to display questions
            </Text>
          </View>
        )}
        
        {/* Logs Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Logs</Text>
          <View style={styles.logsContainer}>
            {logs.map((log, index) => (
              <Text key={index} style={styles.logText}>
                {log}
              </Text>
            ))}
            {logs.length === 0 && (
              <Text style={styles.emptyLogText}>No activity yet</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(108, 99, 255, 0.2)',
  },
  headerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.2)',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  idLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 8,
  },
  idValue: {
    color: '#6c63ff',
    fontWeight: '600',
    flex: 1,
  },
  idInputContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  idInput: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.3)',
  },
  button: {
    backgroundColor: '#6c63ff',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 60,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  questionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionsContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 8,
    overflow: 'hidden',
    minHeight: 300,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.3)',
  },
  noIdContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.2)',
  },
  noIdText: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 12,
  },
  logsContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 8,
    padding: 12,
    maxHeight: 200,
  },
  logText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  emptyLogText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default TestQuestionsDisplay; 
 
 