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

  const fetchPublicResearch = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('public_research_page')
        .select(`
          id,
          research_id,
          query,
          created_at,
          status
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedData = data.map(item => ({
        research_id: item.research_id,
        query: item.query,
        result: 'Click to view full research',
        created_at: item.created_at,
      }));

      setPublicResearch(transformedData);
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchPublicResearch();
  };

  const filteredResearch = publicResearch.filter(research =>
    research.query.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderResearchItem = ({ item }: { item: PublicResearch }) => (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300 }}
    >
      <TouchableOpacity
        style={[styles.researchCard, { backgroundColor: theme.card }]}
        onPress={() => navigation.navigate('ResearchResult', { researchId: item.research_id })}
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
          <TouchableOpacity style={styles.viewDetailsButton}>
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
            {['All', 'Quantum', 'Neuroscience'].map(filter => (
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
      ) : filteredResearch.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="search-off" size={64} color={theme.secondaryText} />
          <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
            No matching research papers found
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredResearch}
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