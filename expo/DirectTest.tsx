import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import axios from 'axios';

// Direct webhook URL - no indirection
const WEBHOOK_URL = 'https://atomic123.app.n8n.cloud/webhook-test/055cedaa-a313-4625-a41c-7e7f9560b7a3';

export default function DirectTest() {
  console.log('DirectTest component rendering');
  
  const [result, setResult] = useState('Ready to test');
  const [isLoading, setIsLoading] = useState(false);

  const sendTest = async () => {
    console.log("Test button pressed");
    setIsLoading(true);
    setResult('Sending test request...');
    
    try {
      const testData = {
        user_id: "test-user-simple-123",
        agent: "general",
        query: "Test query from simplified test",
        breadth: 3,
        depth: 3,
        include_technical_terms: true,
        output_format: "Research Paper"
      };
      
      console.log("Sending request with data:", JSON.stringify(testData));
      
      const response = await axios.post(WEBHOOK_URL, testData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log("Response received:", response.status);
      setResult(`Success! Status: ${response.status}`);
    } catch (error) {
      console.error("Error:", error);
      setResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Webhook Test</Text>
      <Button 
        title={isLoading ? "Sending..." : "Send Test Request"} 
        onPress={sendTest}
        disabled={isLoading}
      />
      <View style={styles.resultContainer}>
        <Text>{result}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  resultContainer: {
    marginTop: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    width: '100%'
  }
}); 
      console.error('Error:', error);
      
      if (axios.isAxiosError(error)) {
        setResult(`ERROR: ${error.message}\n${JSON.stringify({
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method
          }
        }, null, 2)}`);
      } else {
        setResult(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      setError('Error with Axios request');
    } finally {
      setIsLoading(false);
    }
  };

  const useUtilityFunction = async () => {
    setIsLoading(true);
    setResult('Testing using utility function...');
    setError(null);
    
    try {
      console.log('Calling utility function');
      
      // Call the utility function
      const result = await testWebhook();
      
      console.log('Utility function result:', JSON.stringify(result));
      
      if (result.success) {
        setResult(`UTILITY SUCCESS!\nData: ${JSON.stringify(result.data, null, 2)}`);
      } else {
        setResult(`UTILITY ERROR: ${result.error}`);
        setError('Error in utility function');
      }
    } catch (error) {
      console.error('Utility function error:', error);
      setResult(`UTILITY EXCEPTION: ${error instanceof Error ? error.message : String(error)}`);
      setError('Exception in utility function');
    } finally {
      setIsLoading(false);
    }
  };

  const useFetchAPI = async () => {
    setIsLoading(true);
    setResult('Testing using fetch API...');
    setError(null);
    
    try {
      console.log('Using fetch API to call webhook');
      
      const testData = {
        user_id: "test-user-fetch-123",
        agent: "general",
        query: "Test query using fetch API",
        breadth: 3,
        depth: 3,
        include_technical_terms: true,
        output_format: "Research Paper",
        timestamp: new Date().toISOString()
      };
      
      console.log('Fetch payload:', JSON.stringify(testData));
      
      // Use fetch API instead of axios
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(testData)
      });
      
      const status = response.status;
      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { raw: responseText };
      }
      
      console.log('Fetch response:', status, JSON.stringify(responseData));
      setResult(`FETCH SUCCESS! Status: ${status}\nData: ${JSON.stringify(responseData, null, 2)}`);
    } catch (error) {
      console.error('Fetch error:', error);
      setResult(`FETCH ERROR: ${error instanceof Error ? error.message : String(error)}`);
      setError('Error with fetch API');
    } finally {
      setIsLoading(false);
    }
  };

  // Test on component mount
  useEffect(() => {
    console.log('DirectTest component mounted');
  }, []);

  // Handle rendering errors
  try {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Direct Webhook Test</Text>
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        <View style={styles.buttonContainer}>
          <Button 
            title={isLoading ? "Sending..." : "Test with Axios"}
            onPress={sendDirectRequest}
            disabled={isLoading}
          />
          
          <View style={{ height: 10 }} />
          
          <Button 
            title={isLoading ? "Sending..." : "Test with Utility"}
            onPress={useUtilityFunction}
            disabled={isLoading}
            color="#009688"
          />
          
          <View style={{ height: 10 }} />
          
          <Button 
            title={isLoading ? "Sending..." : "Test with Fetch API"}
            onPress={useFetchAPI}
            disabled={isLoading}
            color="#673AB7"
          />
        </View>
        
        <ScrollView style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Result:</Text>
          {isLoading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (
            <Text style={styles.resultText}>{result}</Text>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  } catch (renderError) {
    console.error('Render error:', renderError);
    // Fallback UI in case of rendering errors
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Error Rendering Test Screen</Text>
        <Text style={styles.errorText}>
          {renderError instanceof Error ? renderError.message : 'Unknown render error'}
        </Text>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  resultContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ef9a9a',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  }
}); 