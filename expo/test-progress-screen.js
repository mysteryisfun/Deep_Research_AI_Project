/**
 * Test script for the Research Progress screen functionality
 * 
 * This script tests various aspects of the Research Progress features:
 * 1. Creating topics with TEXT IDs
 * 2. Adding links directly to topics
 * 3. Adding links via the RPC function (TEXT IDs only)
 * 4. Generating sample topics for testing
 * 
 * Usage:
 *   node test-progress-screen.js           # Run basic tests only
 *   node test-progress-screen.js --generate-samples  # Run tests and generate sample topics
 *   node test-progress-screen.js --use-service-role  # Use service role key to bypass RLS
 */

const { createClient } = require('@supabase/supabase-js');
const Crypto = require('crypto');

// Supabase connection info
const supabaseUrl = process.env.SUPABASE_URL || 'https://wurrqztgdnecgtmsisrq.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cnJxenRnZG5lY2d0bXNpc3JxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMjU5NTYsImV4cCI6MjA1ODgwMTk1Nn0.Cwke6VXDuTvQmaEgk-QKw_hwhQmrpNG_34l0gob_6NA';
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cnJxenRnZG5lY2d0bXNpc3JxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzIyNTk1NiwiZXhwIjoyMDU4ODAxOTU2fQ.nwRS4NT_dV5xPyc6p4tuKs9IUFkxQpGxciRzjKS8h6Q';

// Check if we should use service role
const useServiceRole = process.argv.includes('--use-service-role');
const activeKey = useServiceRole ? serviceRoleKey : supabaseAnonKey;

// Create Supabase client
const supabase = createClient(supabaseUrl, activeKey);

// Log which auth mode we're using
console.log(`Using ${useServiceRole ? 'SERVICE ROLE KEY' : 'ANON KEY'} for database access`);

// Test research ID - you can use your own or generate a new one
const TEST_RESEARCH_ID = 'test-research-progress-' + Date.now();
const TEST_USER_ID = 'test-user-' + Date.now();

/**
 * Test creating a topic with TEXT ID
 */
const test_create_topic = async () => {
  console.log('\n🔍 Testing topic creation...');
  
  // Generate a unique topic ID for testing
  const topicId = 'test-topic-' + Date.now();
  console.log('  📌 Using test topic ID:', topicId);
  
  try {
    // First, ensure we have a research history entry
    await ensureResearchHistoryExists();
    
    // Insert a new topic
    const { data, error } = await supabase
      .from('research_progress_new')
      .insert({
        progress_id: topicId,
        research_id: TEST_RESEARCH_ID,
        user_id: TEST_USER_ID,
        topic: 'Test Topic Creation',
        created_at: new Date().toISOString()
      });
    
    if (error) throw error;
    
    console.log('  ✅ Successfully created topic');
    
    // Clean up - delete the test topic
    const { error: deleteError } = await supabase
      .from('research_progress_new')
      .delete()
      .eq('progress_id', topicId);
    
    if (deleteError) {
      console.warn('  ⚠️ Warning: Failed to delete test topic:', deleteError.message);
    } else {
      console.log('  🧹 Cleaned up test topic');
    }
    
  } catch (error) {
    console.error('  ❌ Error in test_create_topic:', error.message);
    throw error;
  }
};

/**
 * Test adding a link directly to a topic
 */
const test_add_link = async () => {
  console.log('\n🔍 Testing direct link addition...');
  
  // Generate a unique topic ID for testing
  const topicId = 'test-topic-' + Date.now();
  console.log('  📌 Using test topic ID:', topicId);
  
  try {
    // First, ensure we have a research history entry
    await ensureResearchHistoryExists();
    
    // Insert a new topic
    const { error: insertError } = await supabase
      .from('research_progress_new')
      .insert({
        progress_id: topicId,
        research_id: TEST_RESEARCH_ID,
        user_id: TEST_USER_ID,
        topic: 'Test Link Addition',
        created_at: new Date().toISOString(),
        links: []
      });
    
    if (insertError) throw insertError;
    
    // Fetch the current links for the topic
    const { data: topicData, error: fetchError } = await supabase
      .from('research_progress_new')
      .select('links')
      .eq('progress_id', topicId)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Add a new link to the links array
    const currentLinks = topicData.links || [];
    const updatedLinks = [
      ...currentLinks,
      {
        url: 'https://example.com/test-link',
        title: 'Test Link Title',
        added_at: new Date().toISOString()
      }
    ];
    
    // Update the topic with the new links
    const { error: updateError } = await supabase
      .from('research_progress_new')
      .update({ links: updatedLinks })
      .eq('progress_id', topicId);
    
    if (updateError) throw updateError;
    
    // Verify the link was added
    const { data: updatedTopic, error: verifyError } = await supabase
      .from('research_progress_new')
      .select('links')
      .eq('progress_id', topicId)
      .single();
    
    if (verifyError) throw verifyError;
    
    console.log('  ✅ Successfully added link. Updated links:', JSON.stringify(updatedTopic.links));
    
    // Clean up - delete the test topic
    const { error: deleteError } = await supabase
      .from('research_progress_new')
      .delete()
      .eq('progress_id', topicId);
    
    if (deleteError) {
      console.warn('  ⚠️ Warning: Failed to delete test topic:', deleteError.message);
    } else {
      console.log('  🧹 Cleaned up test topic');
    }
    
  } catch (error) {
    console.error('  ❌ Error in test_add_link:', error.message);
    throw error;
  }
};

