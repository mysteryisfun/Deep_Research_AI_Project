import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Image,
  ImageBackground
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { MotiView } from 'moti';

export default function BusinessAgentScreen() {
  const navigation = useNavigation();
  
  const agentData = {
    id: '2',
    name: 'Business Research Agent',
    specialty: 'Business Research',
    description: 'This agent specializes in market analysis, competitive research, and financial trends. It delivers data-driven insights for business decision-making.',
    longDescription: `The Business Research Agent leverages advanced economic modeling, market analysis frameworks, and competitive intelligence tools to deliver comprehensive business insights.

This agent offers deep expertise in evaluating market conditions, analyzing industry trends, and providing competitive intelligence that helps businesses make informed strategic decisions.`,
    idealFor: [
      'Entrepreneurs evaluating new business opportunities',
      'Investors analyzing financial reports',
      'Marketers studying consumer behavior',
      'Business analysts conducting industry research',
      'Executives making strategic decisions'
    ],
    exampleResearch: [
      {
        title: 'Emerging Market Opportunities in Sustainable Energy',
        summary: 'Analysis of investment potential, regulatory frameworks, and growth forecasts for renewable energy markets globally.'
      },
      {
        title: 'E-commerce Trends and Consumer Behavior Analysis',
        summary: 'In-depth research on changing purchasing patterns, platform preferences, and conversion optimization strategies.'
      }
    ],
    colors: ['#1A2980', '#26D0CE'],
    imageUri: 'https://api.a0.dev/assets/image?text=business%20meeting%20with%20data%20charts%20and%20analytics&aspect=16:9&seed=234'
  };

  // Handle navigating to ResearchChatScreen with this agent
  const handleUseAgent = () => {
    navigation.navigate('ResearchChatScreen', { selectedAgent: agentData });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={agentData.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('AgentListScreen')}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          <MaterialIcons name="science" size={24} color="#fff" />
          <Text style={styles.headerText}>Royal Research</Text>
        </View>
        
        <View style={styles.placeholder} />
      </LinearGradient>
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Agent Banner */}
        <ImageBackground
          source={{ uri: agentData.imageUri }}
          style={styles.banner}
          imageStyle={styles.bannerImage}
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.bannerGradient}
          >
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500 }}
            >
              <Text style={styles.agentName}>{agentData.name}</Text>
              <View style={styles.specialtyContainer}>
                <MaterialIcons name="business-center" size={16} color="#fff" />
                <Text style={styles.specialtyText}>{agentData.specialty}</Text>
              </View>
            </MotiView>
          </LinearGradient>
        </ImageBackground>
        
        {/* Description Section */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 100 }}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>About This Agent</Text>
          <Text style={styles.descriptionText}>{agentData.description}</Text>
          
          {agentData.longDescription.split('\n\n').map((paragraph, index) => (
            <Text key={index} style={styles.paragraphText}>{paragraph}</Text>
          ))}
        </MotiView>
        
        {/* Ideal For Section */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 200 }}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Ideal For</Text>
          {agentData.idealFor.map((item, index) => (
            <View key={index} style={styles.idealItem}>
              <MaterialIcons name="check-circle" size={18} color={agentData.colors[0]} />
              <Text style={styles.idealItemText}>{item}</Text>
            </View>
          ))}
        </MotiView>
        
        {/* Example Research Section */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 300 }}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Example Research</Text>
          {agentData.exampleResearch.map((research, index) => (
            <View key={index} style={styles.researchItem}>
              <LinearGradient
                colors={['rgba(26, 41, 128, 0.1)', 'rgba(38, 208, 206, 0.05)']}
                style={styles.researchGradient}
              >
                <Text style={styles.researchTitle}>{research.title}</Text>
                <Text style={styles.researchSummary}>{research.summary}</Text>
              </LinearGradient>
            </View>
          ))}
        </MotiView>
      </ScrollView>
      
      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={styles.goBackButton}
          onPress={() => navigation.navigate('AgentListScreen')}
        >
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.useAgentButton}
          onPress={handleUseAgent}
        >
          <LinearGradient
            colors={agentData.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.useAgentGradient}
          >
            <Text style={styles.useAgentText}>Use This Agent</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  placeholder: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  banner: {
    height: 200,
    justifyContent: 'flex-end',
  },
  bannerImage: {
    resizeMode: 'cover',
  },
  bannerGradient: {
    padding: 20,
    paddingTop: 60,
  },
  agentName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  specialtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  specialtyText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  section: {
    padding: 20,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    marginBottom: 16,
  },
  paragraphText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
    marginBottom: 12,
  },
  idealItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  idealItemText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    flex: 1,
    marginLeft: 8,
  },
  researchItem: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  researchGradient: {
    padding: 16,
  },
  researchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  researchSummary: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  goBackButton: {
    flex: 1,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  goBackText: {
    color: '#555',
    fontSize: 16,
    fontWeight: '600',
  },
  useAgentButton: {
    flex: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  useAgentGradient: {
    padding: 14,
    alignItems: 'center',
  },
  useAgentText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});