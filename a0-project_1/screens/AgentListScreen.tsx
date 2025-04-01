import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ImageBackground,
  ScrollView,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { MotiView } from 'moti';

const agentData = [
  {
    id: '1',
    name: 'General Research Agent',
    specialty: 'General Research',
    description: 'Handles a broad range of research queries across various topics.',
    complexity: 4,
    accuracy: 4.0,
    imageUri: 'https://api.a0.dev/assets/image?text=general%20research%20agent&aspect=1:1&seed=101',
  },
  {
    id: '2',
    name: 'Business Research Agent',
    specialty: 'Business Research',
    description: 'Expert in market trends and business research strategies.',
    complexity: 3.8,
    accuracy: 4.2,
    imageUri: 'https://api.a0.dev/assets/image?text=business%20research%20agent&aspect=1:1&seed=202',
  },
  {
    id: '3',
    name: 'Health & Biology Research Agent',
    specialty: 'Health & Biology',
    description: 'Specializes in healthcare studies and biological research.',
    complexity: 4.5,
    accuracy: 4.3,
    imageUri: 'https://api.a0.dev/assets/image?text=health%20biology%20research%20agent&aspect=1:1&seed=303',
  },
  {
    id: '4',
    name: 'Financial Research Agent',
    specialty: 'Financial Research',
    description: 'Focuses on financial analysis and economic research.',
    complexity: 4.0,
    accuracy: 4.1,
    imageUri: 'https://api.a0.dev/assets/image?text=financial%20research%20agent&aspect=1:1&seed=404',
  },
];

const AgentCard = ({ agent, index }) => {
  const navigation = useNavigation();
  
  return (
    <MotiView
      from={{ opacity: 0, translateY: 30 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ 
        type: 'timing', 
        duration: 600,
        delay: index * 150
      }}
      style={styles.agentCard}
    >
      <View style={styles.agentImageContainer}>
        <Image 
          source={{ uri: agent.imageUri }}
          style={styles.agentImage}
        />
        <View style={styles.agentSpecialtyBadge}>
          <Text style={styles.agentSpecialtyText}>{agent.specialty}</Text>
        </View>
      </View>
      
      <View style={styles.agentDetails}>
        <Text style={styles.agentName}>{agent.name}</Text>
        
        <Text style={styles.agentDescription}>
          {agent.description}
        </Text>
        
        <View style={styles.agentStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Complexity</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map(star => (
                <Ionicons 
                  key={star}
                  name={star <= Math.floor(agent.complexity) ? "star" : star <= agent.complexity ? "star-half" : "star-outline"}
                  size={14}
                  color="#6c63ff"
                  style={styles.starIcon}
                />
              ))}
            </View>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Accuracy</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map(star => (
                <Ionicons 
                  key={star}
                  name={star <= Math.floor(agent.accuracy) ? "star" : star <= agent.accuracy ? "star-half" : "star-outline"}
                  size={14}
                  color="#6c63ff"
                  style={styles.starIcon}
                />
              ))}
            </View>
          </View>
        </View>
        
        <View style={styles.agentActions}>        <TouchableOpacity 
          style={styles.viewButton}          onPress={() => {
            // Navigate to the appropriate agent screen based on agent specialty
            const screenMap = {
              'General Research': 'GeneralAgentScreen',
              'Business Research': 'BusinessAgentScreen',
              'Health & Biology': 'HealthAgentScreen',
              'Financial Research': 'FinancialAgentScreen'
            };
            
            const screenName = screenMap[agent.specialty] || 'GeneralAgentScreen';
            navigation.navigate(screenName);
          }}
        >
          <Text style={styles.viewButtonText}>Read More</Text>
        </TouchableOpacity>          <TouchableOpacity 
            style={styles.selectButton}
            onPress={() => navigation.navigate('ResearchChatScreen', { selectedAgent: agent })}
          >
          <LinearGradient
            colors={['#4A00E0', '#8E2DE2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.selectButtonGradient}
          >
            <Text style={styles.selectButtonText}>Use This Agent</Text>
          </LinearGradient>
        </TouchableOpacity>
        </View>
      </View>
    </MotiView>
  );
};

export default function AgentListScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDarkMode ? "light" : "light"} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.logoContainer}>
          <MaterialIcons name="science" size={24} color="#fff" />
          <Text style={styles.logoText}>Royal Research</Text>
        </View>
        
        <View style={styles.rightPlaceholder} />
      </View>
      
      <ImageBackground 
        source={{ uri: 'https://api.a0.dev/assets/image?text=futuristic%20AI%20lab%20with%20robots%20and%20scientists&aspect=16:9&seed=555' }}
        style={styles.bannerImage}
        imageStyle={styles.bannerImageStyle}
      >
        <LinearGradient
          colors={['rgba(58, 28, 113, 0.7)', 'rgba(58, 28, 113, 0.85)']}
          style={styles.bannerGradient}
        >
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 800 }}
          >
            <Text style={styles.screenTitle}>Research Agents</Text>
            <Text style={styles.screenSubtitle}>
              Select a specialized AI agent for your research needs
            </Text>
          </MotiView>
        </LinearGradient>
      </ImageBackground>
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
          style={styles.introContainer}
        >
          <View style={styles.introCard}>
            <FontAwesome5 name="robot" size={24} color="#6c63ff" />
            <Text style={styles.introTitle}>AI Research Assistants</Text>
            <Text style={styles.introText}>
              Our specialized AI agents help you accelerate research in various scientific fields. 
              Select an agent that matches your research domain.
            </Text>
          </View>
        </MotiView>
        
        {agentData.map((agent, index) => (
          <AgentCard key={agent.id} agent={agent} index={index} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({  container: {
    flex: 1,
    // Default background; dynamic theme will be applied inline in JSX
    backgroundColor: '#f8f9fa',
  },  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    // Default accent color; inline override in JSX uses theme.accent if needed
    backgroundColor: '#6c63ff',
    zIndex: 10,
  },
  backButton: {
    padding: 6,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  rightPlaceholder: {
    width: 36,
    height: 36,
  },
  bannerImage: {
    height: 140,
    width: '100%',
  },
  bannerImageStyle: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  bannerGradient: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  screenSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  introContainer: {
    marginBottom: 20,
  },
  introCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginVertical: 10,
  },
  introText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  agentCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  agentImageContainer: {
    position: 'relative',
    height: 150,
  },  agentImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  agentSpecialtyBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(108, 99, 255, 0.3)',
    backdropFilter: 'blur(4px)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.5)',
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  agentSpecialtyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },  agentDetails: {
    padding: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
  },
  agentName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(108, 99, 255, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  agentDescription: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
    marginBottom: 16,
  },
  agentStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  starIcon: {
    marginRight: 2,
  },
  agentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  viewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#6c63ff',
    borderRadius: 8,
  },
  viewButtonText: {
    color: '#6c63ff',
    fontWeight: '600',
  },
  selectButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  selectButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  selectButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});