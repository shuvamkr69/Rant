import { useTheme } from "@/components/contexts/ThemeContext";
import { Colors } from "@/constants/theme";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, StyleSheet, View } from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const PremiumSkeleton = () => {
  const { colorScheme } = useTheme();
  const colors = Colors;
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Shimmer effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  const skeletonColor = "#2d1f3d";
  const cardColor = "#1a1226";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.contentContainer}>
        {/* Header Section Skeleton */}
        <View style={styles.headerSection}>
          {/* Logo Skeleton */}
          <Animated.View
            style={[
              styles.logoSkeleton,
              {
                opacity,
              },
            ]}
          />

          {/* Tagline Skeleton */}
          <Animated.View
            style={[
              styles.taglineSkeleton,
              { backgroundColor: skeletonColor, opacity },
            ]}
          />

          {/* Subtitle Skeleton */}
          <Animated.View
            style={[
              styles.subtitleSkeleton,
              { backgroundColor: skeletonColor, opacity },
            ]}
          />
        </View>

        {/* Premium Plan Skeleton */}
        <View style={styles.plansSection}>
          <Animated.View
            style={[
              styles.planCard,
              {
                backgroundColor: cardColor,
                opacity,
                width: screenWidth * 0.9,
              },
            ]}
          >
            {/* Plan name */}
            <Animated.View
              style={[
                styles.planNameSkeleton,
                { backgroundColor: skeletonColor, opacity },
              ]}
            />

            {/* Duration */}
            <Animated.View
              style={[
                styles.durationSkeleton,
                { backgroundColor: skeletonColor, opacity },
              ]}
            />

            {/* Price */}
            <Animated.View
              style={[
                styles.priceSkeleton,
                { backgroundColor: skeletonColor, opacity },
              ]}
            />

            {/* Features */}
            <View style={styles.featuresContainer}>
              {[0, 1, 2, 3, 4, 5, 6].map((featureIndex) => (
                <View key={featureIndex} style={styles.featureRow}>
                  <Animated.View
                    style={[
                      styles.checkmarkSkeleton,
                      { backgroundColor: skeletonColor, opacity },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.featureSkeleton,
                      { backgroundColor: skeletonColor, opacity },
                    ]}
                  />
                </View>
              ))}
            </View>

            {/* Button */}
            <Animated.View
              style={[
                styles.buttonSkeleton,
                { backgroundColor: skeletonColor, opacity },
              ]}
            />
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 80,
  },
  contentContainer: {
    flex: 1,
  },
  headerSection: {
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
    gap: 16,
  },
  logoSkeleton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#2d1f3d",
  },
  taglineSkeleton: {
    width: 220,
    height: 28,
    borderRadius: 8,
  },
  subtitleSkeleton: {
    width: 180,
    height: 16,
    borderRadius: 6,
  },
  plansSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  planCard: {
    borderRadius: 24,
    padding: 24,
    gap: 16,
    borderWidth: 2,
    borderColor: "#2d1f3d",
  },
  planNameSkeleton: {
    width: "40%",
    height: 36,
    borderRadius: 8,
  },
  durationSkeleton: {
    width: "50%",
    height: 18,
    borderRadius: 6,
  },
  priceSkeleton: {
    width: "50%",
    height: 48,
    borderRadius: 10,
  },
  featuresContainer: {
    gap: 12,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkmarkSkeleton: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  featureSkeleton: {
    flex: 1,
    height: 16,
    borderRadius: 6,
  },
  buttonSkeleton: {
    width: "100%",
    height: 52,
    borderRadius: 16,
  },
});

export default PremiumSkeleton;
