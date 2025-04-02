import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase, generateEntityId, generateUserId } from './utils/supabase';
import { fetchQuestions, submitAllAnswers } from './utils/questionsManager';

/**
 * Test screen for n8n webhook functionality - simplified version
 * This is a standalone screen for testing webhook submissions that minimizes dependencies
 */
const TestN8nWebhook = () => {
  const [researchId, setResearchId] = useState('test-n8n-webhook');
  const [userId, setUserId] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('https://atomic123.app.n8n.cloud/webhook-waiting/126');
  const [question1, setQuestion1] = useState('What specific aspects of this research are most important to you?');
  const [question2, setQuestion2] = useState('Would you like the results to focus on practical applications or theoretical concepts?');
  const [answer1, setAnswer1] = useState('');
  const [answer2, setAnswer2] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Generate a simple user ID on component mount
  useEffect(() => {
    try {
      const generatedId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      setUserId(generatedId);
      addLog(`Generated user ID: ${generatedId}`);
    } catch (error) {
      console.error('Error generating user ID:', error);
    }
  }, []);
  
  // Add a log entry
  const addLog = (message: string) => {
    try {
      setLogs(prevLogs => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prevLogs]);
    } catch (error) {
      console.error('Error adding log:', error);
    }
  };
  
  // Simple placeholder for creating test questions
  const createTestQuestions = async () => {
    setLoading(true);
    addLog('Creating test questions...');
    
    try {
      // Simulate the request
      addLog(`Would create questions for research ID: ${researchId}`);
      addLog(`And user ID: ${userId}`);
      addLog(`Using webhook URL: ${webhookUrl}`);
      
      // Wait a moment to simulate network request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addLog('Successfully created test questions (simulated)');
      Alert.alert('Success', 'Test questions created successfully (simulated)!');
    } catch (error: any) {
      addLog(`Error: ${error?.message || 'Unknown error'}`);
      Alert.alert('Error', `An error occurred: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Submit answers to test the webhook
  const submitTestAnswers = async () => {
    if (!answer1.trim() && !answer2.trim()) {
      Alert.alert('Missing Answers', 'Please provide at least one answer before submitting.');
      return;
    }
    
    setLoading(true);
    addLog('Submitting test answers...');
    
    try {
      // Simulate the request
      addLog(`Would submit answers for research ID: ${researchId}`);
      if (answer1) addLog(`Answer 1: ${answer1}`);
      if (answer2) addLog(`Answer 2: ${answer2}`);
      
      // Wait a moment to simulate network request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addLog('Successfully submitted answers (simulated)');
      Alert.alert('Success', 'Answers submitted successfully (simulated)!');
    } catch (error: any) {
      addLog(`Error: ${error?.message || 'Unknown error'}`);
      Alert.alert('Error', `An error occurred: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Test direct webhook
  const testWebhookDirectly = async () => {
    setLoading(true);
    addLog('Testing webhook directly...');
    
    try {
      addLog(`Would send direct webhook to: ${webhookUrl}`);
      
      // Wait a moment to simulate network request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addLog('Webhook test successful (simulated)!');
      Alert.alert('Success', 'Direct webhook test was successful (simulated)!');
    } catch (error: any) {
      addLog(`Error: ${error?.message || 'Unknown error'}`);
      Alert.alert('Error', `An error occurred: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.headerText}>N8n Webhook Test (Simplified)</Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Webhook Configuration</Text>
          
          <Text style={styles.label}>Research ID:</Text>
          <TextInput
            style={styles.input}
            value={researchId}
            onChangeText={setResearchId}
            placeholder="Enter research ID..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
          />
          
          <Text style={styles.label}>User ID:</Text>
          <TextInput
            style={styles.input}
            value={userId}
            onChangeText={setUserId}
            placeholder="Enter user ID..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
          />
          
          <Text style={styles.label}>N8n Webhook URL:</Text>
          <TextInput
            style={styles.input}
            value={webhookUrl}
            onChangeText={setWebhookUrl}
            placeholder="Enter n8n webhook URL..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Questions</Text>
          
          <Text style={styles.label}>Question 1:</Text>
          <TextInput
            style={styles.input}
            value={question1}
            onChangeText={setQuestion1}
            placeholder="Enter question 1..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
          />
          
          <Text style={styles.label}>Question 2:</Text>
          <TextInput
            style={styles.input}
            value={question2}
            onChangeText={setQuestion2}
            placeholder="Enter question 2..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Answers</Text>
          
          <Text style={styles.label}>Answer 1:</Text>
          <TextInput
            style={styles.input}
            value={answer1}
            onChangeText={setAnswer1}
            placeholder="Enter answer 1..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            multiline
          />
          
          <Text style={styles.label}>Answer 2:</Text>
          <TextInput
            style={styles.input}
            value={answer2}
            onChangeText={setAnswer2}
            placeholder="Enter answer 2..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            multiline
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={createTestQuestions}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.buttonText}>Create Test Questions</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={submitTestAnswers}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.buttonText}>Submit Answers</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={testWebhookDirectly}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.buttonText}>Test Webhook Directly</Text>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Logs</Text>
          <View style={styles.logsContainer}>
            {logs.length === 0 ? (
              <Text style={styles.logEmptyText}>No logs yet. Actions will be recorded here.</Text>
            ) : (
              logs.map((log, index) => (
                <Text key={index} style={styles.logText}>{log}</Text>
              ))
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
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    color: '#94a3b8',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1e293b',
    color: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#6366f1',
  },
  secondaryButton: {
    backgroundColor: '#475569',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  logsContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    maxHeight: 200,
  },
  logText: {
    color: '#94a3b8',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 4,
  },
  logEmptyText: {
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default TestN8nWebhook; 