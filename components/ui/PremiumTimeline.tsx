import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

const STEP_SIZE = 80;
const LINE_WIDTH = 4;
const STEP_SPACING = 120;
const ANIMATION_DURATION = 600;
const BEAM_DURATION = 800;

interface FeatureStepProps {
  index: number;
  currentStep: number;
  stepData: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
  };
  isLeft: boolean;
  totalSteps: number;
}

const FeatureStep = ({
  index,
  currentStep,
  stepData,
  isLeft,
  totalSteps,
}: FeatureStepProps) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const translateX = useSharedValue(isLeft ? -50 : 50);

  useEffect(() => {
    if (index <= currentStep) {
      opacity.value = withDelay(
        index * BEAM_DURATION,
        withTiming(1, {
          duration: ANIMATION_DURATION,
          easing: Easing.out(Easing.cubic),
        }),
      );
      scale.value = withDelay(
        index * BEAM_DURATION,
        withTiming(1, {
          duration: ANIMATION_DURATION,
          easing: Easing.out(Easing.back(1.5)),
        }),
      );
      translateX.value = withDelay(
        index * BEAM_DURATION,
        withTiming(0, {
          duration: ANIMATION_DURATION,
          easing: Easing.out(Easing.cubic),
        }),
      );
    }
  }, [currentStep, index]);

  const stepAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  const contentAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateX: translateX.value }],
    };
  });

  const beamProgress = useSharedValue(0);

  useEffect(() => {
    if (index < currentStep) {
      beamProgress.value = withDelay(
        index * BEAM_DURATION,
        withTiming(1, {
          duration: BEAM_DURATION,
          easing: Easing.inOut(Easing.cubic),
        }),
      );
    } else {
      beamProgress.value = 0;
    }
  }, [currentStep, index]);

  const beamAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      beamProgress.value,
      [0, 1],
      [0, STEP_SPACING],
      Extrapolate.CLAMP,
    );
    return {
      height,
    };
  });

  return (
    <View style={styles.stepWrapper}>
      <View style={styles.stepRow}>
        {/* Content on left side */}
        <View style={styles.contentLeft}>
          {isLeft && (
            <Animated.View style={[styles.textContainer, contentAnimatedStyle]}>
              <Text style={styles.featureTitle}>{stepData.title}</Text>
            </Animated.View>
          )}
        </View>

        {/* Center line and step circle */}
        <View style={styles.centerColumn}>
          <Animated.View style={[styles.step, stepAnimatedStyle]}>
            <Ionicons name={stepData.icon} size={36} color="#FFFFFF" />
          </Animated.View>

          {/* Beam of Light - Vertical Line */}
          {index < totalSteps - 1 && (
            <View style={styles.beamContainer}>
              <View style={styles.lineBackground} />
              <Animated.View style={[styles.beamWrapper, beamAnimatedStyle]}>
                <LinearGradient
                  colors={["#a855f7", "#c084fc", "#7c3aed"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.beam}
                />
              </Animated.View>
            </View>
          )}
        </View>

        {/* Content on right side */}
        <View style={styles.contentRight}>
          {!isLeft && (
            <Animated.View style={[styles.textContainer, contentAnimatedStyle]}>
              <Text style={styles.featureTitle}>{stepData.title}</Text>
            </Animated.View>
          )}
        </View>
      </View>
    </View>
  );
};

const PremiumTimeline = () => {
  const [currentStep, setCurrentStep] = useState(-1);

  const features = [
    {
      icon: "infinite" as keyof typeof Ionicons.glyphMap,
      title: "Unlimited Rants",
    },
    {
      icon: "flash" as keyof typeof Ionicons.glyphMap,
      title: "Priority Matching",
    },
    {
      icon: "shield-checkmark" as keyof typeof Ionicons.glyphMap,
      title: "Ad-Free Experience",
    },
    {
      icon: "star" as keyof typeof Ionicons.glyphMap,
      title: "Custom Profile Badge",
    },
    {
      icon: "analytics" as keyof typeof Ionicons.glyphMap,
      title: "Advanced Analytics",
    },
    {
      icon: "color-palette" as keyof typeof Ionicons.glyphMap,
      title: "Exclusive Themes",
    },
    {
      icon: "headset" as keyof typeof Ionicons.glyphMap,
      title: "24/7 Premium Support",
    },
  ];

  useEffect(() => {
    // Auto-play animation on mount
    const timer = setTimeout(() => {
      setCurrentStep(features.length - 1);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.timelineContainer}>
        {features.map((feature, index) => (
          <FeatureStep
            key={index}
            index={index}
            currentStep={currentStep}
            stepData={feature}
            isLeft={index % 2 === 0}
            totalSteps={features.length}
          />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000ff",
  },
  scrollContent: {
    paddingVertical: 80,
    paddingBottom: 120,
  },
  timelineContainer: {
    width: "100%",
    paddingHorizontal: 24,
    alignItems: "center",
  },
  stepWrapper: {
    width: "100%",
    maxWidth: 700,
    marginBottom: 20,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    minHeight: STEP_SPACING,
    justifyContent: "center",
  },
  centerColumn: {
    alignItems: "center",
    width: STEP_SIZE + 20,
    zIndex: 10,
    position: "absolute",
    left: "50%",
    marginLeft: -(STEP_SIZE + 20) / 2,
  },
  step: {
    width: STEP_SIZE,
    height: STEP_SIZE,
    borderRadius: STEP_SIZE / 2,
    backgroundColor: "#a855f7",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#a855f7",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 4,
    borderColor: "#a855f7",
  },
  contentLeft: {
    flex: 1,
    paddingRight: (STEP_SIZE + 20) / 2 + 20,
    alignItems: "flex-end",
    justifyContent: "center",
    minHeight: STEP_SPACING,
  },
  contentRight: {
    flex: 1,
    paddingLeft: (STEP_SIZE + 20) / 2 + 20,
    alignItems: "flex-start",
    justifyContent: "center",
    minHeight: STEP_SPACING,
  },
  textContainer: {
    paddingVertical: 8,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  beamContainer: {
    position: "absolute",
    left: STEP_SIZE / 2 - LINE_WIDTH / 2 + 10,
    top: STEP_SIZE,
    width: LINE_WIDTH,
    height: STEP_SPACING,
    zIndex: 1,
  },
  lineBackground: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "#000000ff",
  },
  beamWrapper: {
    width: "100%",
    overflow: "hidden",
  },
  beam: {
    width: "100%",
    height: "100%",
  },
});

export default PremiumTimeline;
