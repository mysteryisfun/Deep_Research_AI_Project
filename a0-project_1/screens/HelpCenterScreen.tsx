import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { MotiView } from 'moti';
import { toast } from 'sonner-native';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "How do I start a new research?",
    answer: "To start a new research, go to the home screen and tap on 'New Research'. Follow the guided process to select your research topic and parameters."
  },
  {
    question: "How does the AI research assistant work?",
    answer: "Our AI research assistant uses advanced algorithms to analyze and synthesize information from various sources, providing you with comprehensive research results tailored to your needs."
  },
  {
    question: "Can I save my research results?",
    answer: "Yes! All your research results are automatically saved in your history. You can access them anytime from the History section in the main menu."
  },
  {
    question: "How do I change my notification settings?",
    answer: "You can manage your notification preferences in the Profile section under Settings. Toggle push notifications and in-app alerts according to your preferences."
  },
  {
    question: "Is my research data private?",
    answer: "Yes, your research data is private and secure. We use industry-standard encryption and security measures to protect your information."
  }
];

const supportCategories = [
  {
    title: "Technical Support",
    icon: "build",
    description: "Get help with technical issues and app functionality"
  },
  {
    title: "Account Support",
    icon: "person",
    description: "Assistance with account-related queries"
  },
  {
    title: "Research Help",
    icon: "science",
    description: "Get help with research tools and features"
  },
  {
    title: "Billing Support",
    icon: "payment",
    description: "Questions about payments and subscriptions"
  }
];

export default function HelpCenterScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleSupportEmail = () => {
    Linking.openURL('mailto:support@royalresearch.com')
      .catch(() => toast.error('Could not open email client'));
  };

  const handleSupportChat = () => {
    toast.info('Live chat support coming soon!');
  };

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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Help Center</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Support Actions */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          style={[styles.quickActionsContainer, { backgroundColor: theme.card }]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Support</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={[styles.quickActionButton, { backgroundColor: theme.accent + '20' }]}
              onPress={handleSupportEmail}
            >
              <MaterialIcons name="email" size={24} color={theme.accent} />
              <Text style={[styles.quickActionText, { color: theme.text }]}>Email Support</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickActionButton, { backgroundColor: theme.accent + '20' }]}
              onPress={handleSupportChat}
            >
              <MaterialIcons name="chat" size={24} color={theme.accent} />
              <Text style={[styles.quickActionText, { color: theme.text }]}>Live Chat</Text>
            </TouchableOpacity>
          </View>
        </MotiView>

        {/* Support Categories */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 100 }}
          style={[styles.categoriesContainer, { backgroundColor: theme.card }]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Support Categories</Text>
          {supportCategories.map((category, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.categoryItem, { borderBottomColor: theme.border }]}
              onPress={() => toast.info(`${category.title} support coming soon!`)}
            >
              <MaterialIcons name={category.icon as any} size={24} color={theme.accent} />
              <View style={styles.categoryContent}>
                <Text style={[styles.categoryTitle, { color: theme.text }]}>{category.title}</Text>
                <Text style={[styles.categoryDescription, { color: theme.secondaryText }]}>
                  {category.description}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={theme.secondaryText} />
            </TouchableOpacity>
          ))}
        </MotiView>

        {/* FAQ Section */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 200 }}
          style={[styles.faqContainer, { backgroundColor: theme.card }]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Frequently Asked Questions</Text>
          {faqData.map((faq, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.faqItem, { borderBottomColor: theme.border }]}
              onPress={() => setExpandedIndex(expandedIndex === index ? null : index)}
            >
              <View style={styles.faqHeader}>
                <Text style={[styles.faqQuestion, { color: theme.text }]}>{faq.question}</Text>
                <MaterialIcons 
                  name={expandedIndex === index ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                  size={24} 
                  color={theme.secondaryText} 
                />
              </View>
              {expandedIndex === index && (
                <Text style={[styles.faqAnswer, { color: theme.secondaryText }]}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
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
  quickActionsContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flex: 1,
    marginHorizontal: 8,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  categoriesContainer: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  categoryContent: {
    flex: 1,
    marginLeft: 16,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
  },
  faqContainer: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  faqItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 16,
  },
  faqAnswer: {
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
}); 