import BackButton from "@/components/resuables/BackButton";
import { Colors } from "@/constants/theme";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TermsAndConditions = () => {
  const colors = Colors;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <BackButton screenName="Terms & Conditions" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>
          Terms & Conditions
        </Text>
        <Text style={[styles.lastUpdated, { color: colors.icon }]}>
          Last Updated: January 22, 2026
        </Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.tint }]}>
            1. Acceptance of Terms
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            By accessing and using Rant ("the App"), you accept and agree to be
            bound by the terms and provision of this agreement. If you do not
            agree to these Terms & Conditions, please do not use the App.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.tint }]}>
            2. Use of Service
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            Rant provides a platform for users to connect with listeners for
            emotional support and casual conversations. You agree to:
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Use the service in a respectful and lawful manner
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Not engage in harassment, bullying, or abusive behavior
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Not share inappropriate, offensive, or illegal content
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Maintain the confidentiality of your account credentials
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Not impersonate others or misrepresent your identity
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.tint }]}>
            3. User Accounts
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            You are responsible for maintaining the confidentiality of your
            account and password. You agree to accept responsibility for all
            activities that occur under your account. We reserve the right to
            suspend or terminate accounts that violate these terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.tint }]}>
            4. Content and Conduct
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            Users are solely responsible for the content they share. We do not
            endorse or guarantee the accuracy of user-generated content. We
            reserve the right to remove any content that violates our community
            guidelines or these terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.tint }]}>
            5. Premium Services
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            Certain features may require a premium subscription. Payment terms
            will be clearly displayed before purchase. Subscriptions
            automatically renew unless cancelled before the renewal date.
            Refunds are subject to our refund policy and applicable laws.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.tint }]}>
            6. Privacy and Data
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            Your privacy is important to us. Please review our Privacy Policy to
            understand how we collect, use, and protect your personal
            information. By using the App, you consent to our data practices as
            described in the Privacy Policy.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.tint }]}>
            7. Intellectual Property
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            All content, features, and functionality of the App, including but
            not limited to text, graphics, logos, and software, are owned by
            Rant or its licensors and are protected by copyright, trademark, and
            other intellectual property laws.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.tint }]}>
            8. Limitation of Liability
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            Rant is not a substitute for professional mental health services.
            The App is provided "as is" without warranties of any kind. We are
            not liable for any damages arising from your use of the service. In
            case of mental health emergencies, please contact professional
            services or emergency hotlines.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.tint }]}>
            9. Termination
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            We may terminate or suspend your account immediately, without prior
            notice or liability, for any reason, including breach of these
            Terms. Upon termination, your right to use the service will cease
            immediately.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.tint }]}>
            10. Changes to Terms
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            We reserve the right to modify these terms at any time. We will
            notify users of any material changes. Your continued use of the App
            after such modifications constitutes acceptance of the updated
            terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.tint }]}>
            11. Governing Law
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            These Terms shall be governed by and construed in accordance with
            the laws of the jurisdiction in which Rant operates, without regard
            to its conflict of law provisions.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.tint }]}>
            12. Contact Information
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            If you have any questions about these Terms & Conditions, please
            contact us at:
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.tint }]}>
            Email: legal@rant.com
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.tint }]}>
            Address: [Your Company Address]
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.icon }]}>
            By using Rant, you acknowledge that you have read, understood, and
            agree to be bound by these Terms & Conditions.
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
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 14,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 15,
    lineHeight: 24,
    marginLeft: 8,
    marginBottom: 4,
  },
  footer: {
    marginTop: 16,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(107, 31, 168, 0.1)",
  },
  footerText: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: "italic",
  },
});

export default TermsAndConditions;
