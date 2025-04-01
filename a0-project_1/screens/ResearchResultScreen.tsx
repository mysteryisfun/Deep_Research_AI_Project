import React, { useState, useEffect } from 'react';
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
import { useTheme } from '../context/ThemeContext';
import { useResearch } from '../context/ResearchContext';
import { supabase } from '../context/supabase';

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
  const { currentResearch, result, setCurrentResearch } = useResearch();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Feedback state
  const [rating, setRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  
  // Extract research ID from route params
  const researchId = (route.params as RouteParams)?.researchId;
  
  // Fetch research data
  useEffect(() => {
    const fetchResearchData = async () => {
      if (!researchId) {
        setError('No research ID provided');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Error getting user:', userError);
          throw new Error('Failed to get user information');
        }
        
        if (!user) {
          navigation.replace('LoginScreen');
          return;
        }

        // Fetch research data
        const { data, error } = await supabase
          .from('research_history_new')
          .select('*')
          .eq('research_id', researchId)
          .single();
        
        if (error) throw error;
        
        if (!data) {
          throw new Error('Research not found');
        }

        // Set current research in context
        setCurrentResearch(data);
      } catch (err) {
        console.error('Error fetching research:', err);
        setError('Failed to load research data. Please try again.');
        toast.error('Could not load research report');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchResearchData();
  }, [researchId, navigation, setCurrentResearch]);
  
  const handleSubmitFeedback = async () => {
    if (!researchId || !rating) {
      toast.error('Please provide a rating');
      return;
    }
    
    setIsSubmittingFeedback(true);
    
    try {
      const { error } = await supabase
        .from('research_feedback')
        .insert({
          research_id: researchId,
          rating,
          comment: feedbackComment,
        });
      
      if (error) throw error;
      
      setFeedbackSubmitted(true);
      toast.success('Thank you for your feedback!');
    } catch (err) {
      console.error('Error submitting feedback:', err);
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };
  
  const handleShare = async () => {
    if (!currentResearch || !result) return;
    
    try {
      const shareText = `Research Query: ${currentResearch.query}\n\nResult: ${result.result}`;
      await Share.share({
        message: shareText,
        title: 'Research Result',
      });
    } catch (err) {
      console.error('Error sharing:', err);
      toast.error('Failed to share research');
    }
  };

  // Format the research content from markdown to a simplified version
  const formatContent = (content) => {
    if (!content) return '';
    
    // Split content into sections based on markdown headers
    const sections = content.split(/(?=^# )/m);
    
    return sections.map((section, index) => {
      // Handle main title (h1)
      if (section.startsWith('# ')) {
        const title = section.replace('# ', '').split('\n')[0];
        const rest = section.split('\n').slice(1).join('\n');
        return (
          <View key={index} style={styles.sectionContainer}>
            <Text style={styles.contentH1}>{title}</Text>
            {rest && <Text style={styles.contentParagraph}>{rest}</Text>}
          </View>
        );
      }
      
      // Handle subtitles (h2)
      if (section.includes('\n## ')) {
        const parts = section.split(/(?=\n## )/);
        return (
          <View key={index} style={styles.sectionContainer}>
            {parts.map((part, partIndex) => {
              if (part.trim().startsWith('## ')) {
                const title = part.replace('## ', '').split('\n')[0];
                const rest = part.split('\n').slice(1).join('\n');
                return (
                  <View key={`${index}-${partIndex}`}>
                    <Text style={styles.contentH2}>{title}</Text>
                    {rest && <Text style={styles.contentParagraph}>{rest}</Text>}
                  </View>
                );
              }
              return <Text key={`${index}-${partIndex}`} style={styles.contentParagraph}>{part}</Text>;
            })}
          </View>
        );
      }
      
      // Handle regular paragraphs
      return (
        <View key={index} style={styles.sectionContainer}>
          <Text style={styles.contentParagraph}>{section}</Text>
        </View>
      );
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar style={theme.statusBar === 'light' ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading research report...
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

  if (!currentResearch || !result) {
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
          <Text style={[styles.queryText, { color: theme.text }]}>
            {currentResearch.query}
          </Text>
          <Text style={[styles.dateText, { color: theme.secondaryText }]}>
            {new Date(currentResearch.created_at).toLocaleDateString()}
          </Text>
          {formatContent(result.result)}
        </View>
        
        {/* Feedback Section */}
        {!feedbackSubmitted && (
          <View style={[styles.feedbackCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.feedbackTitle, { color: theme.text }]}>
              Rate this Research
          </Text>
            <StarRating
              rating={rating}
              setRating={setRating}
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
                { backgroundColor: theme.accent }
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
          )}
      </ScrollView>
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
});