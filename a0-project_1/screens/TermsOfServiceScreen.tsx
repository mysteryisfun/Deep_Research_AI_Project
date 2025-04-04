import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { MotiView } from 'moti';

export default function TermsOfServiceScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const termsOfServiceSections = [
    {
      title: "Acceptance of Terms",
      content: "By accessing or using Royal Research, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.\n\n" +
        "These terms apply to all users, visitors, and others who access or use our service."
    },
    {
      title: "Account Registration",
      content: "To use certain features of our service, you must register for an account. You agree to:\n\n" +
        "• Provide accurate and complete information\n" +
        "• Maintain the security of your account\n" +
        "• Promptly update any changes to your information\n" +
        "• Accept responsibility for all activities under your account"
    },
    {
      title: "Use of Service",
      content: "You agree to use the service only for lawful purposes and in accordance with these Terms. You will not:\n\n" +
        "• Use the service in any way that violates applicable laws\n" +
        "• Attempt to gain unauthorized access to any part of the service\n" +
        "• Interfere with or disrupt the service\n" +
        "• Use the service for any harmful or malicious purpose"
    },
    {
      title: "Research Content",
      content: "When using our research services:\n\n" +
        "• Results are provided for informational purposes only\n" +
        "• We do not guarantee accuracy or completeness of results\n" +
        "• You are responsible for verifying information before use\n" +
        "• Content should not be used as professional advice"
    },
    {
      title: "Intellectual Property",
      content: "The service and its original content, features, and functionality are owned by Royal Research and are protected by international copyright, trademark, and other intellectual property laws.\n\n" +
        "You may not:\n" +
        "• Copy or reproduce any part of our service\n" +
        "• Modify or create derivative works\n" +
        "• Distribute or publicly display content\n" +
        "• Use our intellectual property without permission"
    },
    {
      title: "Termination",
      content: "We may terminate or suspend your account and access to the service immediately, without prior notice or liability, for any reason, including:\n\n" +
        "• Breach of these Terms\n" +
        "• Violation of any applicable laws\n" +
        "• Upon your request\n" +
        "• For service maintenance or upgrades"
    },
    {
      title: "Limitation of Liability",
      content: "Royal Research and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from:\n\n" +
        "• Your use or inability to use the service\n" +
        "• Any unauthorized access to your data\n" +
        "• Statements or conduct of any third party\n" +
        "• Any other matter relating to the service"
    }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Terms of Service</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Introduction */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={[styles.section, { backgroundColor: theme.card }]}
        >
          <Text style={[styles.introTitle, { color: theme.text }]}>
            Royal Research Terms of Service
          </Text>
          <Text style={[styles.introText, { color: theme.secondaryText }]}>
            Last updated: March 2024{"\n\n"}
            Welcome to Royal Research. These Terms of Service govern your use of our application and services. Please read these terms carefully before using our service.
          </Text>
        </MotiView>

        {/* Terms Sections */}
        {termsOfServiceSections.map((section, index) => (
          <MotiView
            key={index}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            style={[styles.section, { backgroundColor: theme.card }]}
          >
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {section.title}
            </Text>
            <Text style={[styles.sectionContent, { color: theme.secondaryText }]}>
              {section.content}
            </Text>
          </MotiView>
        ))}

        {/* Contact Information */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={[styles.section, { backgroundColor: theme.card }]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Contact Us
          </Text>
          <Text style={[styles.sectionContent, { color: theme.secondaryText }]}>
            If you have any questions about these Terms of Service, please contact us at:{"\n\n"}
            Email: legal@royalresearch.com{"\n"}
            Address: 123 Research Avenue, Innovation City, 12345
          </Text>
        </MotiView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  introText: {
    fontSize: 16,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
  },
}); 