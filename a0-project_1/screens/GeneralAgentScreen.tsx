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
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { MotiView } from 'moti';

export default function GeneralAgentScreen() {
  const navigation = useNavigation();
  
  const agentData = {
    id: '1',
    name: 'General Research Agent',
    specialty: 'General Research',
    description: 'This agent is designed for broad, general-purpose research across various domains. It provides balanced, well-rounded insights on a wide range of topics.',
    longDescription: `The General Research Agent utilizes comprehensive knowledge bases and advanced information synthesis algorithms to deliver research insights across multiple fields.

This agent excels at:
• Cross-disciplinary research that spans multiple domains
• Balanced evaluation of competing theories and approaches
• Summarizing complex topics in accessible language
• Identifying connections between disparate fields
• Providing broad overviews as well as specific details`,
    idealFor: [
      'Students working on assignments',
      'Professionals conducting quick background research',
      'Writers & Journalists looking for diverse perspectives',
      'Anyone needing a starting point for exploring unfamiliar topics',
      'Cross-disciplinary researchers seeking broad context'
    ],
    exampleResearch: [
      {
        title: 'The Evolution of Artificial Intelligence: Past, Present and Future',
        summary: 'A comprehensive overview of AI development from its theoretical foundations to cutting-edge applications.'
      },
      {
        title: 'Climate Change: Scientific Consensus and Policy Implications',
        summary: 'Analysis of climate science evidence and international policy approaches to addressing global climate challenges.'
      }
    ],
    colors: ['#396afc', '#2948ff'],
    imageUri: 'https://api.a0.dev/assets/image?text=general%20research%20with%20books%20and%20digital%20screens&aspect=16:9&seed=123'
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
                <FontAwesome5 name="brain" size={16} color="#fff" />
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
                colors={['rgba(57, 106, 252, 0.1)', 'rgba(41, 72, 255, 0.05)']}
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