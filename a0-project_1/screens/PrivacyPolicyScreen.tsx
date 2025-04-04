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

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const privacyPolicySections = [
    {
      title: "Information We Collect",
      content: "We collect information that you provide directly to us, including but not limited to:\n\n" +
        "• Account Information: When you create an account, we collect your name, email address, and password\n" +
        "• Research Data: Information related to your research queries and results\n" +
        "• Usage Data: How you interact with our app and services\n" +
        "• Device Information: Technical data about the device you use to access our services"
    },
    {
      title: "How We Use Your Information",
      content: "We use the collected information to:\n\n" +
        "• Provide and maintain our services\n" +
        "• Improve and personalize your experience\n" +
        "• Communicate with you about updates and changes\n" +
        "• Ensure the security of our platform\n" +
        "• Comply with legal obligations"
    },
    {
      title: "Data Security",
      content: "We implement appropriate technical and organizational measures to protect your personal information, including:\n\n" +
        "• Encryption of data in transit and at rest\n" +
        "• Regular security assessments\n" +
        "• Access controls and authentication measures\n" +
        "• Secure data storage practices"
    },
    {
      title: "Data Sharing",
      content: "We do not sell your personal information. We may share your information with:\n\n" +
        "• Service providers who assist in operating our platform\n" +
        "• Law enforcement when required by law\n" +
        "• Other parties with your explicit consent"
    },
    {
      title: "Your Rights",
      content: "You have the right to:\n\n" +
        "• Access your personal information\n" +
        "• Correct inaccurate data\n" +
        "• Request deletion of your data\n" +
        "• Opt-out of certain data processing activities\n" +
        "• Receive a copy of your data"
    },
    {
      title: "Updates to Privacy Policy",
      content: "We may update this Privacy Policy from time to time. We will notify you of any changes by:\n\n" +
        "• Posting the new Privacy Policy on this page\n" +
        "• Sending you an email notification\n" +
        "• Displaying a notice in the app"
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Privacy Policy</Text>
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
            Royal Research Privacy Policy
          </Text>
          <Text style={[styles.introText, { color: theme.secondaryText }]}>
            Last updated: March 2024{"\n\n"}
            We at Royal Research value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our application.
          </Text>
        </MotiView>

        {/* Policy Sections */}
        {privacyPolicySections.map((section, index) => (
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
            If you have any questions about this Privacy Policy, please contact us at:{"\n\n"}
            Email: privacy@royalresearch.com{"\n"}
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