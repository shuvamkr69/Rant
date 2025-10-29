import { useTheme } from "@/components/contexts/ThemeContext";
import TopBar from "@/components/resuables/TopBar";
import { PremiumSkeleton } from "@/components/skeletons";
import { Colors } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Premium = () => {
  const { colorScheme } = useTheme();
  const colors = Colors;
  const [isLoading, setIsLoading] = useState(true);

  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar />
      {isLoading ? (
        <PremiumSkeleton />
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Header Section with Rant+ Logo */}
          <View style={styles.headerSection}>
            <Text style={styles.tagline}>Unlock Premium Experience</Text>
            <Text style={styles.subtitle}>
              Get unlimited access to exclusive features
            </Text>
          </View>

          {/* Premium Plan Card */}
          <View style={styles.plansSection}>
            <View style={[styles.planCard, { width: screenWidth * 0.9 }]}>
              <Text style={styles.planName}>Rant+</Text>
              <Text style={styles.planDuration}>Premium Membership</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.currency}>$</Text>
                <Text style={styles.price}>9.99</Text>
                <Text style={styles.priceSubtext}>/month</Text>
              </View>

              <View style={styles.featuresContainer}>
                {[
                  "Unlimited Rants",
                  "Priority Listener Matching",
                  "Ad-Free Experience",
                  "Custom Profile Badge",
                  "Advanced Analytics",
                  "Exclusive Themes",
                  "24/7 Premium Support",
                ].map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.subscribeButton}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#b794f6", "#6b1fa8"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 80,
  },
  headerSection: {
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoGradient: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6b1fa8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 24,
    fontWeight: "700",
    color: "#b794f6",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#9BA1A6",
    textAlign: "center",
  },
  plansSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  planCard: {
    backgroundColor: "#1a1226",
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
    borderColor: "#b794f6",
    shadowColor: "#b794f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  planName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ECEDEE",
    marginBottom: 4,
    textAlign: "center",
  },
  planDuration: {
    fontSize: 16,
    color: "#9BA1A6",
    marginBottom: 20,
    textAlign: "center",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
    justifyContent: "center",
  },
  currency: {
    fontSize: 24,
    fontWeight: "600",
    color: "#b794f6",
    marginTop: 4,
  },
  price: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#b794f6",
  },
  priceSubtext: {
    fontSize: 16,
    color: "#9BA1A6",
    marginTop: 20,
    marginLeft: 4,
  },
  featuresContainer: {
    marginBottom: 24,
    gap: 12,
    alignItems: "center",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    maxWidth: "80%",
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#6b1fa8",
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  featureText: {
    fontSize: 14,
    color: "#ECEDEE",
    flex: 1,
  },
  subscribeButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  subscribeButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

export default Premium;
