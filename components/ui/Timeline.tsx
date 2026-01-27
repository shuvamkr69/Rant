import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const STEP_COUNT = 5;
const STEP_SIZE = 60;
const LINE_WIDTH = 4;
const STEP_SPACING = 100;
const ANIMATION_DURATION = 800;
const BEAM_DURATION = 1000;

const Step = ({
  index,
  currentStep,
  stepData,
}: {
  index: number;
  currentStep: number;
  stepData: { title: string; description: string };
}) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

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
        withSequence(
          withTiming(1.3, { duration: ANIMATION_DURATION / 2 }),
          withTiming(1, { duration: ANIMATION_DURATION / 2 }),
        ),
      );
    }
  }, [currentStep, index]);

  const stepAnimatedStyle = useAnimatedStyle(() => {
    const isActive = index <= currentStep;
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
      backgroundColor: isActive ? "#a855f7" : "#E2E8F0",
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
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
        {/* Step Circle */}
        <Animated.View style={[styles.step, stepAnimatedStyle]}>
          <Animated.Text
            style={[
              styles.stepText,
              index <= currentStep && styles.activeStepText,
              textAnimatedStyle,
            ]}
          >
            {index + 1}
          </Animated.Text>
        </Animated.View>

        {/* Step Label */}
        <Animated.View style={[styles.labelContainer, textAnimatedStyle]}>
          <Text style={styles.labelTitle}>{stepData.title}</Text>
          <Text style={styles.labelDescription}>{stepData.description}</Text>
        </Animated.View>
      </View>

      {/* Beam of Light - Vertical Line */}
      {index < STEP_COUNT - 1 && (
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
  );
};

const MultiStepLoader = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const stepData = [
    { title: "Step 1", description: "Initialize your journey" },
    { title: "Step 2", description: "Configure settings" },
    { title: "Step 3", description: "Add your details" },
    { title: "Step 4", description: "Review information" },
    { title: "Step 5", description: "Complete setup" },
  ];

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < STEP_COUNT - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f0f" />
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Setup Timeline</Text>

        <View style={styles.timelineContainer}>
          {[...Array(STEP_COUNT)].map((_, index) => (
            <Step
              key={index}
              index={index}
              currentStep={currentStep}
              stepData={stepData[index]}
            />
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, currentStep === 0 && styles.disabledButton]}
            onPress={handleBack}
            disabled={currentStep === 0}
          >
            <Text
              style={[
                styles.buttonText,
                currentStep === 0 && styles.disabledButtonText,
              ]}
            >
              Back
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.nextButton,
              currentStep === STEP_COUNT - 1 && styles.disabledButton,
            ]}
            onPress={handleNext}
            disabled={currentStep === STEP_COUNT - 1}
          >
            <Text
              style={[
                styles.nextButtonText,
                currentStep === STEP_COUNT - 1 && styles.disabledButtonText,
              ]}
            >
              {currentStep === STEP_COUNT - 1 ? "Finish" : "Next"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    width: "90%",
    maxWidth: 400,
    padding: 24,
    borderRadius: 24,
    backgroundColor: "#1a1a1a",
    shadowColor: "#a855f7",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 32,
    textAlign: "center",
  },
  timelineContainer: {
    width: "100%",
    paddingVertical: 20,
    marginBottom: 32,
  },
  stepWrapper: {
    width: "100%",
    marginBottom: 0,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  step: {
    width: STEP_SIZE,
    height: STEP_SIZE,
    borderRadius: STEP_SIZE / 2,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#a855f7",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  stepText: {
    color: "#64748B",
    fontSize: 24,
    fontWeight: "700",
  },
  activeStepText: {
    color: "#FFFFFF",
  },
  labelContainer: {
    marginLeft: 20,
    flex: 1,
  },
  labelTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  labelDescription: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  beamContainer: {
    position: "absolute",
    left: STEP_SIZE / 2 - LINE_WIDTH / 2,
    top: STEP_SIZE,
    width: LINE_WIDTH,
    height: STEP_SPACING,
    zIndex: 1,
  },
  lineBackground: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "#2A2A2A",
  },
  beamWrapper: {
    width: "100%",
    overflow: "hidden",
  },
  beam: {
    width: "100%",
    height: "100%",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    gap: 12,
  },
  button: {
    backgroundColor: "#2A2A2A",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    flex: 1,
    alignItems: "center",
  },
  nextButton: {
    backgroundColor: "#a855f7",
  },
  resetButton: {
    backgroundColor: "#374151",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#9CA3AF",
    fontSize: 16,
    fontWeight: "600",
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  resetButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.4,
  },
  disabledButtonText: {
    color: "#4B5563",
  },
});

export default MultiStepLoader;
