import { useTheme } from "@/components/contexts/ThemeContext";
import { Colors } from "@/constants/theme";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, StyleSheet, View } from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const MyWalletSkeleton = () => {
  const { colorScheme } = useTheme();
  const colors = Colors;
  const shimmerAnimation = useRef(new Animated.Value(0)).current;
  const floatAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnimation, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnimation, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const translateY = floatAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const skeletonColor = "#2a2a2a";
  const cardColor = "#1a1a1a";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.centeredContainer}>
        {/* Floating Card Skeleton */}
        <Animated.View
          style={[
            styles.cardContainer,
            {
              transform: [{ translateY }],
              width: Math.min(screenWidth * 1.18, 800),
              height: Math.min(screenHeight * 0.54, 520),
            },
          ]}
        >
          <Animated.View
            style={[styles.card, { backgroundColor: skeletonColor, opacity }]}
          >
            {/* Card chip */}
            <Animated.View
              style={[styles.cardChip, { backgroundColor: cardColor, opacity }]}
            />

            {/* Card number bars */}
            <View style={styles.cardNumberContainer}>
              <Animated.View
                style={[
                  styles.cardNumber,
                  { backgroundColor: cardColor, opacity },
                ]}
              />
              <Animated.View
                style={[
                  styles.cardNumber,
                  { backgroundColor: cardColor, opacity },
                ]}
              />
            </View>

            {/* Balance placeholder */}
            <Animated.View
              style={[
                styles.balanceText,
                { backgroundColor: cardColor, opacity },
              ]}
            />
          </Animated.View>
        </Animated.View>

        {/* Buy Section Skeleton */}
        <View style={styles.buySection}>
          <View style={styles.buyCardsContainer}>
            {[0, 1, 2].map((index) => (
              <Animated.View
                key={index}
                style={[
                  styles.buyCard,
                  {
                    backgroundColor: cardColor,
                    opacity,
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.buyCardIcon,
                    { backgroundColor: skeletonColor, opacity },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.buyCardText,
                    { backgroundColor: skeletonColor, opacity },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.buyCardAmount,
                    { backgroundColor: skeletonColor, opacity },
                  ]}
                />
              </Animated.View>
            ))}
          </View>

          {/* Pagination Dots */}
          <View style={styles.dotsContainer}>
            {[0, 1, 2].map((index) => (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  { backgroundColor: skeletonColor, opacity },
                ]}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    width: "100%",
    height: 60,
    marginTop: 10,
  },
  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
  },
  cardContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: screenHeight * 0.06,
  },
  card: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
    padding: 24,
    justifyContent: "space-between",
  },
  cardChip: {
    width: 50,
    height: 40,
    borderRadius: 8,
  },
  cardNumberContainer: {
    gap: 12,
  },
  cardNumber: {
    width: "70%",
    height: 20,
    borderRadius: 4,
  },
  balanceText: {
    width: "50%",
    height: 36,
    borderRadius: 6,
    alignSelf: "center",
  },
  buySection: {
    width: "100%",
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 16,
  },
  buyCardsContainer: {
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 10,
  },
  buyCard: {
    width: screenWidth * 0.7,
    height: 180,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  buyCardIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  buyCardText: {
    width: "70%",
    height: 18,
    borderRadius: 4,
  },
  buyCardAmount: {
    width: "50%",
    height: 28,
    borderRadius: 6,
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default MyWalletSkeleton;
