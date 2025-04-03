import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, StatusBar as RNStatusBar, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Toaster } from 'sonner-native';
import React, { useEffect } from 'react';
import HomeScreen from "./screens/HomeScreen";
import LoginScreen from "./screens/LoginScreen";
import DashboardScreen from "./screens/DashboardScreen";
import ChooseAgentScreen from "./screens/ChooseAgentScreen";
import HistoryScreen from "./screens/HistoryScreen";
import QueueScreen from "./screens/QueueScreen";
import FindStudyScreen from "./screens/FindStudyScreen";
import AgentListScreen from "./screens/AgentListScreen";
import ResearchChatScreen from "./screens/ResearchChatScreen";
import ResearchChatInterface from "./screens/ResearchChatInterface";
import ResearchResultScreen from "./screens/ResearchResultScreen";
import ResearchParametersScreen from "./screens/ResearchParametersScreen";
import ResearchQuestionsScreen from "./screens/ResearchQuestionsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import LogoutScreen from "./screens/LogoutScreen";
import ChangePasswordScreen from "./screens/ChangePasswordScreen";
import GeneralAgentScreen from "./screens/GeneralAgentScreen";
import BusinessAgentScreen from "./screens/BusinessAgentScreen";
import HealthAgentScreen from "./screens/HealthAgentScreen";
import FinancialAgentScreen from "./screens/FinancialAgentScreen";
import PrivacySecurityScreen from "./screens/PrivacySecurityScreen";
import TestN8nWebhook from "./TestN8nWebhook";
import SimpleTestScreen from "./screens/SimpleTestScreen";
import TestResearchResultScreen from "./screens/TestResearchResultScreen";
import TestActiveQueueScreen from "./screens/TestActiveQueueScreen";
import SimpleQueueTestScreen from "./screens/SimpleQueueTestScreen";
import AppErrorBoundary from './components/AppErrorBoundary';
import { ThemeProvider, useTheme, lightTheme } from './context/ThemeContext';
import { ResearchProvider } from './context/ResearchContext';
import { safelyAccessProperty } from './error-guard';
import { handleGlobalError, errorHandler, ErrorCategory, ErrorSeverity } from './utils/errorHandler';
import 'react-native-gesture-handler';
import ResearchProgressScreen from "./screens/ResearchProgressScreen";
import TestProgressScreen from "./screens/TestProgressScreen";
import { useNavigation } from '@react-navigation/native';
import SignupScreen from "./screens/SignupScreen";
import DevControlScreen from "./screens/DevControlScreen";
import DevPasswordScreen from "./screens/DevPasswordScreen";
import { UserProvider } from './context/UserContext';
// Import the user profile storage utility
import { recordSessionStart } from './utils/userStorage';
import { clearExpiredCache } from './utils/cacheManager';

// Configure global error handling for unhandled JS errors
if (!__DEV__) {
  // Only in production to avoid interfering with dev tools
  const globalErrorHandler = (error: Error, isFatal?: boolean) => {
    handleGlobalError(error, 'Unhandled JS Exception');
  };
  
  // Set up global error handler
  ErrorUtils.setGlobalHandler(globalErrorHandler);
}

const Stack = createNativeStackNavigator();

