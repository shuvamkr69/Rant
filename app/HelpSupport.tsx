import BackButton from "@/components/resuables/BackButton";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const HelpSupport = () => {
  const colors = Colors;
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const openURL = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  const sendEmail = () => {
    Linking.openURL("mailto:support@rant.com");
  };

  const callSupport = () => {
    Alert.alert("Call Support", "Would you like to call our support team?", [
      { text: "Cancel", style: "cancel" },
      { text: "Call", onPress: () => Linking.openURL("tel:+1234567890") },
    ]);
  };

  const FAQItem = ({ id, question, answer }: any) => {
    const isExpanded = expandedFAQ === id;

    return (
      <TouchableOpacity
        style={[styles.faqItem, { backgroundColor: colors.cardBackground }]}
        onPress={() => setExpandedFAQ(isExpanded ? null : id)}
        activeOpacity={0.7}
      >
        <View style={styles.faqHeader}>
          <Text style={[styles.faqQuestion, { color: colors.text }]}>
            {question}
          </Text>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.icon}
          />
        </View>
        {isExpanded && (
          <Text style={[styles.faqAnswer, { color: colors.icon }]}>
            {answer}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const ContactOption = ({ icon, title, subtitle, onPress, color }: any) => (
    <TouchableOpacity
      style={[styles.contactOption, { backgroundColor: colors.cardBackground }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[styles.contactIconContainer, { backgroundColor: color + "20" }]}
      >
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.contactText}>
        <Text style={[styles.contactTitle, { color: colors.text }]}>
          {title}
        </Text>
        <Text style={[styles.contactSubtitle, { color: colors.icon }]}>
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.icon} />
    </TouchableOpacity>
  );

  const faqs = [
    {
      id: 1,
      question: "How do I create an account?",
      answer:
        'Tap on "Register" on the login screen, fill in your details including email, username, and password. After registration, verify your email to activate your account.',
    },
    {
      id: 2,
      question: "Is my conversation private and secure?",
      answer:
        "Yes! All conversations are encrypted end-to-end. We prioritize your privacy and do not share your personal information or chat content with third parties.",
    },
    {
      id: 3,
      question: "How do I become a listener?",
      answer:
        "Go to your profile settings and apply to become a listener. You'll need to complete a verification process and agree to our listener guidelines.",
    },
    {
      id: 4,
      question: "What are the premium features?",
      answer:
        "Premium features include unlimited chat sessions, priority matching with listeners, advanced filters, ad-free experience, and exclusive badges.",
    },
    {
      id: 5,
      question: "How do I report inappropriate behavior?",
      answer:
        'Tap the three dots menu in any chat and select "Report User". Provide details about the incident, and our moderation team will review it within 24 hours.',
    },
    {
      id: 6,
      question: "Can I delete my account?",
      answer:
        "Yes, go to Settings > Account > Delete Account. Note that this action is permanent and cannot be undone. All your data will be deleted.",
    },
    {
      id: 7,
      question: "How do I cancel my premium subscription?",
      answer:
        "Go to Settings > Premium > Manage Subscription. You can cancel anytime, and you'll retain premium features until the end of your billing period.",
    },
    {
      id: 8,
      question: "What should I do in case of an emergency?",
      answer:
        "Rant is not a crisis service. If you're in immediate danger or experiencing a mental health emergency, please contact emergency services (911) or a crisis hotline immediately.",
    },
    {
      id: 9,
      question: "How do I block someone?",
      answer:
        'Open the chat with the user, tap the three dots menu, and select "Block User". They won\'t be able to contact you or see your profile anymore.',
    },
    {
      id: 10,
      question: "Can I use Rant anonymously?",
      answer:
        "Yes! You can chat without revealing your real identity. However, you need to create an account with an email for security purposes.",
    },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <BackButton screenName="Help & Support" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            How can we help you?
          </Text>
          <Text style={[styles.subtitle, { color: colors.icon }]}>
            Find answers to common questions or contact our support team
          </Text>
        </View>

        {/* Quick Contact Options */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.tint }]}>
            Contact Us
          </Text>
          <ContactOption
            icon="mail-outline"
            title="Email Support"
            subtitle="support@rant.com"
            onPress={sendEmail}
            color="#b794f6"
          />
          <ContactOption
            icon="call-outline"
            title="Call Us"
            subtitle="+1 (234) 567-890"
            onPress={callSupport}
            color="#4CAF50"
          />
          <ContactOption
            icon="chatbubble-ellipses-outline"
            title="Live Chat"
            subtitle="Chat with our support team"
            onPress={() =>
              Alert.alert("Coming Soon", "Live chat will be available soon!")
            }
            color="#FF9800"
          />
          <ContactOption
            icon="logo-twitter"
            title="Twitter Support"
            subtitle="@RantSupport"
            onPress={() => openURL("https://twitter.com/rantsupport")}
            color="#1DA1F2"
          />
        </View>

        {/* Emergency Resources */}
        <View
          style={[
            styles.emergencyBox,
            { backgroundColor: "#ff444420", borderColor: "#ff4444" },
          ]}
        >
          <View style={styles.emergencyHeader}>
            <Ionicons name="warning-outline" size={24} color="#ff4444" />
            <Text style={[styles.emergencyTitle, { color: "#ff4444" }]}>
              Crisis Resources
            </Text>
          </View>
          <Text style={[styles.emergencyText, { color: colors.text }]}>
            If you're in immediate danger or experiencing a mental health
            crisis:
          </Text>
          <TouchableOpacity
            style={[styles.emergencyButton, { backgroundColor: "#ff4444" }]}
            onPress={() => Linking.openURL("tel:988")}
          >
            <Ionicons name="call" size={20} color="#fff" />
            <Text style={styles.emergencyButtonText}>
              Call 988 - Suicide & Crisis Lifeline
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.emergencyButton,
              { backgroundColor: "#ff4444", marginTop: 8 },
            ]}
            onPress={() => Linking.openURL("tel:911")}
          >
            <Ionicons name="call" size={20} color="#fff" />
            <Text style={styles.emergencyButtonText}>
              Call 911 - Emergency Services
            </Text>
          </TouchableOpacity>
        </View>

        {/* FAQs */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.tint }]}>
            Frequently Asked Questions
          </Text>
          {faqs.map((faq) => (
            <FAQItem key={faq.id} {...faq} />
          ))}
        </View>

        {/* Additional Resources */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.tint }]}>
            More Resources
          </Text>
          <TouchableOpacity
            style={[
              styles.resourceItem,
              { backgroundColor: colors.cardBackground },
            ]}
            onPress={() => openURL("https://rant.com/help")}
            activeOpacity={0.7}
          >
            <Ionicons name="book-outline" size={20} color={colors.tint} />
            <Text style={[styles.resourceText, { color: colors.text }]}>
              User Guide
            </Text>
            <Ionicons name="open-outline" size={16} color={colors.icon} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.resourceItem,
              { backgroundColor: colors.cardBackground },
            ]}
            onPress={() => openURL("https://rant.com/community")}
            activeOpacity={0.7}
          >
            <Ionicons name="people-outline" size={20} color={colors.tint} />
            <Text style={[styles.resourceText, { color: colors.text }]}>
              Community Guidelines
            </Text>
            <Ionicons name="open-outline" size={16} color={colors.icon} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.resourceItem,
              { backgroundColor: colors.cardBackground },
            ]}
            onPress={() => openURL("https://rant.com/safety")}
            activeOpacity={0.7}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color={colors.tint}
            />
            <Text style={[styles.resourceText, { color: colors.text }]}>
              Safety Tips
            </Text>
            <Ionicons name="open-outline" size={16} color={colors.icon} />
          </TouchableOpacity>
        </View>

        {/* Footer Message */}
        <View
          style={[styles.footerBox, { backgroundColor: colors.cardBackground }]}
        >
          <Ionicons name="heart" size={24} color="#ff4444" />
          <Text style={[styles.footerText, { color: colors.text }]}>
            We're here to help! Don't hesitate to reach out if you need
            assistance.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 10,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  contactOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  contactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  contactText: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  contactSubtitle: {
    fontSize: 14,
  },
  emergencyBox: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 28,
  },
  emergencyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  emergencyText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  emergencyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 10,
  },
  emergencyButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  faqItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
  },
  resourceItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  resourceText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  footerBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 12,
    gap: 12,
  },
  footerText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
});

export default HelpSupport;
