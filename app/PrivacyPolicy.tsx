import BackButton from "@/components/resuables/BackButton";
import { Colors } from "@/constants/theme";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PrivacyPolicy = () => {
  const colors = Colors;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <BackButton screenName="Privacy Policy" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>
          Privacy Policy
        </Text>
        <Text style={[styles.lastUpdated, { color: colors.icon }]}>
          Last Updated: January 22, 2026
        </Text>

        <View style={styles.section}>
          <Text style={[styles.introText, { color: colors.text }]}>
            At Rant, we take your privacy seriously. This Privacy Policy
            explains how we collect, use, disclose, and safeguard your
            information when you use our mobile application.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.tint }]}>
            1. Information We Collect
          </Text>
          <Text style={[styles.subTitle, { color: colors.text }]}>
            Personal Information
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            When you register for an account, we may collect:
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Name and username
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Email address
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Profile information (age, gender, interests)
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Profile picture (optional)
          </Text>

          <Text style={[styles.subTitle, { color: colors.text }]}>
            Usage Data
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            We automatically collect certain information when you use the App:
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Device information (model, OS version, unique identifiers)
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Usage statistics (features used, time spent, interactions)
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Log data (IP address, access times, app crashes)
          </Text>

          <Text style={[styles.subTitle, { color: colors.text }]}>
            Communication Data
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            We collect content from your conversations to provide the service,
            but we prioritize your privacy and implement measures to protect
            sensitive information.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.tint }]}>
            2. How We Use Your Information
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            We use the collected information to:
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Provide, operate, and maintain the App
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Improve and personalize your experience
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Match you with appropriate listeners
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Send notifications and updates
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Process payments and transactions
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Detect and prevent fraud or abuse
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Comply with legal obligations
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Communicate with you about the service
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.tint }]}>
            3. Information Sharing and Disclosure
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            We do not sell your personal information. We may share your
            information only in the following circumstances:
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • With other users as necessary to provide the service
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • With service providers who assist in operating the App
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • When required by law or to protect rights and safety
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • In connection with a business transfer or acquisition
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • With your explicit consent
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.tint }]}>
            4. Data Security
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            We implement industry-standard security measures to protect your
            information, including:
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Encryption of data in transit and at rest
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Regular security audits and updates
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Access controls and authentication
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Secure data storage practices
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            However, no method of transmission over the internet is 100% secure,
            and we cannot guarantee absolute security.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.tint }]}>
            5. Data Retention
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            We retain your information for as long as necessary to provide the
            service and comply with legal obligations. You may request deletion
            of your account and associated data at any time through the app
            settings.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.tint }]}>
            6. Your Privacy Rights
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            You have the right to:
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Access your personal information
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Correct inaccurate information
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Request deletion of your data
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Opt-out of marketing communications
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Export your data
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Withdraw consent for data processing
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.tint }]}>
            7. Children's Privacy
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            Our service is not intended for users under the age of 13. We do not
            knowingly collect personal information from children under 13. If
            you are a parent or guardian and believe your child has provided us
            with personal information, please contact us.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.tint }]}>
            8. Third-Party Services
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            The App may contain links to third-party services. We are not
            responsible for the privacy practices of these services. We
            encourage you to review their privacy policies.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.tint }]}>
            9. Cookies and Tracking Technologies
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            We use cookies and similar tracking technologies to enhance your
            experience, analyze usage patterns, and deliver personalized
            content. You can manage your cookie preferences through your device
            settings.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.tint }]}>
            10. International Data Transfers
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            Your information may be transferred to and processed in countries
            other than your own. We ensure appropriate safeguards are in place
            to protect your information in accordance with this Privacy Policy.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.tint }]}>
            11. Changes to This Privacy Policy
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            We may update this Privacy Policy from time to time. We will notify
            you of any material changes by posting the new Privacy Policy on
            this page and updating the "Last Updated" date. Your continued use
            of the App after changes constitutes acceptance of the updated
            policy.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.tint }]}>
            12. Contact Us
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            If you have any questions or concerns about this Privacy Policy,
            please contact us:
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.tint }]}>
            Email: privacy@rant.com
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.tint }]}>
            Address: [Your Company Address]
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.tint }]}>
            Phone: [Your Contact Number]
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.icon }]}>
            Your privacy matters to us. We are committed to protecting your
            personal information and being transparent about our data practices.
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
    marginBottom: 20,
  },
  introText: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 8,
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
    textAlign: "center",
  },
});

export default PrivacyPolicy;
