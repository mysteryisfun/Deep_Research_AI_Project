// API Configuration
export const API_CONFIG = {
  MISTRAL_API_KEY: process.env.MISTRAL_API_KEY || 'k8foc6Qn8yb8CjavZUoJRaDTgj6LgXcY',
  MISTRAL_API_URL: 'https://api.mistral.ai/v1/chat/completions',
  VECTOR_SIMILARITY_THRESHOLD: 0.7,
  SEARCH_CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  SEARCH_DEBOUNCE_DELAY: 300, // milliseconds
  SUGGESTIONS_DEBOUNCE_DELAY: 200, // milliseconds
  MAX_SEARCH_RESULTS: 20,
  MIN_RELEVANCE_SCORE: 0.3,
};

// Search Configuration
export const SEARCH_CONFIG = {
  ENABLE_SEMANTIC_SEARCH: true,
  ENABLE_SUGGESTIONS: true,
  ENABLE_CACHING: true,
  MAX_SUGGESTIONS: 5,
};

// Cache Keys
export const CACHE_KEYS = {
  SEARCH_RESULTS: 'search_results_',
  SUGGESTIONS: 'search_suggestions_',
}; 