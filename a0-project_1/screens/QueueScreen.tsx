import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ImageBackground,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { MotiView } from 'moti';
import { toast } from 'sonner-native';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../utils/supabase';

// Define TypeScript interfaces for our data
interface ResearchItem {
  research_id: string;
  user_id: string;
  agent: string;
  query: string;
  breadth: number;
  depth: number;
  include_technical_terms: boolean;
  output_format: string;
  status: string;
  created_at: string;
  completed_at?: string | null;
}

// Research card item props
interface ResearchCardProps {
  item: ResearchItem;
  index: number;
  onViewDetails: (researchId: string) => void;
}

// Function to get gradient colors based on agent type
const getAgentGradient = (agent: string): string[] => {
  if (agent.toLowerCase().includes('health') || agent.toLowerCase().includes('bio')) {
    return ['#FF416C', '#FF4B2B'];
  } else if (agent.toLowerCase().includes('business')) {
    return ['#0072FF', '#00C6FF'];
  } else if (agent.toLowerCase().includes('financial') || agent.toLowerCase().includes('finance')) {
    return ['#11998e', '#38ef7d'];
  } else {
    return ['#4A00E0', '#8E2DE2'];
  }
};

// Format relative time (e.g., "2 hours ago")
const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 0) {
    return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  } else if (diffHour > 0) {
    return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  } else if (diffMin > 0) {
    return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
};

// Research Card Component
const ResearchCard = ({ item, index, onViewDetails }: ResearchCardProps) => {
  const gradientColors = getAgentGradient(item.agent);
  const createdTime = getRelativeTime(item.created_at);
  
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      exit={{ opacity: 0, translateY: -20 }}
      delay={index * 100}
      style={styles.researchCard}
    >
      <LinearGradient
        colors={['rgba(30, 41, 59, 0.8)', 'rgba(30, 41, 59, 0.6)']}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <Text numberOfLines={2} style={styles.queryText}>{item.query}</Text>
          <View style={styles.statusBadge}>
            <ActivityIndicator size="small" color="#fff" style={styles.statusIndicator} />
            <Text style={styles.statusText}>Researching</Text>
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <View style={styles.agentContainer}>
            <LinearGradient
              colors={[gradientColors[0], gradientColors[1]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.agentBadge}
            >
              <Text style={styles.agentText}>{item.agent}</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.cardInfo}>
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Started: </Text>
              {createdTime}
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Breadth: </Text>
              {item.breadth}
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Depth: </Text>
              {item.depth}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.viewButton}
          onPress={() => onViewDetails(item.research_id)}
        >
          <Text style={styles.viewButtonText}>View Progress</Text>
          <MaterialIcons name="arrow-forward" size={16} color="#6c63ff" />
        </TouchableOpacity>
      </LinearGradient>
    </MotiView>
  );
};

