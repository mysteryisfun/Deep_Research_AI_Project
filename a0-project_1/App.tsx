import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, StatusBar as RNStatusBar, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Toaster } from 'sonner-native';
import React from 'react';
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
import TestResearchQueueScreen from "./screens/TestResearchQueueScreen";
import AppErrorBoundary from './components/AppErrorBoundary';
import { ThemeProvider, useTheme, lightTheme } from './context/ThemeContext';
import { ResearchProvider } from './context/ResearchContext';
import { safelyAccessProperty } from './error-guard';
import 'react-native-gesture-handler';
import ResearchProgressScreen from "./screens/ResearchProgressScreen";
import TestProgressScreen from "./screens/TestProgressScreen";
import { useNavigation } from '@react-navigation/native';
import SignupScreen from "./screens/SignupScreen";
<<<<<<< Updated upstream
=======
import DevControlScreen from "./screens/DevControlScreen";
import DevPasswordScreen from "./screens/DevPasswordScreen";
import { UserProvider } from './context/UserContext';
import { recordSessionStart } from './utils/userStorage';
import { clearExpiredCache } from './utils/cacheManager';
import { supabase } from './utils/supabase';
import { ActivityIndicator, View } from 'react-native';
<<<<<<< Updated upstream
import { AuthProvider } from './context/AuthContext';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
=======
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync, setupNotificationHandler } from './utils/notificationService';
import { linking } from './navigation/linking';
import ResetPasswordScreen from "./screens/ResetPasswordScreen";
import HelpCenterScreen from "./screens/HelpCenterScreen";
import PrivacyPolicyScreen from "./screens/PrivacyPolicyScreen";
import TermsOfServiceScreen from "./screens/TermsOfServiceScreen";
>>>>>>> Stashed changes

// Configure global error handling for unhandled JS errors
if (!__DEV__) {
  // Only in production to avoid interfering with dev tools
  const globalErrorHandler = (error: Error, isFatal?: boolean) => {
    handleGlobalError(error, 'Unhandled JS Exception');
  };
  
  // Set up global error handler
  ErrorUtils.setGlobalHandler(globalErrorHandler);
}
>>>>>>> Stashed changes

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
      <Stack.Screen name="SignupScreen" component={SignupScreen} />
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
      
      {/* Test screens are still accessible but not in main flow */}
      <Stack.Screen name="TestN8nWebhook" component={TestN8nWebhook} />
      <Stack.Screen name="TestProgressScreen" component={TestProgressScreen} />
      <Stack.Screen name="SimpleTest" component={SimpleTestScreen} />
<<<<<<< Updated upstream
      <Stack.Screen name="TestResearchQueue" component={TestResearchQueueScreen} />
=======
      <Stack.Screen name="TestResearchResultScreen" component={TestResearchResultScreen} />
      <Stack.Screen name="TestActiveQueueScreen" component={TestActiveQueueScreen} />
      <Stack.Screen name="SimpleQueueTest" component={SimpleQueueTestScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
      <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
>>>>>>> Stashed changes
    </Stack.Navigator>
  );
}

<<<<<<< Updated upstream
// Create a simple initialization screen to debug any startup issues
function InitializationScreen({ onSelectTestScreen }: { onSelectTestScreen: (screen: string) => void }) {
  return (
    <SafeAreaProvider>
=======
export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRouteName, setInitialRouteName] = useState('Login');

  // Check for existing session on app start
  useEffect(() => {
    const checkAuthSession = async () => {
      try {
        console.log('[App] Checking for existing session...');
        
        // Get current session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[App] Error checking session:', error);
          setInitialRouteName('Login');
        } else {
          // Always set to Login screen regardless of session state
          console.log('[App] Setting initial route to Login');
          setInitialRouteName('Login');
        }
      } catch (error) {
        console.error('[App] Unexpected error checking auth session:', error);
        setInitialRouteName('Login');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthSession();
  }, []);

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

  // Show loading screen while checking auth state
  if (isLoading) {
    return (
>>>>>>> Stashed changes
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Initializing App...</Text>
        
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
            onPress={() => onSelectTestScreen('TestResearchQueue')}
          >
            <Text style={styles.testButtonText}>Research Queue Test</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

export default function App() {
  // Simple state to track initialization
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [initialRoute, setInitialRoute] = React.useState('Login');
  
  React.useEffect(() => {
    // Simple timeout to ensure components have time to mount
    // This helps debug initialization issues
    console.log("App initializing...");
    
    setTimeout(() => {
      console.log("App initialized!");
      setIsInitialized(true);
    }, 500);
  }, []);

  // Show initialization screen first to catch early errors
  if (!isInitialized) {
    return <InitializationScreen onSelectTestScreen={(screen) => {
      setInitialRoute(screen);
      setIsInitialized(true);
    }} />;
  }

  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
<<<<<<< Updated upstream
<<<<<<< Updated upstream
          <ResearchProvider>
            <Toaster />
            <NavigationContainer>
              <RootStack initialRouteName={initialRoute} />
            </NavigationContainer>
          </ResearchProvider>
=======
          <AuthProvider>
            <UserProvider>
              <ResearchProvider>
                <Toaster />
                <NavigationContainer
                  onStateChange={(state) => {
                    // Handle navigation state changes if needed
                  }}
                >
                  <RootStack initialRouteName={initialRouteName} />
                </NavigationContainer>
              </ResearchProvider>
            </UserProvider>
          </AuthProvider>
>>>>>>> Stashed changes
=======
          <UserProvider>
            <ResearchProvider>
              <Toaster />
              <NavigationContainer
                ref={navigationRef}
                onStateChange={(state) => {
                  // Handle navigation state changes if needed
                }}
                linking={linking}
              >
                <RootStack initialRouteName={initialRouteName} />
              </NavigationContainer>
            </ResearchProvider>
          </UserProvider>
>>>>>>> Stashed changes
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
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
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
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  testButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
