import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface VerificationBannerProps {
  verificationStatus?: string | null;
  interviewSlot?: string | null;
}

const VerificationBanner: React.FC<VerificationBannerProps> = ({
  verificationStatus,
  interviewSlot,
}) => {
  const colors = Colors;

  if (verificationStatus !== "pending") {
    return null;
  }

  return (
    <View
      style={[
        styles.bannerContainer,
        { backgroundColor: "rgba(168, 85, 247, 0.1)", borderColor: "#a855f7" },
      ]}
    >
      <View style={styles.bannerContent}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: "rgba(168, 85, 247, 0.2)" },
          ]}
        >
          <Ionicons name="hourglass-outline" size={20} color="#a855f7" />
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.bannerTitle, { color: colors.text }]}>
            Waiting for Verification
          </Text>
          <Text style={[styles.bannerDescription, { color: colors.icon }]}>
            Your profile is being reviewed by our team
          </Text>
          {interviewSlot && (
            <Text style={[styles.bannerSlot, { color: "#a855f7" }]}>
              Interview: {interviewSlot}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  bannerDescription: {
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.8,
  },
  bannerSlot: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 4,
  },
});

export default VerificationBanner;