/**
 * Test the add_link_to_topic RPC function with TEXT IDs
 */
const test_add_link_rpc = async () => {
  console.log('\n🔍 Testing add_link_to_topic RPC function...');
  
  try {
    console.log('\n  🧪 Testing with TEXT ID...');
    // Generate a unique topic ID for testing
    const textTopicId = 'test-topic-' + Date.now();
    console.log('  📌 Using test topic ID (TEXT):', textTopicId);
    
    // First, ensure we have a research history entry
    await ensureResearchHistoryExists();
    
    // Insert a new topic with TEXT ID
    const { error: insertError } = await supabase
      .from('research_progress_new')
      .insert({
        progress_id: textTopicId,
        research_id: TEST_RESEARCH_ID,
        user_id: TEST_USER_ID,
        topic: 'Test RPC Link Addition (TEXT ID)',
        created_at: new Date().toISOString()
      });
    
    if (insertError) throw insertError;
    console.log('  ✅ Created test topic with TEXT ID');
    
    // Print curl command for manual testing
    console.log(`  📋 Curl command for manual testing:`);
    console.log(`  curl -X POST '${supabaseUrl}/rest/v1/rpc/add_link_to_topic' \\
      -H 'apikey: ${activeKey}' \\
      -H 'Authorization: Bearer ${activeKey}' \\
      -H 'Content-Type: application/json' \\
      -d '{
        "p_progress_id": "${textTopicId}",
        "p_url": "https://example.com/rpc-test-link",
        "p_title": "RPC Test Link Title"
      }'`);
    
    // Call the RPC function to add a link with TEXT parameter
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('add_link_to_topic', {
        p_progress_id: textTopicId,
        p_url: 'https://example.com/rpc-test-link',
        p_title: 'RPC Test Link Title'
      });
    
    if (rpcError) {
      console.error('  ❌ RPC error:', rpcError);
      
      // Try to diagnose the error
      console.log('  🔍 Attempting to diagnose the error...');
      
      // Check if topic exists
      const { data: topicExists, error: checkError } = await supabase
        .from('research_progress_new')
        .select('progress_id')
        .eq('progress_id', textTopicId)
        .single();
      
      if (checkError) {
        console.error('  ❌ Topic check error:', checkError.message);
      } else {
        console.log('  ✅ Topic exists in database:', topicExists.progress_id);
      }
      
      // Show retry instruction with service role key
      if (!useServiceRole) {
        console.log('  💡 Try running with --use-service-role to bypass RLS: node test-progress-screen.js --use-service-role');
      }
      
      throw rpcError;
    }
    
    console.log('  ✅ RPC result:', rpcData);
    
    // Clean up - delete the test topic
    const { error: deleteError } = await supabase
      .from('research_progress_new')
      .delete()
      .eq('progress_id', textTopicId);
    
    if (deleteError) {
      console.warn('  ⚠️ Warning: Failed to delete test topic:', deleteError.message);
    } else {
      console.log('  🧹 Cleaned up test topic with TEXT ID');
    }
  } catch (error) {
    console.error('  ❌ Error testing RPC with TEXT ID:', error.message);
    throw error;
  }
};

/**
 * Ensure a research history entry exists for the test
 */
const ensureResearchHistoryExists = async () => {
  try {
    // Check if research history entry exists
    const { data, error } = await supabase
      .from('research_history_new')
      .select('research_id')
      .eq('research_id', TEST_RESEARCH_ID)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error;
    }
    
    // If not found, create it
    if (!data) {
      console.log('  📝 Creating research history entry for testing...');
      const { error: insertError } = await supabase
        .from('research_history_new')
        .insert({
          research_id: TEST_RESEARCH_ID,
          user_id: TEST_USER_ID,
          title: 'Test Research for Progress Screen',
          created_at: new Date().toISOString()
        });
      
      if (insertError) throw insertError;
      console.log('  ✅ Created research history entry');
    }
  } catch (error) {
    console.error('  ❌ Error ensuring research history exists:', error.message);
    throw error;
  }
};

