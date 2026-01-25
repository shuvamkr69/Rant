import BackButton from "@/components/resuables/BackButton";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const AboutScreen = () => {
  const colors = Colors;
  const APP_VERSION = "1.0.0";
  const BUILD_NUMBER = "100";

  const openURL = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  const InfoRow = ({ icon, label, value }: any) => (
    <View style={[styles.infoRow, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon} size={20} color={colors.tint} />
        <Text style={[styles.infoLabel, { color: colors.text }]}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, { color: colors.icon }]}>{value}</Text>
    </View>
  );

  const SocialButton = ({ icon, label, url }: any) => (
    <TouchableOpacity
      style={[styles.socialButton, { backgroundColor: colors.cardBackground }]}
      onPress={() => openURL(url)}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={24} color={colors.tint} />
      <Text style={[styles.socialLabel, { color: colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <BackButton screenName="About" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Logo/Icon */}
        <View style={styles.logoContainer}>
          <View style={[styles.logoCircle, { backgroundColor: colors.accent }]}>
            <Text style={styles.logoText}>R</Text>
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>Rant</Text>
          <Text style={[styles.tagline, { color: colors.icon }]}>
            Your Safe Space to Rant & Connect
          </Text>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.tint }]}>
            App Information
          </Text>
          <InfoRow
            icon="code-working-outline"
            label="Version"
            value={APP_VERSION}
          />
          <InfoRow icon="build-outline" label="Build" value={BUILD_NUMBER} />
          <InfoRow
            icon="calendar-outline"
            label="Released"
            value="January 2026"
          />
          <InfoRow
            icon="phone-portrait-outline"
            label="Platform"
            value="iOS & Android"
          />
        </View>

        {/* About the App */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.tint }]}>
            About Rant
          </Text>
          <View
            style={[
              styles.descriptionBox,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <Text style={[styles.description, { color: colors.text }]}>
              Rant is a unique platform designed to provide a safe and
              supportive environment where people can express themselves freely.
              Whether you need someone to listen to your daily struggles or want
              to help others by being a compassionate listener, Rant connects
              you with the right people.
            </Text>
            <Text style={[styles.description, { color: colors.text }]}>
              Our mission is to create a judgment-free zone where everyone can
              share their thoughts, feelings, and experiences while maintaining
              privacy and respect.
            </Text>
          </View>
        </View>

        {/* Key Features */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.tint }]}>
            Key Features
          </Text>
          <View
            style={[
              styles.featureItem,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <Ionicons
              name="chatbubbles-outline"
              size={24}
              color={colors.tint}
            />
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                Anonymous Chats
              </Text>
              <Text style={[styles.featureDesc, { color: colors.icon }]}>
                Connect with listeners without revealing your identity
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.featureItem,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={24}
              color={colors.tint}
            />
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                Verified Listeners
              </Text>
              <Text style={[styles.featureDesc, { color: colors.icon }]}>
                Chat with trained and verified listeners
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.featureItem,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <Ionicons name="star-outline" size={24} color={colors.tint} />
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                Premium Features
              </Text>
              <Text style={[styles.featureDesc, { color: colors.icon }]}>
                Unlock exclusive features with premium subscription
              </Text>
            </View>
          </View>
        </View>

        {/* Social Links */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.tint }]}>
            Connect With Us
          </Text>
          <View style={styles.socialContainer}>
            <SocialButton
              icon="logo-twitter"
              label="Twitter"
              url="https://twitter.com/rantapp"
            />
            <SocialButton
              icon="logo-instagram"
              label="Instagram"
              url="https://instagram.com/rantapp"
            />
            <SocialButton
              icon="logo-facebook"
              label="Facebook"
              url="https://facebook.com/rantapp"
            />
            <SocialButton
              icon="globe-outline"
              label="Website"
              url="https://rant.com"
            />
          </View>
        </View>

        {/* Team/Credits */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.tint }]}>
            Credits
          </Text>
          <View
            style={[
              styles.creditsBox,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <Text style={[styles.creditsTitle, { color: colors.text }]}>
              Developed by
            </Text>
            <Text style={[styles.creditsText, { color: colors.icon }]}>
              Rant Development Team
            </Text>

            <Text
              style={[
                styles.creditsTitle,
                { color: colors.text, marginTop: 16 },
              ]}
            >
              Design by
            </Text>
            <Text style={[styles.creditsText, { color: colors.icon }]}>
              Rant Design Studio
            </Text>

            <Text
              style={[
                styles.creditsTitle,
                { color: colors.text, marginTop: 16 },
              ]}
            >
              Special Thanks
            </Text>
            <Text style={[styles.creditsText, { color: colors.icon }]}>
              To all our beta testers and early supporters
            </Text>
          </View>
        </View>

        {/* Copyright */}
        <View style={styles.copyright}>
          <Text style={[styles.copyrightText, { color: colors.icon }]}>
            © 2026 Rant. All rights reserved.
          </Text>
          <Text style={[styles.copyrightText, { color: colors.icon }]}>
            Made with ❤️ for the community
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
  logoContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  logoText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    textAlign: "center",
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 15,
  },
  descriptionBox: {
    padding: 16,
    borderRadius: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  socialContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flex: 1,
    minWidth: "48%",
  },
  socialLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  creditsBox: {
    padding: 20,
    borderRadius: 12,
  },
  creditsTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  creditsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  copyright: {
    alignItems: "center",
    paddingVertical: 20,
  },
  copyrightText: {
    fontSize: 13,
    marginBottom: 4,
  },
});

export default AboutScreen;