export default function QueueScreen() {
  const navigation = useNavigation();
  const [researchItems, setResearchItems] = useState<ResearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInsertingTestData, setIsInsertingTestData] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [isBackgroundFetching, setIsBackgroundFetching] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [fetchError, setFetchError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { theme } = useTheme();
  
  // Get current user ID from Supabase auth
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('Authenticated user found:', user.id);
          setUserId(user.id);
        } else {
          const testId = 'user-test-123';
          console.warn('No authenticated user found, using test ID:', testId);
          setUserId(testId);
        }
      } catch (error) {
        console.error('Error getting current user:', error);
        setUserId('user-test-123');
      }
    };
    
    getCurrentUser();
  }, []);
  
  // Initial data load
  useEffect(() => {
    fetchResearchItems(true);
  }, []);
  
  // Set up polling interval of 5 seconds
  useEffect(() => {
    console.log('Setting up polling interval for research data');
    
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    pollingIntervalRef.current = setInterval(() => {
      fetchResearchItems(false);
    }, 5000);
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);
  
  // Fetch research items with complete debug logging
  const fetchResearchItems = async (showLoading: boolean = false) => {
    // Set appropriate loading state
    if (showLoading) {
      setIsLoading(true);
      setFetchError(null);
    } else {
      setIsBackgroundFetching(true);
    }
    
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[Queue: ${timestamp}] Fetching research items...`);
    
    try {
      // IMPORTANT: Explicit query matching the test screen - using in() with array of statuses
      const { data, error } = await supabase
        .from('research_history_new')
        .select('*')
        .in('status', ['pending', 'researching', 'in_progress'])
        .order('created_at', { ascending: false });
      
      // Handle supabase error
      if (error) {
        const errorMsg = `Error fetching research items: ${error.message}`;
        console.error(`[Queue: ${timestamp}] ${errorMsg}`);
        setFetchError(errorMsg);
        
        if (showLoading) {
          toast.error('Failed to load research queue');
        }
        return;
      }
      
      // Log the raw response to debug
      console.log(`[Queue: ${timestamp}] Raw response:`, data ? 'Data received' : 'No data');
      console.log(`[Queue: ${timestamp}] Records count:`, data?.length || 0);
      
      if (data && data.length > 0) {
        console.log(`[Queue: ${timestamp}] First record status:`, data[0].status);
        console.log(`[Queue: ${timestamp}] First record:`, data[0]);
      }
      
      // Update state with the fetched data
      setResearchItems(data || []);
      setLastUpdate(new Date());
      setFetchError(null);
      
    } catch (error) {
      // Handle unexpected errors
      const errorMsg = `Unexpected error: ${error}`;
      console.error(`[Queue: ${timestamp}] ${errorMsg}`);
      setFetchError(errorMsg);
      
      if (showLoading) {
        toast.error('Failed to load research queue');
      }
    } finally {
      // Reset loading states
      if (showLoading) {
        setIsLoading(false);
      } else {
        setIsBackgroundFetching(false);
      }
    }
  };
  
  // Function to view research details
  const handleViewDetails = (researchId: string) => {
    console.log(`Navigating to details for research: ${researchId}`);
    // @ts-ignore - Ignore the navigation type error
    navigation.navigate('ResearchProgressScreen', { research_id: researchId });
  };
  
  // Function to add test data to Supabase for testing
  const addTestData = async () => {
    try {
      setIsInsertingTestData(true);
      
      // Generate a unique research ID
      const researchId = `test-research-${Date.now()}`;
      const currentTime = new Date().toISOString();
      const testUserId = userId || 'test-user-123'; // Fallback user ID
      
      // Insert a new research history entry
      const { error: historyError } = await supabase
        .from('research_history_new')
        .insert({
          research_id: researchId,
          user_id: testUserId,
          agent: 'TestAgent',
          query: 'Test Research Query for Queue Testing',
          breadth: 3,
          depth: 3,
          include_technical_terms: true,
          output_format: 'markdown',
          status: 'in_progress',
          created_at: currentTime
        });
      
      if (historyError) {
        throw new Error(`Error inserting test research history: ${historyError.message}`);
      }
      
      toast.success('Test data added successfully');
      
      // Force an immediate fetch to show the new data
      fetchResearchItems();
      
      // After 10 seconds, update the status to completed to test removal
      setTimeout(async () => {
        try {
          const { error: updateError } = await supabase
            .from('research_history_new')
            .update({ 
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('research_id', researchId);
          
          if (updateError) {
            console.error('Error updating test data status:', updateError);
          } else {
            // Force another fetch to show the removal
            fetchResearchItems();
          }
        } catch (err) {
          console.error('Error updating test data:', err);
        }
      }, 10000);
      
    } catch (error) {
      console.error('Error adding test data:', error);
      toast.error('Failed to add test data');
    } finally {
      setIsInsertingTestData(false);
    }
  };

  // Test navigation to test screen
  const navigateToTestScreen = () => {
    // @ts-ignore - Ignore the navigation type error
    navigation.navigate('TestResearchQueue');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#131c38', '#1a1f38']}
        style={StyleSheet.absoluteFillObject}
      />
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Research Queue
        </Text>
        
        {/* Test Button Options */}
        <View style={styles.headerButtonsContainer}>
          <TouchableOpacity 
            style={styles.testDataButton}
            onPress={addTestData}
            disabled={isInsertingTestData}
          >
            {isInsertingTestData ? (
              <ActivityIndicator size="small" color="#6c63ff" />
            ) : (
              <Text style={styles.testDataButtonText}>Add Test</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.testDataButton}
            onPress={navigateToTestScreen}
          >
            <Text style={styles.testDataButtonText}>Test Screen</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <ImageBackground 
        source={{ uri: 'https://api.a0.dev/assets/image?text=scientific%20laboratory%20with%20computers%20processing%20data&aspect=16:9&seed=789' }}
        style={styles.bannerImage}
        imageStyle={styles.bannerImageStyle}
      >
        <LinearGradient
          colors={['rgba(58, 28, 113, 0.7)', 'rgba(58, 28, 113, 0.85)']}
          style={styles.bannerGradient}
        >
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500 }}
          >
            <Text style={styles.screenTitle}>Active Research</Text>
            <Text style={styles.screenSubtitle}>
              Monitor your ongoing research tasks
            </Text>
            
            {isLoading && (
              <View style={styles.updatingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.updatingText}>Updating...</Text>
              </View>
            )}
          </MotiView>
        </LinearGradient>
      </ImageBackground>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6c63ff" />
          <Text style={styles.loadingText}>Loading your research...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Show error if present */}
          {fetchError && (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={24} color="#f87171" />
              <Text style={styles.errorText}>Error: {fetchError}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => fetchResearchItems(true)}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        
          {/* Show empty state if no items */}
          {researchItems.length === 0 && !fetchError ? (
            <View style={styles.emptyStateContainer}>
              <MaterialCommunityIcons name="flask-empty-outline" size={60} color="#ccc" />
              <Text style={styles.emptyStateText}>No active research</Text>
              <Text style={styles.emptyStateSubtext}>Start a new research to begin</Text>
            </View>
          ) : (
            <View style={styles.researchList}>
              {researchItems.map((item, index) => (
                <ResearchCard
                  key={item.research_id}
                  item={item}
                  index={index}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </View>
          )}
          
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 500, delay: 300 }}
          >
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => {
                // @ts-ignore - Ignore the navigation type error
                navigation.navigate('ChooseAgentScreen');
              }}
            >
              <LinearGradient
                colors={['#4A00E0', '#8E2DE2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addButtonGradient}
              >
                <MaterialIcons name="add" size={24} color="#fff" />
                <Text style={styles.addButtonText}>Start New Research</Text>
              </LinearGradient>
            </TouchableOpacity>
          </MotiView>
          
          <View style={styles.lastUpdateContainer}>
            <Text style={styles.lastUpdateText}>
              Last updated: {lastUpdate.toLocaleTimeString()}
            </Text>
            {isBackgroundFetching && (
              <Text style={styles.updatingIndicatorText}>Updating...</Text>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
  },
  testDataButton: {
    backgroundColor: 'rgba(108, 99, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.4)',
  },
  testDataButtonText: {
    color: '#6c63ff',
    fontSize: 12,
    fontWeight: '600',
  },
  bannerImage: {
    height: 120,
    width: '100%',
  },
  bannerImageStyle: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  bannerGradient: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(108, 99, 255, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  screenSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  updatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 99, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    marginTop: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.3)',
  },
  updatingText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 6,
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
  content: {
    flex: 1,
    padding: 20,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 16,
    padding: 40,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.2)',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
  },
  researchList: {
    marginBottom: 20,
  },
  researchCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  cardGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.3)',
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  queryText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 99, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.3)',
  },
  statusIndicator: {
    marginRight: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  cardContent: {
    marginBottom: 16,
  },
  agentContainer: {
    marginBottom: 12,
  },
  agentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  agentText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  infoLabel: {
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.2)',
  },
  viewButtonText: {
    color: '#6c63ff',
    fontWeight: '600',
    fontSize: 14,
  },
  addButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 16,
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  lastUpdateContainer: {
    alignItems: 'center',
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  lastUpdateText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  updatingIndicatorText: {
    fontSize: 12,
    color: 'rgba(108, 99, 255, 0.8)',
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: 'rgba(254, 226, 226, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
  },
  errorText: {
    color: '#f87171',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(248, 113, 113, 0.2)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.4)',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});