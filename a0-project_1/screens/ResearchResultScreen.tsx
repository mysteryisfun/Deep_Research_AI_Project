import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  TextInput,
  ActivityIndicator,
  Share,
  Platform,
  Clipboard,
  Animated,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { 
  MaterialIcons, 
  Ionicons, 
  FontAwesome
} from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MotiView } from 'moti';
import { toast } from 'sonner-native';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '../context/ThemeContext';
import { useResearch } from '../context/ResearchContext';
import { supabase } from '../context/supabase';
import { submitFeedback, checkFeedbackSubmitted } from '../utils/researchService';

type RootStackParamList = {
  LoginScreen: undefined;
  HistoryScreen: undefined;
  ResearchResultScreen: { researchId: string };
  SeedDataScreen: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface RouteParams {
  researchId: string;
}

interface StarRatingProps {
  rating: number;
  setRating: (rating: number) => void;
  size?: number;
  color?: string;
  disabled?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  setRating, 
  size = 24, 
  color = '#FFD700', 
  disabled = false 
}) => {
  return (
    <View style={styles.ratingContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => !disabled && setRating(star)}
          disabled={disabled}
          style={styles.starButton}
        >
          <FontAwesome
            name={rating >= star ? 'star' : 'star-o'}
            size={size}
            color={rating >= star ? color : '#cccccc'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default function ResearchResultScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { theme } = useTheme();
  const { currentResearch, result: contextResult, setCurrentResearch } = useResearch();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [researchResult, setResearchResult] = useState<any>(null);
  const [waitingForResults, setWaitingForResults] = useState(false);
  const supabaseSubscriptionRef = useRef<any>(null);
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  // Add a ref to track if we've already attempted to fetch data
  const hasAttemptedFetch = useRef(false);
  
  // Feedback state
  const [rating, setRating] = useState<number | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [checkingFeedback, setCheckingFeedback] = useState(true);
  
  // Extract research ID from route params - be more flexible with param names
  const routeParams = route.params || {};
  const researchId = (routeParams as any).researchId || (routeParams as any).research_id;
  
  // Add some debugging for route params
  useEffect(() => {
    console.log('ResearchResultScreen mounted with params:', JSON.stringify(route.params));
    console.log('Extracted researchId:', researchId);
    
    // If we have any additional parameters that are useful, use them
    const query = (routeParams as any).query;
    const breadth = (routeParams as any).breadth || 3;
    const depth = (routeParams as any).depth || 3;
    const agent = (routeParams as any).agent || 'General Agent';
    
    if (query && !contextResult && !currentResearch?.query) {
      console.log('Additional parameters received, updating context:', {
        query,
        breadth,
        depth,
        agent
      });
      
      // We need to create a proper ResearchHistory object with all required fields
      if (researchId) {
        // Fetch the actual research data which will have all required fields
        supabase
          .from('research_history_new')
          .select('*')
          .eq('research_id', researchId)
          .maybeSingle()
          .then(({ data }) => {
            if (data) {
              console.log('Found existing research data, updating context');
              setCurrentResearch(data);
            } else {
              console.log('No existing research data found, using route params');
              // If no data found, we need to provide a minimal valid ResearchHistory object
              setCurrentResearch({
                research_id: researchId,
                user_id: 'anonymous', // Fallback required field
                query: query,
                breadth: breadth,
                depth: depth,
                agent: agent,
                include_technical_terms: false,
                output_format: 'default',
                status: 'completed',
                created_at: new Date().toISOString(),
                is_public: false
              });
            }
          })
          .catch((error: Error) => {
            console.error('Error fetching research data:', error);
          });
      }
    }
  }, [route.params, researchId, contextResult, currentResearch, setCurrentResearch]);
  
  // Check if feedback was already submitted
  useEffect(() => {
    if (!researchId) return;
    
    const checkExistingFeedback = async () => {
      setCheckingFeedback(true);
      try {
        const hasSubmitted = await checkFeedbackSubmitted(researchId);
        if (hasSubmitted) {
          console.log(`User has already submitted feedback for research ${researchId}`);
          setFeedbackSubmitted(true);
        } else {
          console.log(`No existing feedback found for research ${researchId}`);
          
          // Double-check using direct query
          try {
            const { data, error, count } = await supabase
              .from('research_feedback')
              .select('*', { count: 'exact' })
              .eq('research_id', researchId)
              .limit(1);
            
            if (error) {
              console.error('Error in direct feedback check:', error);
            } else if (count && count > 0) {
              console.log(`Found feedback in direct check: ${count} records`);
              setFeedbackSubmitted(true);
            }
          } catch (fallbackErr) {
            console.error('Error in fallback feedback check:', fallbackErr);
          }
        }
      } catch (err) {
        console.error('Error checking feedback status:', err);
      } finally {
        setCheckingFeedback(false);
      }
    };
    
    checkExistingFeedback();
  }, [researchId]);
  
  // Set up realtime subscription for result updates
  useEffect(() => {
    if (!researchId) return;
    
    console.log('Setting up realtime subscription for research result updates');
    
    // Set up realtime subscription
    const channel = supabase.channel('research_results')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'research_results_new',
          filter: `research_id=eq.${researchId}`
        },
        async (payload) => {
          console.log('Received realtime update:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newResult = payload.new;
            console.log('New result received:', newResult);
            
            setResearchResult(newResult);
            setWaitingForResults(false);
        setIsLoading(false);
            toast.success('Research results updated!');
          }
        }
      )
      .subscribe();
      
    // Store subscription ref for cleanup
    supabaseSubscriptionRef.current = channel;
    
    return () => {
      console.log('Cleaning up realtime subscription');
      if (supabaseSubscriptionRef.current) {
        supabase.removeChannel(supabaseSubscriptionRef.current);
      }
    };
  }, [researchId]);
  
  // Initial data fetch - completely rewritten to prevent loops
  useEffect(() => {
    if (!researchId) return;
    
    if (hasAttemptedFetch.current) {
      console.log('Already attempted fetch for this research ID, skipping to prevent loops');
      return;
    }
    
    const fetchInitialData = async () => {
      console.log('Fetching initial data for research:', researchId);
      setIsLoading(true);
      setError(null);
      hasAttemptedFetch.current = true;
      
      try {
        // Try to fetch research data, but don't fail if not found
        const { data: researchData } = await supabase
          .from('research_history_new')
          .select('*')
          .eq('research_id', researchId)
          .maybeSingle();
        
        // Set research data if we found it
        if (researchData) {
          console.log('Setting current research:', researchData);
          setCurrentResearch(researchData);
        }
        
        // Try to fetch results
        const { data: resultsData } = await supabase
          .from('research_results_new')
          .select('*')
          .eq('research_id', researchId)
          .order('created_at', { ascending: false })
          .maybeSingle();
          
        if (resultsData) {
          console.log('Found result data:', resultsData);
          setResearchResult(resultsData);
          setWaitingForResults(false);
        } else {
          console.log('No results found, waiting for updates');
          setWaitingForResults(true);
        }
      } catch (err) {
        console.error('Error in fetchInitialData:', err);
        // Don't set error, just put in waiting state
        setWaitingForResults(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialData();
    
    // No dependencies to prevent refetching
  }, [researchId]);
  
  // Set up pulse animation for waiting state
  useEffect(() => {
    if (waitingForResults) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          })
        ])
      ).start();
    } else {
      pulseAnimation.setValue(1);
    }
    
    return () => {
      pulseAnimation.stopAnimation();
    };
  }, [waitingForResults, pulseAnimation]);
  
  const handleSubmitFeedback = async () => {
    if (!researchId || !rating) {
      toast.error('Please provide a rating');
      return;
    }
    
    setIsSubmittingFeedback(true);
    
    try {
      console.log(`Submitting feedback with rating ${rating} for research ${researchId}`);
      // Use the submitFeedback function from researchService
      const success = await submitFeedback(
        researchId,
        rating,
        feedbackComment || undefined
      );
      
      if (!success) {
        console.error('Feedback submission returned false, trying direct insertion');
        
        // Try direct insertion as fallback
        try {
          // Generate a unique feedback ID
          const feedbackId = `feedback-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          
          // Prepare the feedback data
          const feedbackData = {
            feedback_id: feedbackId,
            research_id: researchId,
            rating,
            comment: feedbackComment || null,
            created_at: new Date().toISOString()
          };
          
          // Try the RPC function to bypass potential foreign key issues
          const { error: rpcError } = await supabase.rpc('submit_research_feedback', {
            p_feedback_id: feedbackId,
            p_research_id: researchId,
            p_user_id: null,
            p_rating: rating,
            p_comment: feedbackComment || null,
            p_created_at: new Date().toISOString()
          });
          
          if (!rpcError) {
            console.log('Direct feedback submission via RPC succeeded');
            setFeedbackSubmitted(true);
            toast.success('Thank you for your feedback!');
          } else {
            console.error('RPC error in direct submission:', rpcError);
            toast.error('Failed to submit feedback');
          }
        } catch (directErr) {
          console.error('Error in direct submission:', directErr);
          throw new Error('Failed to submit feedback');
        }
      } else {
        console.log('Feedback submitted successfully, updating UI');
        setFeedbackSubmitted(true);
        // Toast notification is already shown in the submitFeedback function
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };
  
  const handleShare = async () => {
    if (!currentResearch || !researchResult) return;
    
    try {
      const shareText = `Research Query: ${currentResearch.query}\n\nResult: ${researchResult.result}`;
      await Share.share({
        message: shareText,
        title: 'Research Result',
      });
    } catch (err) {
      console.error('Error sharing:', err);
      toast.error('Failed to share research');
    }
  };

  const handleCopyToClipboard = () => {
    if (!researchResult?.result) return;
    
    try {
      Clipboard.setString(researchResult.result);
      toast.success('Research content copied to clipboard');
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      toast.error('Failed to copy to clipboard');
    }
  };

  // Move the currentResearch check outside of the render path
  useEffect(() => {
    // If we have a research result but no currentResearch data, create a minimal placeholder
    if (researchResult && !currentResearch && researchId) {
      console.log('Creating minimal research context from result data');
      setCurrentResearch({
        research_id: researchId,
        query: 'Research query',
        created_at: researchResult.created_at || new Date().toISOString(),
        user_id: researchResult.user_id || 'unknown',
        agent: 'general',
        breadth: 3,
        depth: 3,
        include_technical_terms: false,
        output_format: 'Research Paper',
        status: 'completed',
        is_public: false
      });
    }
  }, [researchResult, currentResearch, researchId, setCurrentResearch]);

  // Modify the Feedback Section to show a thank you message when feedback is submitted
  // or show loading state when checking
  const renderFeedbackSection = () => {
    if (checkingFeedback) {
      return (
        <View style={[styles.feedbackCard, { backgroundColor: theme.card }]}>
          <ActivityIndicator size="small" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.secondaryText, marginTop: 10 }]}>
            Checking feedback status...
          </Text>
        </View>
      );
    }
    
    if (feedbackSubmitted) {
      return (
        <View style={[styles.feedbackCard, { backgroundColor: theme.card }]}>
          <MaterialIcons name="check-circle" size={48} color="#4BB543" />
          <Text style={[styles.feedbackTitle, { color: theme.text, textAlign: 'center', marginTop: 10 }]}>
            Thank you for your feedback!
          </Text>
          <Text style={[{ color: theme.secondaryText, textAlign: 'center', marginTop: 8 }]}>
            Your opinion helps us improve our research quality
          </Text>
        </View>
      );
    }
    
    return (
      <View style={[styles.feedbackCard, { backgroundColor: theme.card }]}>
        <Text style={[styles.feedbackTitle, { color: theme.text }]}>
          Rate this Research
        </Text>
        <StarRating
          rating={rating || 0}
          setRating={(newRating) => setRating(newRating)}
          disabled={isSubmittingFeedback}
        />
        <TextInput
          style={[styles.feedbackInput, { 
            backgroundColor: theme.background,
            color: theme.text,
            borderColor: theme.border
          }]}
          placeholder="Add a comment (optional)"
          placeholderTextColor={theme.secondaryText}
          value={feedbackComment}
          onChangeText={setFeedbackComment}
          multiline
          numberOfLines={4}
          editable={!isSubmittingFeedback}
        />
        <TouchableOpacity 
          style={[
            styles.submitButton,
            { backgroundColor: theme.accent },
            (!rating || isSubmittingFeedback) && { opacity: 0.6 }
          ]}
          onPress={handleSubmitFeedback}
          disabled={isSubmittingFeedback || !rating}
        >
          {isSubmittingFeedback ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              Submit Feedback
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar style={theme.statusBar === 'light' ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading research...
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (waitingForResults) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar style={theme.statusBar === 'light' ? 'light' : 'dark'} />
        
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.card }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Research Result
          </Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.waitingContainer}>
          <Animated.View style={{
            transform: [{ scale: pulseAnimation }]
          }}>
            <ActivityIndicator size="large" color={theme.accent} />
          </Animated.View>
          <Text style={[styles.waitingText, { color: theme.text }]}>
            Preparing Research Results...
          </Text>
          <Text style={[styles.waitingSubText, { color: theme.secondaryText }]}>
            Your research report is being generated. This may take a few moments.
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar style={theme.statusBar === 'light' ? 'light' : 'dark'} />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#FF3B30" />
          <Text style={[styles.errorText, { color: theme.text }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.accent }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Check if we have research results to display, regardless of currentResearch
  if (researchResult) {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.statusBar === 'light' ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Research Result
        </Text>
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={handleShare}
            disabled={!currentResearch}
        >
          <MaterialIcons name="share" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Research Content */}
        <View style={[styles.researchCard, { backgroundColor: theme.card }]}>
            {/* Render markdown content with null check */}
            {researchResult?.result ? (
              <View style={styles.markdownContainer}>
                <Markdown
                  style={{
                    body: { color: theme.text },
                    heading1: { color: theme.text, fontSize: 24, fontWeight: 'bold', marginBottom: 16, marginTop: 16 },
                    heading2: { color: theme.text, fontSize: 20, fontWeight: '600', marginBottom: 12, marginTop: 20 },
                    heading3: { color: theme.text, fontSize: 18, fontWeight: '600', marginBottom: 10, marginTop: 16 },
                    paragraph: { color: theme.text, fontSize: 16, lineHeight: 24, marginBottom: 12 },
                    strong: { color: theme.text, fontWeight: 'bold' },
                    em: { color: theme.text, fontStyle: 'italic' },
                    link: { color: theme.accent },
                    blockquote: { 
                      borderLeftWidth: 4, 
                      borderLeftColor: theme.accent,
                      paddingLeft: 16,
                      marginLeft: 0,
                      marginVertical: 12,
                    },
                    bullet_list: { marginBottom: 12 },
                    ordered_list: { marginBottom: 12 },
                    list_item: { color: theme.text, marginBottom: 8 },
                    code_block: { 
                      backgroundColor: theme.card,
                      padding: 16,
                      borderRadius: 8,
                      color: theme.text,
                      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                      marginVertical: 12,
                    },
                    code_inline: {
                      backgroundColor: theme.card,
                      padding: 4,
                      borderRadius: 4,
                      color: theme.accent,
                      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                    },
                    hr: { backgroundColor: theme.border, marginVertical: 16 },
                    table: { borderWidth: 1, borderColor: theme.border, marginVertical: 16 },
                    thead: { backgroundColor: theme.card },
                    th: { padding: 8, color: theme.text, fontWeight: 'bold' },
                    td: { padding: 8, borderTopWidth: 1, borderTopColor: theme.border, color: theme.text },
                    image: { maxWidth: '100%', height: 'auto', marginVertical: 16, borderRadius: 8 }
                  }}
                >
                  {researchResult.result}
                </Markdown>
                
                <View style={styles.contentActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.card }]}
                    onPress={handleCopyToClipboard}
                  >
                    <View style={styles.actionButtonContent}>
                      <MaterialIcons name="content-copy" size={18} color={theme.text} />
                      <Text style={[styles.actionButtonText, { color: theme.text }]}>Copy Content</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.noResultContainer}>
                <MaterialIcons name="info-outline" size={48} color={theme.secondaryText} />
                <Text style={[styles.noResultText, { color: theme.secondaryText }]}>
                  Waiting for results...
          </Text>
              </View>
            )}
        </View>
        
        {/* Feedback Section - using the new render function */}
        {renderFeedbackSection()}
      </ScrollView>
      </SafeAreaView>
    );
  }

  // Fallback if we have no result and aren't waiting (should rarely happen)
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.statusBar === 'light' ? 'light' : 'dark'} />
      <View style={styles.errorContainer}>
        <MaterialIcons name="search-off" size={64} color="#FF3B30" />
        <Text style={[styles.errorText, { color: theme.text }]}>
          Research not found
        </Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: theme.accent }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
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
    justifyContent: 'space-between',
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
  shareButton: {
    padding: 8,
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  researchCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  queryText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    marginBottom: 16,
  },
  resultText: {
    fontSize: 16,
    lineHeight: 24,
  },
  feedbackCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  starButton: {
    padding: 4,
  },
  feedbackInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  submitButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  contentH1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    marginTop: 24,
  },
  contentH2: {
    fontSize: 20,
    fontWeight: '600',
    color: '#444',
    marginBottom: 12,
    marginTop: 20,
  },
  contentParagraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
    marginBottom: 12,
  },
  markdownContainer: {
    marginBottom: 16,
  },
  noResultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  contentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  waitingText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  waitingSubText: {
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal: 32,
  },
  placeholder: {
    width: 24,
  },
});