import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Types for our environment variables
interface EnvVariables {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  N8N_WEBHOOK_URL: string;
}

// Function to get environment variables from different sources
function getEnvironmentVariable(name: keyof EnvVariables): string | undefined {
  // Try to get from Expo Constants first (app.config.js or app.json extra)
  const expoConstant = Constants.expoConfig?.extra?.[name];
  if (expoConstant) return expoConstant as string;

  // Try to get from process.env (for Expo dev client and bare workflow)
  if (process.env[`EXPO_PUBLIC_${name}`]) {
    return process.env[`EXPO_PUBLIC_${name}`] as string;
  }

  // Try to get from imported @env (for backward compatibility)
  try {
    // Only attempt to import if we need to
    const envModule = require('@env');
    if (envModule && envModule[name]) {
      return envModule[name];
    }
  } catch (error) {
    // Silently fail if @env is not available or doesn't contain the variable
  }

  // Return undefined if not found
  return undefined;
}

// Create config object with getters to ensure fresh values and prevent mutations
const config = {
  get SUPABASE_URL(): string {
    const url = getEnvironmentVariable('SUPABASE_URL');
    if (!url) {
      console.warn('Missing SUPABASE_URL environment variable');
      return ''; // Return empty string to prevent undefined errors
    }
    return url;
  },
  
  get SUPABASE_ANON_KEY(): string {
    const key = getEnvironmentVariable('SUPABASE_ANON_KEY');
    if (!key) {
      console.warn('Missing SUPABASE_ANON_KEY environment variable');
      return ''; // Return empty string to prevent undefined errors
    }
    return key;
  },
  
  get N8N_WEBHOOK_URL(): string {
    const url = getEnvironmentVariable('N8N_WEBHOOK_URL');
    if (!url) {
      // This is a soft warning as webhook may be optional
      console.log('N8N_WEBHOOK_URL environment variable not defined');
      return ''; // Return empty string to prevent undefined errors
    }
    return url;
  },

  // Helper method to check if all required variables are set
  isConfigValid(): boolean {
    return Boolean(this.SUPABASE_URL && this.SUPABASE_ANON_KEY);
  },

  // Debug method to log config status (without revealing sensitive values)
  logConfigStatus(): void {
    if (__DEV__) {
      console.log('Environment Configuration Status:');
      console.log(`- SUPABASE_URL: ${this.SUPABASE_URL ? '✓ Set' : '✗ Missing'}`);
      console.log(`- SUPABASE_ANON_KEY: ${this.SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing'}`);
      console.log(`- N8N_WEBHOOK_URL: ${this.N8N_WEBHOOK_URL ? '✓ Set' : '✕ Not set (optional)'}`);
      console.log(`- Platform: ${Platform.OS}`);
      console.log(`- Dev Mode: ${__DEV__ ? 'Yes' : 'No'}`);
    }
  }
};

export default config; 