function RootStack({ initialRouteName }: { initialRouteName: string }) {
  return (
    <Stack.Navigator 
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="ChooseAgentScreen" component={ChooseAgentScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="Queue" component={QueueScreen} />
      <Stack.Screen name="FindStudyScreen" component={FindStudyScreen} />
      <Stack.Screen name="AgentListScreen" component={AgentListScreen} />
      <Stack.Screen name="ResearchChatScreen" component={ResearchChatScreen} />
      <Stack.Screen 
        name="ResearchQuestionsScreen" 
        component={ResearchQuestionsScreen}
        options={{
          animation: 'slide_from_right',
          presentation: 'card'
        }}
      />
      <Stack.Screen 
        name="ResearchProgressScreen" 
        component={ResearchProgressScreen}
        options={{
          animation: 'slide_from_right',
          presentation: 'card'
        }}
      />
      <Stack.Screen 
        name="ResearchChatInterface" 
        component={ResearchChatInterface}
        options={{
          animation: 'slide_from_right',
          presentation: 'card'
        }}
      />
      <Stack.Screen name="ResearchResultScreen" component={ResearchResultScreen} />
      <Stack.Screen name="ResearchParametersScreen" component={ResearchParametersScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="ChangePasswordScreen" component={ChangePasswordScreen} />
      <Stack.Screen name="PrivacySecurityScreen" component={PrivacySecurityScreen} />
      <Stack.Screen 
        name="LogoutScreen" 
        component={LogoutScreen}
        options={{
          presentation: 'transparentModal',
          animation: 'fade',
          headerShown: false,
        }}
      />
      <Stack.Screen name="GeneralAgentScreen" component={GeneralAgentScreen} />
      <Stack.Screen name="BusinessAgentScreen" component={BusinessAgentScreen} />
      <Stack.Screen name="HealthAgentScreen" component={HealthAgentScreen} />
      <Stack.Screen name="FinancialAgentScreen" component={FinancialAgentScreen} />
      <Stack.Screen name="DevPasswordScreen" component={DevPasswordScreen} />
      <Stack.Screen name="DevControlScreen" component={DevControlScreen} />
      
      {/* Test screens are still accessible but not in main flow */}
      <Stack.Screen name="TestN8nWebhook" component={TestN8nWebhook} />
      <Stack.Screen name="TestProgressScreen" component={TestProgressScreen} />
      <Stack.Screen name="SimpleTest" component={SimpleTestScreen} />
      <Stack.Screen name="TestResearchResultScreen" component={TestResearchResultScreen} />
      <Stack.Screen name="TestActiveQueueScreen" component={TestActiveQueueScreen} />
      <Stack.Screen name="SimpleQueueTest" component={SimpleQueueTestScreen} />
    </Stack.Navigator>
  );
}

// Create a simple initialization screen to debug any startup issues
function InitializationScreen({ onSelectTestScreen }: { onSelectTestScreen: (screen: string) => void }) {
  return (
    <SafeAreaProvider>
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Test Environment</Text>
        <Text style={styles.instructionText}>
          Select a test screen below to continue
        </Text>
        
        {/* Test Buttons for Direct Access */}
        <View style={styles.testButtonsContainer}>
          <TouchableOpacity 
            style={styles.testButton}
            onPress={() => onSelectTestScreen('TestProgressScreen')}
          >
            <Text style={styles.testButtonText}>Research Progress Test</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.testButton}
            onPress={() => onSelectTestScreen('TestN8nWebhook')}
          >
            <Text style={styles.testButtonText}>N8n Webhook Test</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.testButton}
            onPress={() => onSelectTestScreen('TestResearchResultScreen')}
          >
            <Text style={styles.testButtonText}>Research Result Test</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.testButton}
            onPress={() => onSelectTestScreen('TestActiveQueueScreen')}
          >
            <Text style={styles.testButtonText}>Active Research Queue</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.testButton}
            onPress={() => onSelectTestScreen('SimpleQueueTest')}
          >
            <Text style={styles.testButtonText}>Simple Queue Test</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.testButton, { backgroundColor: '#6c63ff' }]}
            onPress={() => onSelectTestScreen('DevPasswordScreen')}
          >
            <Text style={styles.testButtonText}>Developer Controls</Text>
          </TouchableOpacity>
        </View>
        
        {/* Option to go to normal app */}
        <TouchableOpacity 
          style={[styles.testButton, styles.loginButton]}
          onPress={() => onSelectTestScreen('Login')}
        >
          <Text style={styles.testButtonText}>Go to Login Screen</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaProvider>
  );
}

export default function App() {
  // Simple state to track if a test screen was selected
  const [selectedRoute, setSelectedRoute] = React.useState<string | null>(null);
  
  // Handle uncaught promise rejections
  useEffect(() => {
    const rejectionTrackingListener = (event: any, promise: Promise<any>, reason: any) => {
      errorHandler.captureError(
        reason || new Error('Unhandled promise rejection'),
        ErrorCategory.UNKNOWN,
        ErrorSeverity.HIGH,
        { source: 'unhandled_promise_rejection' }
      );
    };
    
    // Setup listeners
    if (!__DEV__) {
      const { addEventListener, removeEventListener } = global as any;
      if (addEventListener && removeEventListener) {
        addEventListener('unhandledrejection', rejectionTrackingListener);
        
        return () => {
          removeEventListener('unhandledrejection', rejectionTrackingListener);
        };
      }
    }
  }, []);
  
  // Initialize user profile caching and record app session start
  useEffect(() => {
    const initializeProfile = async () => {
      console.log('[App] Initializing user profile caching');
      
      try {
        // Record app session start in usage stats
        await recordSessionStart();
        
        // Clear expired cache items (older than 7 days)
        await clearExpiredCache();
        
        console.log('[App] User profile initialization completed');
      } catch (error) {
        console.error('[App] Error initializing user profile:', error);
      }
    };
    
    initializeProfile();
  }, []);
  
  // Function to handle test screen selection
  const handleSelectTestScreen = (screen: string) => {
    console.log(`Selected test screen: ${screen}`);
    setSelectedRoute(screen);
  };

  // Show initialization screen until user selects a test screen
  if (selectedRoute === null) {
    return <InitializationScreen onSelectTestScreen={handleSelectTestScreen} />;
  }

  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <UserProvider>
            <ResearchProvider>
              <Toaster />
              <NavigationContainer
                onError={(error) => {
                  errorHandler.captureError(
                    error,
                    ErrorCategory.UI,
                    ErrorSeverity.MEDIUM,
                    { source: 'navigation' }
                  );
                }}
              >
                <RootStack initialRouteName={selectedRoute} />
              </NavigationContainer>
            </ResearchProvider>
          </UserProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 20,
  },
  loadingText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  instructionText: {
    color: '#94a3b8',
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 20,
  },
  errorTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorMessage: {
    color: '#f87171',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  errorButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  testButtonsContainer: {
    alignItems: 'stretch',
    width: '100%',
    maxWidth: 300,
    marginBottom: 30,
  },
  testButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#059669',
    marginTop: 20,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
