import { supabase } from '../context/supabase';
import axios from 'axios';
import { API_CONFIG, SEARCH_CONFIG, CACHE_KEYS } from '../config/api';

// Types
export interface SearchResult {
  research_id: string;
  query: string;
  created_at: string;
  relevance_score: number;
  semantic_similarity: number;
}

export interface SearchSuggestion {
  text: string;
  type: 'query' | 'topic' | 'keyword';
  relevance: number;
}

// Cache for search results
const searchCache = new Map<string, { results: SearchResult[]; timestamp: number }>();

export class AISearchService {
  private static instance: AISearchService;
  private apiKey: string | null = null;
  
  // Define domains as a class property
  private readonly domains = {
    health: [
      // Primary health terms
      'health', 'medical', 'disease', 'patient', 'treatment', 'doctor', 'hospital', 'diagnosis',
      // Body parts and systems
      'heart', 'kidney', 'liver', 'brain', 'lungs', 'blood', 'immune', 'nervous',
      // Symptoms and conditions
      'fever', 'pain', 'infection', 'inflammation', 'virus', 'bacteria', 'cancer',
      // General health concepts
      'wellness', 'prevention', 'therapy', 'medicine', 'care', 'clinical', 'symptoms',
      // Healthcare terms
      'nurse', 'pharmacy', 'prescription', 'emergency', 'surgery', 'vaccination'
    ],
    sports: [
      // Primary sports terms
      'sports', 'athletics', 'game', 'player', 'team', 'coach', 'training', 'fitness',
      // Specific sports
      'basketball', 'football', 'soccer', 'tennis', 'baseball', 'volleyball', 'swimming',
      // Sports concepts
      'competition', 'tournament', 'championship', 'league', 'match', 'score',
      // Training terms
      'exercise', 'workout', 'conditioning', 'strength', 'agility', 'endurance',
      // Sports equipment
      'ball', 'racket', 'equipment', 'gear', 'stadium', 'court', 'field'
    ],
    technology: [
      // Primary tech terms
      'technology', 'computer', 'software', 'hardware', 'digital', 'internet', 'data',
      // Programming and development
      'programming', 'coding', 'algorithm', 'database', 'api', 'web', 'mobile',
      // Modern tech
      'ai', 'artificial intelligence', 'machine learning', 'blockchain', 'cloud',
      // Hardware terms
      'processor', 'memory', 'network', 'server', 'device', 'sensor',
      // Software terms
      'application', 'system', 'platform', 'interface', 'security', 'encryption'
    ],
    environment: [
      // Primary environmental terms
      'environment', 'climate', 'pollution', 'ecology', 'sustainability',
      // Natural elements
      'water', 'air', 'soil', 'forest', 'ocean', 'atmosphere', 'ecosystem',
      // Environmental issues
      'warming', 'emissions', 'waste', 'conservation', 'renewable', 'biodiversity',
      // Solutions
      'recycling', 'sustainable', 'green', 'clean energy', 'solar', 'wind power',
      // Climate terms
      'weather', 'temperature', 'carbon', 'greenhouse', 'ozone', 'climate change'
    ],
    research: [
      // Primary research terms
      'research', 'study', 'analysis', 'investigation', 'experiment', 'observation',
      // Research methods
      'methodology', 'hypothesis', 'theory', 'data collection', 'sampling', 'survey',
      // Academic terms
      'academic', 'scientific', 'publication', 'journal', 'peer review', 'literature',
      // Research outcomes
      'findings', 'results', 'conclusion', 'evidence', 'validation', 'proof',
      // Research processes
      'testing', 'evaluation', 'assessment', 'measurement', 'documentation'
    ]
  } as const;

  private constructor() {
    this.apiKey = API_CONFIG.MISTRAL_API_KEY;
  }

