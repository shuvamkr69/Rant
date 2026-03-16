import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import { Dimensions, FlatList, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

const STEP_SIZE = 56;
const LINE_HEIGHT = 3;
const STEP_SPACING = 90;
const ITEM_WIDTH = STEP_SIZE + STEP_SPACING;
const ANIMATION_DURATION = 600;
const BEAM_DURATION = 800;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
// Padding so that the circle center of the first/last item can land at screen center
const SIDE_PADDING = (SCREEN_WIDTH - STEP_SIZE) / 2;

interface FeatureStepProps {
  index: number;
  currentStep: number;
  stepData: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
  };
  isTop: boolean;
  totalSteps: number;
}

const FeatureStep = ({
  index,
  currentStep,
  stepData,
  isTop,
  totalSteps,
}: FeatureStepProps) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const translateY = useSharedValue(isTop ? -30 : 30);

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
      translateY.value = withDelay(
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
      transform: [{ translateY: translateY.value }],
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
    const width = interpolate(
      beamProgress.value,
      [0, 1],
      [0, STEP_SPACING],
      Extrapolate.CLAMP,
    );
    return {
      width,
    };
  });

  return (
    <View style={styles.stepWrapper}>
      <View style={styles.stepColumn}>
        {/* Content above */}
        <View style={styles.contentTop}>
          {isTop && (
            <Animated.View style={[styles.textContainer, contentAnimatedStyle]}>
              <Text style={styles.featureTitle}>{stepData.title}</Text>
            </Animated.View>
          )}
        </View>

        {/* Circle and horizontal beam */}
        <View style={styles.centerRow}>
          <Animated.View style={[styles.step, stepAnimatedStyle]}>
            <Ionicons name={stepData.icon} size={24} color="#FFFFFF" />
          </Animated.View>

          {/* Beam of Light - Horizontal Line */}
          {index < totalSteps - 1 && (
            <View style={styles.beamContainer}>
              <View style={styles.lineBackground} />
              <Animated.View style={[styles.beamWrapper, beamAnimatedStyle]}>
                <LinearGradient
                  colors={["#a855f7", "#c084fc", "#7c3aed"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.beam}
                />
              </Animated.View>
            </View>
          )}
        </View>

        {/* Content below */}
        <View style={styles.contentBottom}>
          {!isTop && (
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
  const flatListRef = useRef<FlatList>(null);

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

  // Auto-scroll to follow the animation, centering each icon
  useEffect(() => {
    if (currentStep < 0) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    for (let i = 0; i <= currentStep; i++) {
      const timer = setTimeout(
        () => {
          // Scroll so that the circle center of item i is at screen center
          const scrollX = i * ITEM_WIDTH;
          flatListRef.current?.scrollToOffset({
            offset: scrollX,
            animated: true,
          });
        },
        i * BEAM_DURATION + ANIMATION_DURATION * 0.4,
      );
      timers.push(timer);
    }

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [currentStep]);

  const renderItem = ({
    item,
    index,
  }: {
    item: (typeof features)[0];
    index: number;
  }) => (
    <FeatureStep
      index={index}
      currentStep={currentStep}
      stepData={item}
      isTop={index % 2 === 0}
      totalSteps={features.length}
    />
  );

  // Pre-compute snap offsets so each circle center lands at screen center
  const snapOffsets = features.map((_, i) => i * ITEM_WIDTH);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={features}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToOffsets={snapOffsets}
        decelerationRate="fast"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: SIDE_PADDING },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000000ff",
  },
  scrollContent: {
    paddingVertical: 20,
    alignItems: "center",
  },
  stepWrapper: {
    width: ITEM_WIDTH,
    alignItems: "flex-start",
    paddingVertical: 40,
  },
  stepColumn: {
    alignItems: "center",
    width: STEP_SIZE,
  },
  centerRow: {
    flexDirection: "row",
    alignItems: "center",
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
      height: 4,
    },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 3,
    borderColor: "#a855f7",
    zIndex: 10,
  },
  contentTop: {
    height: 48,
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 10,
    width: STEP_SIZE + 40,
    marginLeft: -20,
  },
  contentBottom: {
    height: 48,
    justifyContent: "flex-start",
    alignItems: "center",
    marginTop: 10,
    width: STEP_SIZE + 40,
    marginLeft: -20,
  },
  textContainer: {
    alignItems: "center",
  },
  featureTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 15,
  },
  beamContainer: {
    position: "absolute",
    left: STEP_SIZE,
    top: STEP_SIZE / 2 - LINE_HEIGHT / 2,
    height: LINE_HEIGHT,
    width: STEP_SPACING,
    zIndex: 1,
  },
  lineBackground: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "#1a1a2e",
    borderRadius: LINE_HEIGHT / 2,
  },
  beamWrapper: {
    height: "100%",
    overflow: "hidden",
    borderRadius: LINE_HEIGHT / 2,
  },
  beam: {
    width: STEP_SPACING,
    height: "100%",
  },
});

export default PremiumTimeline;
