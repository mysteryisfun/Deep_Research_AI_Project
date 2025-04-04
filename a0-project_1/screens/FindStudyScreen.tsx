import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  ImageBackground,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../context/supabase';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MotiView } from 'moti';

type RootStackParamList = {
  LoginScreen: undefined;
  HistoryScreen: undefined;
  ResearchResultScreen: { researchId: string };
  SeedDataScreen: undefined;
  ResearchResult: { researchId: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface PublicResearch {
  research_id: string;
  query: string;
  result: string;
  created_at: string;
}

export default function FindStudyScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [publicResearch, setPublicResearch] = useState<PublicResearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchResults, setSearchResults] = useState<PublicResearch[]>([]);

  const performSemanticSearch = async (query: string) => {
    if (!query.trim()) {
      await fetchPublicResearch();
      return;
    }

    try {
      setLoading(true);
      const searchTerms = query.toLowerCase().split(' ');
      const relatedTerms: { [key: string]: string[] } = {
        // Health & Medicine
        'health': ['medical', 'wellness', 'disease', 'treatment', 'therapy', 'care', 'hospital', 'doctor', 'patient', 'medicine', 'pharmacy', 'diagnosis'],
        'neuron': ['brain', 'nervous system', 'synapse', 'cognitive', 'mental health', 'psychology', 'neurology', 'neuroscience', 'brain function'],
        'disease': ['illness', 'condition', 'symptoms', 'diagnosis', 'treatment', 'cure', 'prevention', 'healthcare'],
        
        // Technology & Computing
        'ai': ['artificial intelligence', 'machine learning', 'neural network', 'deep learning', 'automation', 'robotics', 'computer vision', 'natural language processing'],
        'tech': ['technology', 'innovation', 'digital', 'software', 'hardware', 'computing', 'internet', 'cybersecurity'],
        'data': ['information', 'analysis', 'statistics', 'database', 'processing', 'big data', 'data science', 'analytics', 'visualization'],
        
        // Business & Finance
        'business': ['company', 'enterprise', 'management', 'strategy', 'market', 'industry', 'commerce', 'trade', 'economics'],
        'finance': ['banking', 'investment', 'stock market', 'trading', 'financial', 'money', 'capital', 'assets', 'portfolio'],
        'market': ['economy', 'trading', 'stocks', 'shares', 'investment', 'financial markets', 'trading floor', 'market analysis'],
        
        // Science & Research
        'quantum': ['physics', 'mechanics', 'entanglement', 'superposition', 'atomic', 'particle', 'quantum computing', 'quantum mechanics'],
        'research': ['study', 'investigation', 'analysis', 'experiment', 'scientific method', 'hypothesis', 'theory', 'discovery'],
        'science': ['scientific', 'research', 'experiment', 'laboratory', 'discovery', 'innovation', 'technology', 'engineering'],
        
        // Education & Learning
        'education': ['learning', 'teaching', 'school', 'university', 'academic', 'curriculum', 'student', 'knowledge', 'training'],
        'learning': ['education', 'training', 'skill development', 'knowledge acquisition', 'teaching', 'instruction', 'pedagogy'],
        
        // Environment & Sustainability
        'environment': ['climate', 'sustainability', 'ecology', 'conservation', 'green', 'renewable', 'pollution', 'climate change'],
        'climate': ['weather', 'temperature', 'global warming', 'climate change', 'environment', 'atmosphere', 'greenhouse'],
        
        // Social Sciences
        'society': ['community', 'social', 'culture', 'population', 'demographics', 'social behavior', 'human behavior'],
        'psychology': ['mental', 'behavior', 'cognitive', 'emotional', 'psychological', 'mental health', 'therapy', 'counseling'],
        
        // Engineering
        'engineering': ['design', 'construction', 'mechanical', 'electrical', 'civil', 'aerospace', 'industrial', 'systems'],
        'robotics': ['automation', 'mechanical', 'artificial intelligence', 'machine learning', 'control systems', 'automation'],
        
        // Agriculture & Food
        'agriculture': ['farming', 'crops', 'food production', 'sustainable farming', 'agricultural technology', 'food security'],
        'food': ['nutrition', 'diet', 'agriculture', 'food production', 'food security', 'sustainable food', 'food science']
      };

      // First, search in research_results_new
      const { data: resultsData, error: resultsError } = await supabase
        .from('research_results_new')
        .select('research_id, result');

      if (resultsError) throw resultsError;

      // Filter results based on semantic search
      const matchingResults = resultsData.filter(item => {
        const content = item.result.toLowerCase();
        
        // Check for direct matches
        const hasDirectMatch = searchTerms.some(term => content.includes(term));
        if (hasDirectMatch) return true;

        // Check for semantic matches
        const hasSemanticMatch = searchTerms.some(term => {
          const relatedWords = relatedTerms[term] || [];
          return relatedWords.some(relatedTerm => content.includes(relatedTerm));
        });

        return hasSemanticMatch;
      });

      // Get the research_ids from matching results
      const matchingResearchIds = matchingResults.map(item => item.research_id);

      // Then, get the public research details
      const { data: publicData, error: publicError } = await supabase
        .from('public_research_page')
        .select('*')
        .in('research_id', matchingResearchIds)
        .eq('is_public', true);

      if (publicError) throw publicError;

      // Combine the data
      const transformedData = publicData.map(item => {
        const result = matchingResults.find(r => r.research_id === item.research_id);
        return {
          research_id: item.research_id,
          query: item.query,
          result: result?.result || 'Click to view full research',
          created_at: item.created_at,
        };
      });

      setPublicResearch(transformedData);
      setSearchResults(transformedData);
    } catch (error) {
      console.error('Error performing semantic search:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicResearch = async () => {
    try {
      setLoading(true);
      const { data: publicData, error: publicError } = await supabase
        .from('public_research_page')
        .select(`
          id,
          research_id,
          query,
          created_at,
          status,
          is_public
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (publicError) throw publicError;

      // Get the research results for public research
      const researchIds = publicData.map(item => item.research_id);
      const { data: resultsData, error: resultsError } = await supabase
        .from('research_results_new')
        .select('research_id, result')
        .in('research_id', researchIds);

      if (resultsError) throw resultsError;

      // Combine the data
      const transformedData = publicData.map(item => {
        const result = resultsData.find(r => r.research_id === item.research_id);
        return {
          research_id: item.research_id,
          query: item.query,
          result: result?.result || 'Click to view full research',
          created_at: item.created_at,
        };
      });

      setPublicResearch(transformedData);
      setSearchResults(transformedData);
    } catch (error) {
      console.error('Error fetching public research:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPublicResearch();
  }, []);

  // Update search when query changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      performSemanticSearch(searchQuery);
    }, 300); // Debounce for 300ms

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPublicResearch();
  };

  const renderResearchItem = ({ item }: { item: PublicResearch }) => (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 100 }}
    >
      <TouchableOpacity
        style={[styles.researchCard, { backgroundColor: theme.card }]}
        onPress={() => navigation.navigate('ResearchResultScreen', { researchId: item.research_id })}
      >
        <View style={styles.researchHeader}>
          <Text style={[styles.researchTitle, { color: theme.text }]} numberOfLines={2}>
            {item.query}
          </Text>
          <Text style={[styles.researchDate, { color: theme.secondaryText }]}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <Text style={[styles.researchPreview, { color: theme.secondaryText }]} numberOfLines={3}>
          {item.result}
        </Text>
        <View style={styles.researchFooter}>
          <Text style={[styles.researchCitations, { color: theme.accent }]}>127 citations</Text>
          <TouchableOpacity 
            style={styles.viewDetailsButton}
            onPress={() => navigation.navigate('ResearchResultScreen', { researchId: item.research_id })}
          >
            <Text style={styles.viewDetailsText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </MotiView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.statusBar === 'light' ? 'light' : 'dark'} />
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', // Replace with a suitable image URL
        }}
        style={styles.headerBackground}
        resizeMode="cover"
      >
        <View style={styles.headerOverlay}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Find Research</Text>
          </View>
          <Text style={styles.headerSubtitle}>Search and analyze scientific publications</Text>
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={24} color="#fff" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search scientific papers..."
              placeholderTextColor="#ddd"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <View style={styles.filterContainer}>
            {['All', 'Quantum', 'Neuroscience', 'Healthcare', 'AI'].map(filter => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  selectedFilter === filter && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedFilter === filter && styles.filterTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ImageBackground>
      <Text style={styles.sectionTitle}>Recent Publications</Text>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : searchResults.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="search-off" size={64} color={theme.secondaryText} />
          <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
            No matching research papers found
          </Text>
        </View>
      ) : (
        <FlatList
          data={searchResults}
          renderItem={renderResearchItem}
          keyExtractor={item => item.research_id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.accent}
              colors={[theme.accent]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBackground: {
    width: '100%',
    height: 250,
  },
  headerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ddd',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#fff',
  },
  filterContainer: {
    flexDirection: 'row', // Align buttons in a row
    justifyContent: 'center', // Center the buttons
    alignItems: 'center', // Align buttons vertically
    marginTop: 16,
    gap: 8, // Add spacing between buttons (React Native >= 0.71)
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterButtonActive: {
    backgroundColor: '#6c63ff',
  },
  filterText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginVertical: 8,
    color: '#6c63ff',
  },
  listContainer: {
    padding: 16,
  },
  researchCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  researchHeader: {
    marginBottom: 8,
  },
  researchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  researchDate: {
    fontSize: 14,
  },
  researchPreview: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  researchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  researchCitations: {
    fontSize: 14,
    fontWeight: '500',
  },
  viewDetailsButton: {
    backgroundColor: '#6c63ff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  viewDetailsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
});