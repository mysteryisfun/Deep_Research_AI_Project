import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

/**
 * Test screen for ResearchQuestionsScreen functionality.
 * This allows us to directly test the questions screen by entering a research ID.
 */
const TestQuestionsSubmissionScreen = () => {
  const navigation = useNavigation<any>();
  const [researchId, setResearchId] = useState<string>('test-research-1234');
  const [query, setQuery] = useState<string>('Test research query');
  
  const handleNavigateToQuestions = () => {
    if (!researchId.trim()) {
      Alert.alert('Missing Research ID', 'Please enter a valid research ID to continue.');
      return;
    }
    
    // Navigate to the ResearchQuestionsScreen with the provided research ID
    navigation.navigate('ResearchQuestionsScreen', {
      research_id: researchId,
      query: query
    });
  };
  
  const handleRunTestScript = () => {
    Alert.alert(
      'Run Test Script',
      'To run the test script, execute the following command in your terminal:',
      [
        { text: 'OK', style: 'default' }
      ],
      { cancelable: true }
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <LinearGradient
        colors={['#1e293b', '#0f172a']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <MaterialIcons name="science" size={24} color="white" />
          <Text style={styles.headerText}>Questions Submission Test</Text>
        </View>
      </LinearGradient>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoContainer}>
          <MaterialIcons name="info-outline" size={24} color="#6c63ff" />
          <Text style={styles.infoText}>
            This screen helps test the ResearchQuestionsScreen functionality. 
            A test research ID is pre-filled below. Click "Go to Questions Screen" 
            to test the questions submission flow.
          </Text>
        </View>
        
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Research ID:</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter research ID here..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={researchId}
            onChangeText={setResearchId}
          />
          
          <Text style={styles.inputLabel}>Query (optional):</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter test query..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={query}
            onChangeText={setQuery}
          />
        </View>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={handleNavigateToQuestions}
        >
          <LinearGradient
            colors={['#6c63ff', '#4f46e5']}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Go to Questions Screen</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={handleRunTestScript}
        >
          <Text style={styles.secondaryButtonText}>Run Test Script</Text>
        </TouchableOpacity>
        
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Test Instructions:</Text>
          <Text style={styles.instructionStep}>1. Make sure the test script has been run:</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>node a0-project/test-questions-submission.js</Text>
          </View>
          <Text style={styles.instructionStep}>2. The research ID is pre-filled for you</Text>
          <Text style={styles.instructionStep}>3. Click "Go to Questions Screen"</Text>
          <Text style={styles.instructionStep}>4. Answer the questions and submit</Text>
          <Text style={styles.instructionStep}>5. Check the terminal for real-time updates</Text>
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
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(108, 99, 255, 0.2)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  infoContainer: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.3)',
  },
  infoText: {
    color: 'white',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    color: 'white',
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 8,
    padding: 12,
    color: 'white',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.3)',
    fontSize: 16,
  },
  button: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  secondaryButton: {
    backgroundColor: 'rgba(108, 99, 255, 0.2)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.3)',
  },
  secondaryButtonText: {
    color: '#6c63ff',
    fontSize: 16,
    fontWeight: '600',
  },
  instructionsContainer: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  instructionsTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  instructionStep: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  codeBlock: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    padding: 12,
    borderRadius: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  codeText: {
    color: '#6c63ff',
    fontFamily: 'monospace',
    fontSize: 14,
  },
});

export default TestQuestionsSubmissionScreen; 