/**
 * Generate sample topics for testing the Research Progress Screen
 */
const generateSampleTopics = async () => {
  console.log('\n🔍 Generating sample topics for testing...');
  
  const sampleTopics = [
    {
      topic: 'Natural Language Processing Overview',
      links: [
        { url: 'https://en.wikipedia.org/wiki/Natural_language_processing', title: 'Wikipedia: NLP' },
        { url: 'https://web.stanford.edu/~jurafsky/slp3/', title: 'Speech and Language Processing' }
      ]
    },
    {
      topic: 'Transformer Architecture',
      links: [
        { url: 'https://arxiv.org/abs/1706.03762', title: 'Attention Is All You Need' },
        { url: 'https://jalammar.github.io/illustrated-transformer/', title: 'The Illustrated Transformer' }
      ]
    },
    {
      topic: 'BERT and GPT Models',
      links: [
        { url: 'https://arxiv.org/abs/1810.04805', title: 'BERT: Pre-training of Deep Bidirectional Transformers' },
        { url: 'https://openai.com/research/gpt-4', title: 'GPT-4 Technical Report' }
      ]
    },
    {
      topic: 'Tokenization Techniques',
      links: [
        { url: 'https://huggingface.co/docs/transformers/tokenizer_summary', title: 'Hugging Face: Tokenizers' },
        { url: 'https://github.com/google/sentencepiece', title: 'SentencePiece Tokenizer' }
      ]
    }
  ];
  
  try {
    // First, ensure we have a research history entry
    await ensureResearchHistoryExists();
    
    let createdCount = 0;
    
    // Add each topic
    for (const sample of sampleTopics) {
      // Generate a unique topic ID
      const topicId = 'sample-topic-' + Date.now() + '-' + createdCount;
      
      // Insert the topic
      const { error } = await supabase
        .from('research_progress_new')
        .insert({
          progress_id: topicId,
          research_id: TEST_RESEARCH_ID,
          user_id: TEST_USER_ID,
          topic: sample.topic,
          created_at: new Date().toISOString(),
          links: sample.links.map(link => ({
            ...link,
            added_at: new Date().toISOString()
          }))
        });
      
      if (error) {
        console.error(`  ❌ Failed to create sample topic "${sample.topic}":`, error.message);
      } else {
        console.log(`  ✅ Created sample topic: ${sample.topic}`);
        createdCount++;
      }
      
      // Add a small delay between insertions to simulate a research flow
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n✅ Created ${createdCount} sample topics successfully!`);
    console.log(`\n📱 To view these topics, open the Research Progress screen and select:`);
    console.log(`   Research ID: ${TEST_RESEARCH_ID}`);
    
  } catch (error) {
    console.error('  ❌ Error generating sample topics:', error.message);
    throw error;
  }
};

/**
 * Print a curl command for testing the RPC function manually
 */
const showCurlExample = () => {
  console.log('\n=== CURL COMMAND EXAMPLES ===');
  
  // Example with current key
  console.log(`\nUsing ${useServiceRole ? 'service role' : 'anon'} key:`);
  console.log(`curl -X POST '${supabaseUrl}/rest/v1/rpc/add_link_to_topic' \\
  -H 'apikey: ${activeKey}' \\
  -H 'Authorization: Bearer ${activeKey}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "p_progress_id": "your-topic-id",
    "p_url": "https://example.com/test",
    "p_title": "Test Link"
  }'`);
  
  console.log('\nNOTE: Replace "your-topic-id" with an actual topic ID from your database.');
  console.log('================================');
};

// Main function to run the test
const runTest = async () => {
  try {
    console.log('🧪 Starting Research Progress screen tests...');
    
    // Show example curl command
    showCurlExample();
    
    // Call test functions here
    await test_create_topic();
    await test_add_link();
    await test_add_link_rpc();
    
    // Generate sample topics if needed
    const generateSamples = process.argv.includes('--generate-samples');
    if (generateSamples) {
      await generateSampleTopics();
    }
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
  }
};

// Run the script with proper error handling
if (require.main === module) {
  runTest()
    .then(() => {
      console.log('Tests completed. Exiting...');
      process.exit(0);
    })
    .catch(err => {
      console.error('Fatal error during test execution:', err);
      process.exit(1);
    });
} else {
  console.log('This script is being imported as a module');
}

// Export functions for reuse
module.exports = {
  test_create_topic,
  test_add_link,
  test_add_link_rpc,
  generateSampleTopics
}; 