  static getInstance(): AISearchService {
    if (!AISearchService.instance) {
      AISearchService.instance = new AISearchService();
    }
    return AISearchService.instance;
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  private async getEmbeddings(text: string): Promise<number[]> {
    if (!this.apiKey) {
      throw new Error('Mistral API key not set');
    }

    try {
      const response = await axios.post(
        API_CONFIG.MISTRAL_API_URL,
        {
          model: 'mistral-large',
          messages: [
            {
              role: 'system',
              content: `You are a research search expert. Analyze the following text and generate embeddings that capture its core topic and meaning. Focus on the main subject matter.`
            },
            {
              role: 'user',
              content: `Generate embeddings for this research query: "${text}". Return only the vector as a JSON array.`
            }
          ],
          temperature: 0.1
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const embeddings = response.data.choices[0].message.content;
      return JSON.parse(embeddings);
    } catch (error) {
      console.error('Error getting embeddings:', error);
      throw error;
    }
  }

  private calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    const dotProduct = vec1.reduce((acc, val, i) => acc + val * vec2[i], 0);
    const norm1 = Math.sqrt(vec1.reduce((acc, val) => acc + val * val, 0));
    const norm2 = Math.sqrt(vec2.reduce((acc, val) => acc + val * val, 0));
    return dotProduct / (norm1 * norm2);
  }

  private calculateDomainMatchScore(query: string, content: string): number {
    // Simplified domain matching approach
    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();
    
    // Define domain keywords as simple arrays
    const healthKeywords = ['health', 'medical', 'disease', 'patient', 'treatment', 'doctor', 'hospital', 'diagnosis', 'fever', 'pain', 'infection', 'virus', 'bacteria', 'cancer', 'wellness', 'prevention', 'therapy', 'medicine', 'care', 'clinical', 'symptoms'];
    const sportsKeywords = ['sports', 'athletics', 'game', 'player', 'team', 'coach', 'training', 'fitness', 'basketball', 'football', 'soccer', 'tennis', 'baseball', 'volleyball', 'swimming', 'competition', 'tournament', 'championship', 'league', 'match', 'score'];
    const techKeywords = ['technology', 'computer', 'software', 'hardware', 'digital', 'internet', 'data', 'programming', 'coding', 'algorithm', 'database', 'api', 'web', 'mobile', 'ai', 'artificial intelligence', 'machine learning', 'blockchain', 'cloud'];
    const envKeywords = ['environment', 'climate', 'pollution', 'ecology', 'sustainability', 'water', 'air', 'soil', 'forest', 'ocean', 'atmosphere', 'ecosystem', 'warming', 'emissions', 'waste', 'conservation', 'renewable', 'biodiversity'];
    const researchKeywords = ['research', 'study', 'analysis', 'investigation', 'experiment', 'observation', 'methodology', 'hypothesis', 'theory', 'data collection', 'sampling', 'survey', 'academic', 'scientific', 'publication', 'journal', 'peer review', 'literature'];
    
    // Calculate scores for each domain
    const healthScore = this.calculateKeywordMatchScore(queryLower, contentLower, healthKeywords);
    const sportsScore = this.calculateKeywordMatchScore(queryLower, contentLower, sportsKeywords);
    const techScore = this.calculateKeywordMatchScore(queryLower, contentLower, techKeywords);
    const envScore = this.calculateKeywordMatchScore(queryLower, contentLower, envKeywords);
    const researchScore = this.calculateKeywordMatchScore(queryLower, contentLower, researchKeywords);
    
    // Return the highest domain score
    return Math.max(healthScore, sportsScore, techScore, envScore, researchScore);
  }
  
  private calculateKeywordMatchScore(query: string, content: string, keywords: string[]): number {
    let score = 0;
    const queryWords = query.split(' ');
    
    // Check for exact matches in query
    for (const word of queryWords) {
      if (keywords.includes(word)) {
        score += 2;
      }
    }
    
    // Check for keyword matches in content
    for (const keyword of keywords) {
      // Exact whole word match
      const wholeWordRegex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const wholeWordMatches = (content.match(wholeWordRegex) || []).length;
      score += wholeWordMatches * 2;
      
      // Partial word match
      if (content.includes(keyword)) {
        score += 1;
      }
    }
    
    // Normalize the score
    return Math.min(score / (keywords.length * 2), 1);
  }

  async search(query: string, options: {
    limit?: number;
    minRelevance?: number;
    useSemanticSearch?: boolean;
  } = {}): Promise<SearchResult[]> {
    const {
      limit = API_CONFIG.MAX_SEARCH_RESULTS,
      minRelevance = API_CONFIG.MIN_RELEVANCE_SCORE,
      useSemanticSearch = SEARCH_CONFIG.ENABLE_SEMANTIC_SEARCH
    } = options;

    try {
      // Get public research IDs first
      const { data: publicData, error: publicError } = await supabase
        .from('public_research_page')
        .select('research_id')
        .eq('is_public', true);

      if (publicError) throw publicError;
      const publicIds = publicData?.map(p => p.research_id) || [];

      // First, try exact matches
      const { data: exactMatches, error: exactError } = await supabase
        .from('research_history_new')
        .select('research_id, query, created_at')
        .in('research_id', publicIds)
        .ilike('query', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (exactError) throw exactError;

      // Process exact matches
      if (exactMatches && exactMatches.length > 0) {
        const processedResults = exactMatches.map(match => {
          const relevance = this.calculateRelevanceScore(query, match.query);
          const domainScore = this.calculateDomainMatchScore(query, match.query);
          const combinedScore = (relevance + domainScore) / 2;

          return {
            research_id: match.research_id,
            query: match.query,
            created_at: match.created_at || new Date().toISOString(),
            relevance_score: combinedScore,
            semantic_similarity: domainScore
          };
        });

        // Filter and sort by combined score
        return processedResults
          .filter(match => match.relevance_score >= minRelevance)
          .sort((a, b) => b.relevance_score - a.relevance_score)
          .slice(0, limit);
      }

      // If no exact matches or not enough results, try semantic search
      if (useSemanticSearch) {
        // Get a broader set of results for semantic search
        const { data: semanticMatches, error: semanticError } = await supabase
          .from('research_history_new')
          .select('research_id, query, created_at')
          .in('research_id', publicIds)
          .order('created_at', { ascending: false })
          .limit(100); // Get more results for filtering

        if (semanticError || !semanticMatches) return [];

        // Process semantic matches
        const results = await Promise.all(
          semanticMatches.map(async (entry) => {
            try {
              const relevance = this.calculateRelevanceScore(query, entry.query);
              const domainScore = this.calculateDomainMatchScore(query, entry.query);
              const combinedScore = (relevance + domainScore) / 2;

              return {
                research_id: entry.research_id,
                query: entry.query,
                created_at: entry.created_at || new Date().toISOString(),
                relevance_score: combinedScore,
                semantic_similarity: domainScore
              };
            } catch (err) {
              console.warn('Skipping entry due to error:', entry.query);
              return null;
            }
          })
        );

        return results
          .filter((r): r is SearchResult => !!r && r.relevance_score >= minRelevance)
          .sort((a, b) => b.relevance_score - a.relevance_score)
          .slice(0, limit);
      }

      return [];
    } catch (error) {
      console.error('Error performing search:', error);
      return [];
    }
  }

  private calculateRelevanceScore(query: string, content: string): number {
    const queryTerms = query.toLowerCase().split(' ');
    const contentLower = content.toLowerCase();

    const termFrequency = queryTerms.reduce((score, term) => {
      const wholeWordRegex = new RegExp(`\\b${term}\\b`, 'gi');
      const partialWordRegex = new RegExp(term, 'gi');

      const wholeWordMatches = (contentLower.match(wholeWordRegex) || []).length * 2;
      const partialMatches = (contentLower.match(partialWordRegex) || []).length;
      const exactMatchBonus = contentLower.includes(term) ? 3 : 0;

      return score + wholeWordMatches + partialMatches + exactMatchBonus;
    }, 0);

    const positionBonus = queryTerms.reduce((score, term) => {
      const position = contentLower.indexOf(term.toLowerCase());
      if (position === -1) return score;
      return score + (2 / (position + 1));
    }, 0);

    const phraseMatch = queryTerms.length > 1 ? 
      contentLower.includes(query.toLowerCase()) ? 4 : 0 : 0;

    const normalizedScore = (termFrequency + positionBonus + phraseMatch * 2) / (queryTerms.length + 2);
    return Math.min(normalizedScore, 1);
  }

  async getSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
    if (!query.trim() || !SEARCH_CONFIG.ENABLE_SUGGESTIONS) return [];

    try {
      const { data: publicData, error: publicError } = await supabase
        .from('public_research_page')
        .select('research_id')
        .eq('is_public', true);

      if (publicError) throw publicError;

      const publicIds = publicData?.map(p => p.research_id) || [];

      const { data: recentSearches, error: recentError } = await supabase
        .from('research_history_new')
        .select('query')
        .in('research_id', publicIds)
        .ilike('query', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(SEARCH_CONFIG.MAX_SUGGESTIONS);

      if (recentError) throw recentError;

      return (recentSearches || []).map(s => ({
        text: s.query,
        type: 'query' as const,
        relevance: 1
      }));
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }
}