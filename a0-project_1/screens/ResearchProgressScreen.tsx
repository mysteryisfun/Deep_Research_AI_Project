import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Dimensions,
  ActivityIndicator,
  Animated,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, MotiText } from 'moti';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { supabase } from '../utils/supabase';
import { toast } from 'sonner-native';
import ResearchProgressMonitor from '../components/ResearchProgressMonitor';
import TopicCard from '../components/TopicCard';

// Define types for route params
type RouteParams = {
  research_id: string;
  query?: string;
  breadth?: number;
  depth?: number;
};

// Define research progress item type
type ResearchProgressItem = {
  progress_id: string;
  research_id: string;
  user_id: string;
  topic: string;
  created_at: string;
  links: Array<{
    url: string;
    title: string;
  }>;
};

const { width } = Dimensions.get('window');
const PROGRESS_COLORS = {
  low: ['#3B82F6', '#2563EB'] as const,
  medium: ['#8B5CF6', '#7C3AED'] as const,
  high: ['#EC4899', '#D946EF'] as const,
  done: ['#10B981', '#059669'] as const
};

const ResearchProgressScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const scrollViewRef = useRef<ScrollView>(null);
  const progressAnimValue = useRef(new Animated.Value(0)).current;
  
  // Get research ID from route params
  const { research_id, query, breadth = 3, depth = 3 } = route.params || {};
  
  // State variables
  const [topics, setTopics] = useState<ResearchProgressItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expectedTopics, setExpectedTopics] = useState(5); // Default fallback
  const [isComplete, setIsComplete] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [progressPercentage, setProgressPercentage] = useState<number>(0);
  const [totalTopics, setTotalTopics] = useState<number>(0);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [resultsAvailable, setResultsAvailable] = useState(false);
  
  // Calculate estimated total topics based on breadth and depth
  useEffect(() => {
    // This is a simple estimation - adjust as needed based on actual data
    const estimate = Math.max(3, Math.round((breadth * depth) / 1.5));
    setExpectedTopics(estimate);
  }, [breadth, depth]);
  
  // Animate progress when it changes
  const progress = calculateProgress();
  useEffect(() => {
    Animated.timing(progressAnimValue, {
      toValue: progress,
      duration: 800,
      useNativeDriver: false,
    }).start();
    
    // Check if research is complete
    if (progress >= 99 || isResearchDone()) {
      setIsComplete(true);
    }
  }, [progress]);
  
  // Set up Supabase subscription
  useEffect(() => {
    if (!research_id) {
      setError('No research ID provided');
      setIsLoading(false);
      return;
    }
    
    // Load initial data
    fetchInitialTopics();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('research-progress-' + research_id)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'research_progress_new',
          filter: `research_id=eq.${research_id}`
        },
        handleProgressUpdate
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to research progress updates for:', research_id);
        }
      });
    
    // Cleanup subscription on unmount
    return () => {
      channel.unsubscribe();
    };
  }, [research_id]);
  
  // Fetch initial topics data
  const fetchInitialTopics = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('research_progress_new')
        .select('*')
        .eq('research_id', research_id)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Transform data to ensure links is an array
      const transformedData = data.map(item => ({
        ...item,
        links: Array.isArray(item.links) ? item.links : []
      }));
      
      setTopics(transformedData);
      
      // Check if research is done from the latest topic
      if (transformedData.length > 0 && transformedData[0].topic.toLowerCase().includes('research_done')) {
        setIsComplete(true);
      }
    } catch (err) {
      console.error('Error fetching topics:', err);
      setError('Failed to load research progress data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle real-time updates
  const handleProgressUpdate = (payload: any) => {
    console.log('Received progress update:', payload);
    
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    if (eventType === 'INSERT') {
      // Add new topic to the top of the list
      setTopics(currentTopics => {
        // Check if this topic already exists
        const exists = currentTopics.some(topic => topic.progress_id === newRecord.progress_id);
        if (exists) return currentTopics;
        
        const newItem = {
          ...newRecord,
          links: Array.isArray(newRecord.links) ? newRecord.links : []
        };
        return [newItem, ...currentTopics];
      });
      
      // Scroll to top when new topic is added
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }, 300);
      
      // Show toast notification
      toast.success('New research topic added');
      
      // Check if this new topic indicates research is done or ready
      if (newRecord.topic.toLowerCase().includes('research_done') || 
          newRecord.topic.toLowerCase().includes('ready')) {
        setIsComplete(true);
        toast.success('Research has completed!');
        // Remove automatic navigation to results screen
        // setTimeout(() => {
        //   navigation.navigate('ResearchResultScreen', { research_id });
        // }, 1500);
      }
    } else if (eventType === 'UPDATE') {
      // Update existing topic with new data
      setTopics(currentTopics => 
        currentTopics.map(topic => {
          if (topic.progress_id === newRecord.progress_id) {
            return {
              ...topic,
              ...newRecord,
              links: Array.isArray(newRecord.links) ? newRecord.links : []
            };
          }
          return topic;
        })
      );
      
      // Show toast for link updates
      if (oldRecord && newRecord.links && 
          (!oldRecord.links || oldRecord.links.length < newRecord.links.length)) {
        toast.success('New source added to research');
      }
    } else if (eventType === 'DELETE') {
      // Remove deleted topic
      setTopics(currentTopics => 
        currentTopics.filter(topic => topic.progress_id !== oldRecord.progress_id)
      );
    }
  };
  
  // Calculate overall progress
  function calculateProgress() {
    if (topics.length === 0) return 0;
    
    // If the research is done, return 100%
    if (isResearchDone()) return 100;
    
    const topicsCompleted = topics.length - 1; // All except the current one
    return Math.min(Math.round((topicsCompleted / expectedTopics) * 100), 99);
  }
  
  // Check if research is done by looking at the latest topic
  function isResearchDone() {
    return topics.length > 0 && topics[0].topic.toLowerCase().includes('research_done');
  }
  
  // Get progress color based on percentage
  const getProgressColor = (percentage: number) => {
    if (isComplete) return PROGRESS_COLORS.done;
    if (percentage < 30) return PROGRESS_COLORS.low;
    if (percentage < 70) return PROGRESS_COLORS.medium;
    return PROGRESS_COLORS.high;
  };
  
  // Render source links for a topic
  const renderSourceLinks = (links: any[]) => {
    if (!links || links.length === 0) {
      return (
        <Text style={styles.noSourcesText}>No sources found yet</Text>
      );
    }
    
    return (
      <View style={styles.sourcesContainer}>
        {links.map((link, index) => (
          <TouchableOpacity 
            key={index}
            style={styles.sourceLink}
            onPress={() => Linking.openURL(link.url)}
          >
            <Feather name="external-link" size={12} color="#6366f1" />
            <Text style={styles.sourceLinkText} numberOfLines={1}>
              {link.title || link.url}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  
  // Check if results are ready
  const isResearchComplete = () => {
    return isComplete || calculateProgress() >= 99;
  };
  
  // Monitor for research results
  useEffect(() => {
    if (!research_id) return;

    console.log(`Setting up real-time monitoring for research results: ${research_id}`);

    // Set up subscription for research results
    const subscription = supabase
      .channel(`progress-results-${research_id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'research_results_new',
        filter: `research_id=eq.${research_id}`
      }, (payload) => {
        console.log('Research result update received:', payload);
        
        // Mark results as available
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          console.log('Setting resultsAvailable to true');
          setResultsAvailable(true);
          
          // Also mark research as complete if not already
          if (!isComplete) {
            setIsComplete(true);
          }
        }
      })
      .subscribe();

    // Check if results already exist
    const checkExistingResults = async () => {
      try {
        const { data, error } = await supabase
          .from('research_results_new')
          .select('result_id')
          .eq('research_id', research_id)
          .limit(1);
        
        if (!error && data && data.length > 0) {
          console.log('Existing results found:', data);
          setResultsAvailable(true);
        }
      } catch (err) {
        console.error('Error checking for existing results:', err);
      }
    };
    
    checkExistingResults();

    return () => {
      console.log('Cleaning up research results subscription');
      supabase.removeChannel(subscription);
    };
  }, [research_id, isComplete]);
  
  // Navigate to results screen
  const viewResults = () => {
    console.log(`Navigating to ResearchResultScreen with research_id: ${research_id}`);
    
    if (!resultsAvailable) {
      console.log('Results not fully available yet, but will navigate and show loading state');
      toast.info('Your research report is still being prepared');
    }
    
    // Pass the research_id both as research_id and researchId to ensure compatibility
    navigation.navigate('ResearchResultScreen', { 
      researchId: research_id,
      research_id: research_id  // Redundant but ensures backward compatibility
    });
  };
  
  const progressWidth = progressAnimValue.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%']
  });

  // Get user ID from first topic or use default
  useEffect(() => {
    if (topics.length > 0 && topics[0].user_id) {
      setUserId(topics[0].user_id);
    } else {
      // Set a default user ID if none is found
      setUserId('system-user');
    }
  }, [topics]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Include the research progress monitor */}
      {research_id && userId && (
        <ResearchProgressMonitor 
          researchId={research_id}
          userId={userId}
          onComplete={() => {
            // Refresh data when research is completed
            fetchInitialTopics();
            setIsComplete(true);
          }}
        />
      )}
      
      {/* Header */}
      <LinearGradient
        colors={['#4F46E5', '#6366F1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          <MaterialIcons name="psychology" size={24} color="#fff" />
          <Text style={styles.headerText}>Research Progress</Text>
        </View>
        
        <View style={styles.placeholder} />
      </LinearGradient>
      
      {/* Progress Summary */}
      <View style={styles.progressSummary}>
        <View style={styles.queryContainer}>
          <Text style={styles.queryLabel}>Research Query:</Text>
          <Text style={styles.queryText}>{query || 'Research in progress'}</Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={styles.progressLabelContainer}>
            <Text style={styles.progressText}>
              Progress: {isComplete ? '100' : Math.min(progress, 99)}%
            </Text>
            <Text style={styles.topicsCountText}>
              {topics.length} of ~{expectedTopics} topics
            </Text>
          </View>
          
          <View style={styles.progressBarOuter}>
            <Animated.View
              style={[
                styles.progressBarInner,
                { 
                  width: progressWidth,
                  backgroundColor: isComplete ? '#10B981' : undefined
                }
              ]}
            >
              {!isComplete && (
                <LinearGradient
                  colors={getProgressColor(progress)}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.progressGradient}
                />
              )}
            </Animated.View>
          </View>
          
          {isComplete && (
            <MotiView 
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 500 } as any}
              style={styles.completeBadge}
            >
              <MaterialIcons name="check-circle" size={12} color="#fff" />
              <Text style={styles.completeText}>Research Complete</Text>
            </MotiView>
          )}
        </View>
      </View>
      
      {/* Topics List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading research progress...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchInitialTopics}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : topics.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="hourglass-empty" size={48} color="#6366F1" />
          <Text style={styles.emptyText}>
            Waiting for research to begin...
          </Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.topicsContainer}
          showsVerticalScrollIndicator={false}
        >
          {topics.map((topic, index) => (
            <TopicCard
              key={topic.progress_id}
              topic={topic.topic}
              links={topic.links}
              index={index}
              totalCount={topics.length}
              isActive={index === 0 && !isComplete}
              createdAt={topic.created_at}
              isLastItem={index === topics.length - 1}
            />
          ))}
          
          {/* Estimated remaining topics */}
          {!isComplete && topics.length < expectedTopics && (
            <View style={styles.estimatedContainer}>
              <Text style={styles.estimatedText}>
                ~{expectedTopics - topics.length} more topics expected...
              </Text>
            </View>
          )}
        </ScrollView>
      )}
      
      {/* Bottom Actions */}
      <View style={styles.actionsContainer}>
        {isResearchComplete() ? (
          <TouchableOpacity 
            style={styles.resultsButton}
            onPress={viewResults}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.resultsButtonGradient}
            >
              {!resultsAvailable ? (
                <>
                  <ActivityIndicator size="small" color="#fff" style={styles.loadingIcon} />
                  <Text style={styles.resultsButtonText}>Results Processing...</Text>
                </>
              ) : (
                <>
                  <MaterialIcons name="assignment-turned-in" size={20} color="#fff" />
                  <Text style={styles.resultsButtonText}>View Results</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.backToAppButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backToAppText}>Continue in Background</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  placeholder: {
    width: 40,
  },
  progressSummary: {
    padding: 16,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  queryContainer: {
    marginBottom: 16,
  },
  queryLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  queryText: {
    fontSize: 16,
    color: '#e2e8f0',
    fontWeight: '500',
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 14,
    color: '#e2e8f0',
  },
  progressBarOuter: {
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressGradient: {
    height: '100%',
    width: '100%',
  },
  topicsCount: {
    marginTop: 6,
    alignItems: 'flex-end',
  },
  topicsCountText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  scrollView: {
    flex: 1,
  },
  topicsContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  topicCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#6366F1',
  },
  activeTopicCard: {
    borderLeftColor: '#8B5CF6',
    backgroundColor: '#1e293b',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  doneTopicCard: {
    borderLeftColor: '#10B981',
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  topicNumberContainer: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  topicNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366F1',
    textAlign: 'center',
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    flex: 1,
  },
  doneTopicTitle: {
    color: '#10B981',
  },
  statusBadgeActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  statusTextActive: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
    marginLeft: 4,
  },
  statusBadgeComplete: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  statusTextComplete: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
    marginLeft: 4,
  },
  statusBadgeDone: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  statusTextDone: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 4,
  },
  sourcesSection: {
    marginTop: 8,
    marginBottom: 12,
  },
  sourcesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourcesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94a3b8',
    marginLeft: 4,
  },
  sourcesContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 8,
    padding: 12,
  },
  sourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.5)',
  },
  sourceLinkText: {
    fontSize: 13,
    color: '#e2e8f0',
    marginLeft: 8,
    flex: 1,
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(99, 102, 241, 0.5)',
  },
  noSourcesText: {
    fontSize: 13,
    color: '#94a3b8',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 8,
  },
  topicTime: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#e2e8f0',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#e2e8f0',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#e2e8f0',
    textAlign: 'center',
  },
  estimatedContainer: {
    padding: 16,
    alignItems: 'center',
  },
  estimatedText: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  resultsButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  resultsButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  resultsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  backToAppButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#334155',
    borderRadius: 8,
  },
  backToAppText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  completeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 4,
  },
  loadingIcon: {
    marginRight: 8,
  },
});

export default ResearchProgressScreen; 