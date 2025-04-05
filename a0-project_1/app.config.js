const path = require('path');
const fs = require('fs');

// Load environment variables from .env.development.local or .env.local if available
function loadEnvFile() {
  const envFiles = [
    '.env.development.local',  // For development with local overrides
    '.env.local',              // For local overrides
    '.env.development',        // For development defaults
    '.env'                     // For defaults
  ];

  // Loop through possible env files and use the first one that exists
  for (const file of envFiles) {
    const envPath = path.resolve(__dirname, file);
    if (fs.existsSync(envPath)) {
      console.log(`Loading environment from ${file}`);
      
      const envContent = fs.readFileSync(envPath, 'utf8');
      const env = {};
      
      // Parse the .env file contents
      envContent.split('\n').forEach(line => {
        // Skip empty lines and comments
        if (!line || line.startsWith('#')) return;
        
        // Split by first equals sign (supporting values with = signs)
        const equalIndex = line.indexOf('=');
        if (equalIndex > 0) {
          const key = line.substring(0, equalIndex).trim();
          const value = line.substring(equalIndex + 1).trim();
          
          // Remove quotes if present
          env[key] = value.replace(/^["'](.*)["']$/, '$1');
        }
      });
      
      return env;
    }
  }
  
  console.warn('No environment file found, using defaults');
  return {};
}

// Load environment variables
const env = loadEnvFile();

// Export the Expo configuration
module.exports = {
  name: "Royal Research",
  slug: "royal-research",
  // Get values from app.json as the base
  ...require('./app.json').expo,
  // Override with env variables or use defaults
  extra: {
    SUPABASE_URL: env.SUPABASE_URL || process.env.SUPABASE_URL || 'https://wurrqztgdnecgtmsisrq.supabase.co',
    SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
    N8N_WEBHOOK_URL: env.N8N_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL,
    eas: {
      projectId: "63d252ab-ce8f-4c3c-bc6e-8e8168b6ecf4"
    }
  }
}; 