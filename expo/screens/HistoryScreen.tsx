import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { 
  MaterialIcons, 
  Ionicons
} from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MotiView } from 'moti';
import { toast } from 'sonner-native';
import { useResearch } from '../context/ResearchContext';
import { supabase } from '../context/supabase';
import { useTheme } from '../context/ThemeContext';

type RootStackParamList = {
  LoginScreen: undefined;
  HistoryScreen: undefined;
  ResearchResultScreen: { researchId: string };
  SeedDataScreen: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// History Item component
const HistoryItem: React.FC<{ item: any; onViewReport: (item: any) => void }> = ({ item, onViewReport }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return ['#4CAF50', '#45a049'] as const;
      case 'in_progress':
        return ['#2196F3', '#1976D2'] as const;
      case 'pending':
        return ['#FFC107', '#FFA000'] as const;
      default:
        return ['#6c63ff', '#3a1c71'] as const;
    }
  };

  const statusColors = getStatusColor(item.status);

  return (
    <TouchableOpacity 
      style={styles.historyItem}
      onPress={() => onViewReport(item)}
    >
      <View style={styles.historyHeader}>
        <View style={styles.historyIconContainer}>
          <MaterialIcons name="history" size={24} color={statusColors[0]} />
        </View>
        <View style={styles.historyHeaderRight}>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[0] }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
          <Text style={styles.dateText}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.historyContent}>
        <Text style={styles.queryText} numberOfLines={2}>{item.query}</Text>
        <View style={styles.detailsContainer}>
          <Text style={styles.detailText}>Agent: {item.agent}</Text>
          <Text style={styles.detailText}>Format: {item.output_format}</Text>
        </View>
      </View>

      <View style={[styles.viewReportButton, { backgroundColor: statusColors[0] }]}>
        <Text style={styles.viewReportText}>View Report</Text>
        <MaterialIcons name="arrow-forward-ios" size={16} color="#fff" />
      </View>
    </TouchableOpacity>
  );
};

export default function HistoryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const { setCurrentResearch } = useResearch();
  const { theme } = useTheme();

  // Fetch research history
  useEffect(() => {
    console.log('HistoryScreen mounted');
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      console.log('Fetching history...');
      setLoading(true);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error('Error getting user:', userError);
        Alert.alert('Error', 'Failed to get user information');
        navigation.replace('LoginScreen');
        return;
      }

      if (!user) {
        console.log('No user found, redirecting to login');
        navigation.replace('LoginScreen');
        return;
      }

      console.log('Fetching history for user:', user.id);

      // Fetch research history for the current user
      const { data, error } = await supabase
        .from('research_history_new')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      console.log('Fetch response:', { data, error });
      
      if (error) throw error;
      
      if (!data) {
        console.log('No data returned from query');
        setHistory([]);
        return;
      }

      console.log('History items:', data.length);
      data.forEach((item, index) => {
        console.log(`Item ${index + 1}:`, {
          research_id: item.research_id,
          query: item.query,
          status: item.status
        });
      });

      setHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
      if (Platform.OS === 'web') {
        console.error('Full error object:', JSON.stringify(error, null, 2));
      }
      Alert.alert('Error', 'Failed to load research history. Please check the console for details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleViewReport = async (item: any) => {
    try {
      console.log('Viewing report for research:', item.research_id);
      
      // Set current research in context
      setCurrentResearch(item);
      
      // Navigate to result screen
      navigation.navigate('ResearchResultScreen', { 
        researchId: item.research_id 
      });
    } catch (error) {
      console.error('Error viewing report:', error);
      Alert.alert('Error', 'Failed to load research report');
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigation.replace('LoginScreen');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
          Research History
        </Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6c63ff" />
            <Text style={styles.loadingText}>Loading history...</Text>
          </View>
        ) : history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="history" size={48} color="#666" />
            <Text style={styles.emptyText}>No research history found</Text>
          </View>
        ) : (
          <FlatList
            data={history}
            renderItem={({ item }) => (
              <HistoryItem 
                item={item} 
                onViewReport={handleViewReport}
              />
            )}
            keyExtractor={item => item.research_id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#6c63ff"
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
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
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  historyItem: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  dateText: {
    color: '#666',
    fontSize: 12,
  },
  historyContent: {
    marginBottom: 12,
  },
  queryText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailText: {
    color: '#666',
    fontSize: 14,
  },
  viewReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  viewReportText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
});