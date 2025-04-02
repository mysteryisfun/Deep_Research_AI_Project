import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  ActivityIndicator,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../utils/supabase';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { toast } from 'sonner-native';

// Interface matching the research_active_queue table structure
interface QueueItem {
  research_id: string;
  user_id: string;
  status: string;
  created_at: string;
  agent?: string;
  title?: string;
}

export default function SimpleQueueTestScreen() {
  console.log('SimpleQueueTestScreen loaded');
  
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [terminalInput, setTerminalInput] = useState<string>('');
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const subscription = useRef<any>(null);
  const logsScrollViewRef = useRef<ScrollView>(null);
  
  // Log helper with severity levels
  const addLog = (message: string, level: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    let prefix = '';
    
    switch (level) {
      case 'success':
        prefix = '✅ ';
        break;
      case 'warning':
        prefix = '⚠️ ';
        break;
      case 'error':
        prefix = '❌ ';
        break;
      default:
        prefix = 'ℹ️ ';
    }
    
    const logMessage = `[${timestamp}] ${prefix}${message}`;
    console.log(`[SimpleQueueTest] ${message}`);
    
    setLogs(prev => [logMessage, ...prev]);
    
    // Auto-scroll to top for new logs
    setTimeout(() => {
      logsScrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 100);
  };
  
  // Initial load
  useEffect(() => {
    addLog('Component mounted - initializing queue monitor', 'info');
    fetchQueue();
    setupRealtimeSubscription();
    
    return () => {
      addLog('Component unmounting - cleaning up resources', 'info');
      removeRealtimeSubscription();
    };
  }, []);
  
  // Setup realtime subscription
  const setupRealtimeSubscription = () => {
    addLog('Setting up realtime subscription to research_active_queue table', 'info');
    
    try {
      const channel = supabase.channel('queue-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'research_active_queue'
        }, (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          
          addLog(`Realtime event received: ${eventType}`, 'success');
          
          if (eventType === 'INSERT') {
            addLog(`New queue item added: ${newRecord.research_id}`, 'success');
          } else if (eventType === 'UPDATE') {
            addLog(`Queue item updated: ${newRecord.research_id}, Status: ${newRecord.status}`, 'info');
          } else if (eventType === 'DELETE') {
            addLog(`Queue item removed: ${oldRecord.research_id}`, 'warning');
          }
          
          // Refresh the queue data
          fetchQueue(false);
        })
        .subscribe((status) => {
          addLog(`Subscription status: ${status}`, status === 'SUBSCRIBED' ? 'success' : 'warning');
          setIsSubscriptionActive(status === 'SUBSCRIBED');
        });
      
      subscription.current = channel;
    } catch (err: any) {
      addLog(`Failed to set up realtime subscription: ${err.message}`, 'error');
      setError(`Realtime subscription error: ${err.message}`);
    }
  };
  
  // Remove realtime subscription
  const removeRealtimeSubscription = () => {
    if (subscription.current) {
      addLog('Removing realtime subscription', 'info');
      supabase.removeChannel(subscription.current);
      setIsSubscriptionActive(false);
    }
  };
  
  // Toggle subscription
  const toggleSubscription = () => {
    if (isSubscriptionActive) {
      removeRealtimeSubscription();
      toast.info('Realtime updates disabled');
    } else {
      setupRealtimeSubscription();
      toast.success('Realtime updates enabled');
    }
  };
  
  // Fetch queue data directly from Supabase
  const fetchQueue = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
      addLog('Fetching queue data from Supabase...', 'info');
    }
    
    try {
      const startTime = Date.now();
      
      // Debug the supabase connection
      addLog(`Attempting to connect to Supabase database`, 'info');
      
      // First check if the table exists by getting a count
      const { count, error: countError } = await supabase
        .from('research_active_queue')
        .select('*', { count: 'exact', head: true });
        
      if (countError) {
        addLog(`Error checking table: ${countError.message}`, 'error');
        if (countError.message.includes('does not exist')) {
          throw new Error('The research_active_queue table does not exist in your database');
        }
        throw countError;
      }
      
      addLog(`Table access confirmed. Found ${count} total records`, 'info');
      
      // Now fetch the actual data
      const { data, error, status } = await supabase
        .from('research_active_queue')
        .select('*')
        .order('created_at', { ascending: false });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
        
      if (error) {
        throw error;
      }
      
      const itemCount = data?.length || 0;
      addLog(`Successfully fetched ${itemCount} queue items in ${duration}ms (Status: ${status})`, 'success');
      
      // Log details about each item
      if (itemCount > 0) {
        addLog(`First item: ${data[0].research_id}, Status: ${data[0].status}`, 'info');
        
        // Log all records for debugging
        data.forEach((item, index) => {
          addLog(`Record ${index+1}: ID=${item.research_id}, User=${item.user_id}, Status=${item.status}`, 'info');
        });
      } else {
        addLog('No records found in the queue table. This could be normal if no research is in progress.', 'warning');
      }
      
      setQueueItems(data || []);
      setLastUpdated(new Date());
    } catch (err: any) {
      addLog(`Error fetching queue data: ${err.message}`, 'error');
      setError(`Failed to fetch queue: ${err.message}`);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
      setRefreshing(false);
    }
  };
  
  // Process terminal commands
  const processCommand = (command: string) => {
    addLog(`> ${command}`, 'info');
    
    const cmd = command.trim().toLowerCase();
    
    switch (cmd) {
      case 'help':
        addLog('Available commands:', 'info');
        addLog('  help - Show this help', 'info');
        addLog('  refresh - Refresh queue data', 'info');
        addLog('  clear - Clear logs', 'info');
        addLog('  status - Show subscription status', 'info');
        addLog('  toggle - Toggle realtime subscription', 'info');
        addLog('  debug - Show detailed debug info', 'info');
        break;
      case 'refresh':
        addLog('Manually refreshing queue data...', 'info');
        fetchQueue();
        break;
      case 'clear':
        addLog('Clearing logs...', 'info');
        setLogs([]);
        break;
      case 'status':
        addLog(`Subscription status: ${isSubscriptionActive ? 'ACTIVE' : 'INACTIVE'}`, 'info');
        addLog(`Last updated: ${lastUpdated.toLocaleTimeString()}`, 'info');
        addLog(`Queue items: ${queueItems.length}`, 'info');
        break;
      case 'toggle':
        toggleSubscription();
        break;
      case 'debug':
        // Show additional debug info for troubleshooting
        addLog('--- DEBUG INFORMATION ---', 'info');
        addLog(`Queue items count: ${queueItems.length}`, 'info');
        addLog(`Subscription ref: ${subscription.current ? 'Active' : 'Inactive'}`, 'info');
        addLog(`Last request timestamp: ${lastUpdated.toISOString()}`, 'info');
        
        // Check authentication status
        supabase.auth.getSession().then(({ data, error }) => {
          if (error) {
            addLog(`Auth error: ${error.message}`, 'error');
          } else {
            addLog(`Auth status: ${data.session ? 'Authenticated' : 'Not authenticated'}`, 'info');
          }
        });
        
        break;
      default:
        addLog(`Unknown command: ${command}`, 'error');
    }
    
    setTerminalInput('');
  };
  
  // Render a queue item
  const renderItem = ({ item, index }: { item: QueueItem; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ 
        delay: index * 100,
        type: 'timing',
        duration: 500,
      } as any}
      style={[styles.card, { backgroundColor: theme.card }]}
    >
      <LinearGradient
        colors={item.status === 'pending' ? ['#4338CA', '#6366F1'] : ['#10B981', '#059669']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.cardGradient}
      />
      
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
          {item.title || 'Untitled Research'}
        </Text>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: item.status === 'pending' ? '#4F46E5' : '#10B981' }
        ]}>
          <Text style={styles.statusBadgeText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.cardRow}>
          <Text style={[styles.cardLabel, { color: theme.secondaryText }]}>ID:</Text>
          <Text style={[styles.cardValue, { color: theme.text }]} numberOfLines={1}>
            {item.research_id}
          </Text>
        </View>
        
        <View style={styles.cardRow}>
          <Text style={[styles.cardLabel, { color: theme.secondaryText }]}>User:</Text>
          <Text style={[styles.cardValue, { color: theme.text }]} numberOfLines={1}>
            {item.user_id}
          </Text>
        </View>
        
        <View style={styles.cardRow}>
          <Text style={[styles.cardLabel, { color: theme.secondaryText }]}>Agent:</Text>
          <Text style={[styles.cardValue, { color: theme.text }]}>
            {item.agent || 'Not specified'}
          </Text>
        </View>
        
        <View style={styles.cardRow}>
          <Text style={[styles.cardLabel, { color: theme.secondaryText }]}>Created:</Text>
          <Text style={[styles.cardValue, { color: theme.text }]}>
            {new Date(item.created_at).toLocaleString()}
          </Text>
        </View>
      </View>
    </MotiView>
  );
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.statusBar === 'light' ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Active Research Queue
        </Text>
        
        <TouchableOpacity
          style={[
            styles.subscriptionToggle,
            { backgroundColor: isSubscriptionActive ? '#10B981' : '#6B7280' }
          ]}
          onPress={toggleSubscription}
        >
          <Text style={styles.subscriptionText}>
            {isSubscriptionActive ? 'Live' : 'Off'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Status bar */}
      <View style={[styles.statusBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={[styles.statusText, { color: theme.secondaryText }]}>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </Text>
        
        <TouchableOpacity 
          style={[styles.refreshButton, { backgroundColor: theme.accent }]}
          onPress={() => fetchQueue()}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.refreshButtonText}>Refresh</Text>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Queue list */}
      {isLoading && queueItems.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading queue items...
          </Text>
        </View>
      ) : (
        <FlatList
          data={queueItems}
          renderItem={renderItem}
          keyExtractor={item => item.research_id}
          contentContainerStyle={styles.list}
          onRefresh={() => {
            setRefreshing(true);
            fetchQueue(false);
          }}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="queue" size={64} color={theme.secondaryText} />
              <Text style={[styles.emptyText, { color: theme.text }]}>
                No active research in queue
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.secondaryText }]}>
                Items will appear here when research is in progress
              </Text>
              <TouchableOpacity 
                style={[styles.testButton, {backgroundColor: theme.accent}]}
                onPress={() => {
                  addLog('Checking connection to Supabase...', 'info');
                  supabase.from('research_active_queue')
                    .select('count(*)', { count: 'exact', head: true })
                    .then(({ count, error }) => {
                      if (error) {
                        addLog(`Connection error: ${error.message}`, 'error');
                      } else {
                        addLog(`Connection successful. Found ${count} records.`, 'success');
                      }
                    });
                }}
              >
                <Text style={styles.testButtonText}>Test Connection</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
      
      {/* Terminal/Logs Section */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.terminal, { backgroundColor: '#0F172A' }]}
      >
        <View style={styles.terminalHeader}>
          <Text style={styles.terminalTitle}>Queue Monitor Terminal</Text>
          <TouchableOpacity onPress={() => setLogs([])}>
            <Text style={styles.clearButton}>Clear</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          ref={logsScrollViewRef}
          style={styles.terminalOutput}
          contentContainerStyle={styles.terminalContent}
          showsVerticalScrollIndicator={false}
        >
          {logs.map((log, index) => (
            <Text key={index} style={styles.logItem}>
              {log}
            </Text>
          )).reverse()}
        </ScrollView>
        
        <View style={styles.terminalInputContainer}>
          <Text style={styles.terminalPrompt}>$</Text>
          <TextInput
            style={styles.terminalInputField}
            value={terminalInput}
            onChangeText={setTerminalInput}
            placeholder="Type 'help' for commands..."
            placeholderTextColor="#64748B"
            onSubmitEditing={() => {
              if (terminalInput.trim()) {
                processCommand(terminalInput);
              }
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.terminalButton}
            onPress={() => {
              if (terminalInput.trim()) {
                processCommand(terminalInput);
              }
            }}
          >
            <Ionicons name="send" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      
      {/* Error Toast */}
      {error && (
        <MotiView 
          from={{ opacity: 0, translateY: 50 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ 
            type: 'spring',
            damping: 16,
            stiffness: 200
          } as any}
          style={styles.errorContainer}
        >
          <MaterialIcons name="error" size={20} color="#fff" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.dismissButton}
            onPress={() => setError(null)}
          >
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>
        </MotiView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subscriptionToggle: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subscriptionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  statusText: {
    fontSize: 12,
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  list: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  testButton: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  testButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  card: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardGradient: {
    position: 'absolute',
    left: 0,
    width: 4,
    top: 0,
    bottom: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 16,
    paddingTop: 0,
  },
  cardRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  cardLabel: {
    fontSize: 14,
    width: 60,
  },
  cardValue: {
    fontSize: 14,
    flex: 1,
  },
  terminal: {
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  terminalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  terminalTitle: {
    color: '#E2E8F0',
    fontWeight: 'bold',
    fontSize: 14,
  },
  clearButton: {
    color: '#94A3B8',
    fontSize: 14,
  },
  terminalOutput: {
    flex: 1,
  },
  terminalContent: {
    padding: 12,
  },
  logItem: {
    color: '#E2E8F0',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 6,
  },
  terminalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    padding: 12,
  },
  terminalPrompt: {
    color: '#10B981',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: 'bold',
    marginRight: 8,
  },
  terminalInputField: {
    flex: 1,
    color: '#E2E8F0',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    padding: 0,
    height: 24,
  },
  terminalButton: {
    padding: 4,
    marginLeft: 8,
  },
  errorContainer: {
    position: 'absolute',
    bottom: 210,
    left: 16,
    right: 16,
    backgroundColor: '#EF4444',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#ffffff',
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  dismissButton: {
    padding: 4,
  },
  dismissText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 