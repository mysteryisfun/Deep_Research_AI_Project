import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

// Use the same theme colors as LandingScreen for consistency
const THEME_COLORS = {
  background: '#0A192F', 
  cardBackground: 'rgba(25, 45, 65, 0.9)', 
  textPrimary: '#E5E5E5',
  textSecondary: '#A0B1C8',
  accentPrimary: '#64FFDA', 
};

const LegalInfoScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { section } = route.params as { section: 'privacy' | 'terms' | 'contact' };

  const getTitle = () => {
    switch (section) {
      case 'privacy': return 'Privacy Policy';
      case 'terms': return 'Terms of Service';
      case 'contact': return 'Contact Us';
      default: return 'Legal Information';
    }
  };

  const getContent = () => {
    switch (section) {
      case 'privacy':
        return (
          <Text style={styles.content}>
            This is a placeholder for Privacy Policy content.
            {'\n\n'}
            A complete privacy policy will be implemented here.
          </Text>
        );
      case 'terms':
        return (
          <Text style={styles.content}>
            This is a placeholder for Terms of Service content.
            {'\n\n'}
            Complete terms of service will be implemented here.
          </Text>
        );
      case 'contact':
        return (
          <Text style={styles.content}>
            This is a placeholder for Contact information.
            {'\n\n'}
            Contact details will be provided here.
          </Text>
        );
      default:
        return <Text style={styles.content}>No content available for this section.</Text>;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'< Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{getTitle()}</Text>
        <View style={styles.card}>
          {getContent()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME_COLORS.background,
  },
  container: {
    flexGrow: 1,
    padding: 20,
  },
  backButton: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: THEME_COLORS.accentPrimary,
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: THEME_COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 30,
  },
  card: {
    backgroundColor: THEME_COLORS.cardBackground,
    borderRadius: 15,
    padding: 25,
    marginBottom: 20,
  },
  content: {
    fontSize: 16,
    color: THEME_COLORS.textSecondary,
    lineHeight: 24,
  },
});

export default LegalInfoScreen; 