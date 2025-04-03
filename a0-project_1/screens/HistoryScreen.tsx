import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../utils/supabase';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useResearch } from '../context/ResearchContext';
import { fetchResearchHistoryWithCache, clearResearchCache } from '../utils/researchService';
import { useUser } from '../context/UserContext';
import { useFocusEffect } from '@react-navigation/native';

// Define navigation prop type
type NavigationProp = any;

// Format date string to a more readable format
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

// Helper to get a color based on research status
const getStatusColor = (status: string, theme: any) => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'green'; // Using direct color values instead of theme.colors
    case 'pending':
      return 'orange';
    case 'failed':
      return 'red';
    default:
      return theme.secondaryText; // Updated to use correct theme structure
  }
};

export default function HistoryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(true);
  const [backgroundRefreshing, setBackgroundRefreshing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const { setCurrentResearch } = useResearch();
  const { theme } = useTheme();
  const { userId } = useUser();

  // Fetch research history with caching
  useEffect(() => {
    console.log('HistoryScreen mounted');
    fetchHistory();
  }, []);
  
  // Refresh history data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('HistoryScreen focused - checking for background refresh');
      
      if (userId) {
        // Background refresh without loading indicator
        backgroundRefresh();
      }
      
      return () => {
        // Optional cleanup if needed
      };
    }, [userId])
  );

  const fetchHistory = async () => {
    try {
      console.log('Fetching history...');
      setLoading(true);

      if (!userId) {
        console.error('No user ID found');
        Alert.alert('Error', 'Not logged in');
        navigation.replace('Login');
        return;
      }

      console.log('Fetching cached history for user:', userId);
      
      // Use our cached fetch method
      const data = await fetchResearchHistoryWithCache(userId);
      
      if (!data) {
        console.log('No data returned from query');
        setHistory([]);
        return;
      }

      console.log('History items:', data.length);
      setHistory(data);
    } catch (error: any) {
      console.error('Error fetching history:', error.message);
      Alert.alert('Error', 'Failed to load research history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Perform background refresh without showing full loading indicator
  const backgroundRefresh = async () => {
    if (backgroundRefreshing) return;
    
    try {
      setBackgroundRefreshing(true);
      if (userId) {
        // Fetch fresh data with background refresh option
        const data = await fetchResearchHistoryWithCache(userId, { 
          forceRefresh: true,
          background: true 
        });
        
        if (data) {
          setHistory(data);
          console.log('History refreshed in background successfully');
        }
      }
    } catch (error) {
      console.error('Error in background refresh:', error);
    } finally {
      setBackgroundRefreshing(false);
    }
  };

  // Force refresh data - bypasses cache
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      if (userId) {
        // Clear the cache for this user
        await clearResearchCache(userId);
        
        // Fetch fresh data with forceRefresh option
        const data = await fetchResearchHistoryWithCache(userId, { 
          forceRefresh: true,
          background: false
        });
        
        if (data) {
          setHistory(data);
          console.log('History refreshed successfully');
        }
      }
    } catch (error) {
      console.error('Error refreshing history:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const viewResearchDetails = (item: any) => {
    console.log('Viewing research details:', item.research_id);
    
    // Save to context for global access if needed
    setCurrentResearch({
      researchId: item.research_id,
      query: item.query,
      agent: item.agent,
      breadth: item.breadth || 3, // Default to 3 if not provided
      depth: item.depth || 3,     // Default to 3 if not provided
      status: item.status
    });
    
    // Prepare common navigation params
    const commonParams = {
      research_id: item.research_id,
      researchId: item.research_id, // Include both formats for compatibility
      query: item.query,
      breadth: item.breadth || 3,
      depth: item.depth || 3,
      agent: item.agent
    };
    
    // Navigate to appropriate screen based on status
    if (item.status?.toLowerCase() === 'completed') {
      navigation.navigate('ResearchResultScreen', commonParams);
    } else {
      navigation.navigate('ResearchProgressScreen', commonParams);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Research History</Text>
        {backgroundRefreshing && (
          <View style={styles.backgroundRefreshIndicator}>
            <ActivityIndicator size="small" color={theme.accent} />
          </View>
        )}
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.secondaryText }]}>
            Loading history...
          </Text>
        </View>
      ) : history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="history" size={50} color={theme.secondaryText} />
          <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
            No research history found
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.secondaryText }]}>
            Start a new research to see it here
          </Text>
          <TouchableOpacity
            style={[styles.newResearchButton, { backgroundColor: theme.accent }]}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.newResearchButtonText}>Start New Research</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.research_id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.accent]}
              tintColor={theme.accent}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: theme.card }]}
              onPress={() => viewResearchDetails(item)}
            >
              <View style={styles.cardHeader}>
                <Text 
                  style={[styles.query, { color: theme.text }]} 
                  numberOfLines={2}
                >
                  {item.query}
                </Text>
                <Text 
                  style={[
                    styles.status, 
                    { color: getStatusColor(item.status, theme) }
                  ]}
                >
                  {item.status || 'Unknown'}
                </Text>
              </View>

              <View style={styles.cardDetails}>
                <View style={styles.detailItem}>
                  <MaterialIcons name="category" size={16} color={theme.secondaryText} />
                  <Text style={[styles.detailText, { color: theme.secondaryText }]}>
                    {item.agent || 'General Agent'}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <MaterialIcons name="access-time" size={16} color={theme.secondaryText} />
                  <Text style={[styles.detailText, { color: theme.secondaryText }]}>
                    {formatDate(item.created_at)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  backgroundRefreshIndicator: {
    paddingRight: 10,
  },
  list: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  query: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    paddingRight: 8,
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
  },
  cardDetails: {
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  newResearchButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  newResearchButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
});