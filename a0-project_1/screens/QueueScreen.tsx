import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ImageBackground,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { MotiView } from 'moti';
import { toast } from 'sonner-native';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { supabase } from '../utils/supabase';
import { 
  fetchActiveQueueWithCache, 
  updateActiveQueueCache, 
  clearActiveQueueCache,
  fetchResearchResultsWithCache,
  updateResearchResultsCache,
  clearResearchResultsCache
} from '../utils/researchService';

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
  has_results?: boolean;
}

interface ResearchResult {
  result_id: string;
  research_id: string;
  user_id: string;
  result: string;
  created_at: string;
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
      transition={{ type: 'spring', damping: 18, stiffness: 120 } as any}
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
  const navigation = useNavigation<any>();
  const [researchItems, setResearchItems] = useState<ResearchItem[]>([]);
  const [researchResults, setResearchResults] = useState<{[key: string]: boolean}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const supabaseSubscriptionRef = useRef<any>(null);
  const { theme, isDarkMode } = useTheme();
  const { userId } = useUser();
  
  // Set up Supabase real-time subscription
  useEffect(() => {
    if (!userId) {
      console.log('No user ID available yet, skipping subscription setup');
      return;
    }
    
    console.log('Setting up real-time subscription for research data');
    
    // Subscribe to research_history_new changes - add filter for current user
    const historyChannel = supabase
      .channel('realtime:research_history')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'research_history_new',
          filter: `user_id=eq.${userId}` // Add filter for current user
        },
        (payload: any) => {
          console.log('Research history change received:', payload);
          
          // Update cached data
          if (payload.new) {
            updateActiveQueueCache(userId, payload.new)
              .then(success => {
                if (success) {
                  console.log('Successfully updated cache with real-time data');
                }
              })
              .catch(error => {
                console.error('Error updating cache with real-time data:', error);
              });
          }
          
          setResearchItems(prevItems => {
            if (payload.eventType === 'INSERT') {
              // Ensure payload.new has the right shape before adding it
              if (payload.new && typeof payload.new.research_id === 'string') {
                if (payload.new.status === 'completed') return prevItems;
                return [payload.new as ResearchItem, ...prevItems];
              }
              return prevItems;
            }
            if (payload.eventType === 'UPDATE') {
              if (payload.new && typeof payload.new.research_id === 'string') {
                if (payload.new.status === 'completed') {
                  return prevItems.filter(item => item.research_id !== payload.new.research_id);
                }
                return prevItems.map(item => 
                  item.research_id === payload.new.research_id ? (payload.new as ResearchItem) : item
                );
              }
              return prevItems;
            }
            if (payload.eventType === 'DELETE') {
              if (payload.old && typeof payload.old.research_id === 'string') {
                return prevItems.filter(item => item.research_id !== payload.old.research_id);
              }
              return prevItems;
            }
            return prevItems;
          });
          
          setLastUpdate(new Date());
        }
      )
      .subscribe();
      
    // Subscribe to research_results_new changes  
    const resultsChannel = supabase
      .channel('realtime:research_results')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'research_results_new',
          filter: `user_id=eq.${userId}` // Add filter for current user
        },
        (payload) => {
          console.log('Research result change received:', payload);
          
          if (payload.eventType === 'INSERT' && payload.new && payload.new.research_id) {
            // Update cached results
            updateResearchResultsCache(userId, payload.new.research_id)
              .then(success => {
                if (success) {
                  console.log('Successfully updated results cache with real-time data');
                }
              })
              .catch(error => {
                console.error('Error updating results cache with real-time data:', error);
              });
            
            setResearchResults(prev => ({
              ...prev,
              [payload.new.research_id]: true
            }));
          }
        }
      )
      .subscribe();
    
    // Store subscription refs for cleanup
    supabaseSubscriptionRef.current = [historyChannel, resultsChannel];
    
    // Clear any existing polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    return () => {
      // Clean up subscriptions on unmount
      if (supabaseSubscriptionRef.current) {
        supabaseSubscriptionRef.current.forEach((subscription: any) => {
          if (subscription && subscription.unsubscribe) {
            subscription.unsubscribe();
          }
        });
      }
      
      // Clear polling interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [userId]);
  
  // Load research items on mount and when userId changes
  useEffect(() => {
    if (userId) {
      loadResearchItems();
    }
  }, [userId]);
  
  // Refresh data when focus changes
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('QueueScreen focused, refreshing data in background');
      if (userId) {
        // Use background refresh to avoid loading indicators
        loadResearchItems({ forceRefresh: false, background: true });
      }
    });
    
    return unsubscribe;
  }, [navigation, userId]);
  
  const fetchResearchResults = async () => {
    if (!userId) return;
    
    try {
      setIsFetching(true);
      
      // Use the cached approach
      const resultsMap = await fetchResearchResultsWithCache(userId);
      setResearchResults(resultsMap || {});
    } catch (error) {
      console.error('Unexpected error fetching research results:', error);
    } finally {
      setIsFetching(false);
    }
  };
  
  const loadResearchItems = async (options = { forceRefresh: false, background: false }) => {
    if (!userId) return;
    
    try {
      if (!options.background) {
        setIsLoading(true);
      }
      
      // Use caching to get items
      const items = await fetchActiveQueueWithCache(userId, options);
      setResearchItems(items || []);
      
      // Fetch results separately
      await fetchResearchResults();
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading research items:', error);
      toast.error('Failed to load research items');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    // Clear cache and force refresh on pull-to-refresh
    Promise.all([
      clearActiveQueueCache(userId || undefined),
      clearResearchResultsCache(userId || undefined)
    ])
      .then(() => loadResearchItems({ forceRefresh: true, background: false }))
      .catch(error => {
        console.error('Error during refresh:', error);
        setRefreshing(false);
      });
  };
  
  const handleViewDetails = (researchId: string) => {
    navigation.navigate('ResearchProgressScreen', { research_id: researchId });
  };
  
  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons 
        name="clipboard-list-outline" 
        size={80} 
        color={isDarkMode ? '#6c63ff' : '#3f51b5'}
      />
      <Text style={styles.emptyTitle}>No Active Research</Text>
      <Text style={styles.emptyText}>
        Research tasks you start will appear here while they're in progress.
      </Text>
      
      <TouchableOpacity 
        style={styles.startResearchButton}
        onPress={() => navigation.navigate('NewResearchScreen')}
      >
        <LinearGradient
          colors={['#6c63ff', '#3f51b5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.startButtonGradient}
        >
          <Text style={styles.startButtonText}>Start New Research</Text>
          <MaterialIcons name="arrow-forward" size={18} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Research Queue</Text>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#6c63ff']}
            tintColor={isDarkMode ? '#6c63ff' : '#3f51b5'}
          />
        }
      >
        {isLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6c63ff" />
            <Text style={styles.loadingText}>Loading research items...</Text>
          </View>
        ) : researchItems.length > 0 ? (
          researchItems.map((item, index) => (
            <ResearchCard 
              key={item.research_id} 
              item={item} 
              index={index}
              onViewDetails={handleViewDetails}
            />
          ))
        ) : (
          renderEmptyState()
        )}
      </ScrollView>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
  },
  startResearchButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 16,
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  startButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginRight: 8,
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
});