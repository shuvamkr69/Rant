import BackButton from "@/components/resuables/BackButton";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const UserDetailScreen = () => {
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [rate, setRate] = useState("");
  const [bio, setBio] = useState("");
  const [experience, setExperience] = useState("");
  const [specialization, setSpecialization] = useState("");

  const scale = useSharedValue(1);

  const handleImagePress = () => {
    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1);
    });
    console.log("Image picker to be implemented");
  };

  const animatedImageStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handleSubmit = () => {
    console.log("Submitting details:", {
      rate,
      bio,
      experience,
      specialization,
    });
    router.push("/(tabs)" as any);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <LinearGradient
        colors={["#1a0033", "#2d0a4e", "#4a1475", "#6b1fa8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <BackButton screenName="Setup Your Profile" />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoid}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >

            {/* Profile Image Section */}
            <Animated.View
              entering={FadeInUp.duration(800).delay(200).springify()}
              style={styles.imageSection}
            >
              <TouchableOpacity onPress={handleImagePress} activeOpacity={0.9}>
                <Animated.View
                  style={[styles.imageWrapper, animatedImageStyle]}
                >
                  <LinearGradient
                    colors={["#8b5cf6", "#a78bfa", "#c4b5fd"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.imageGradient}
                  >
                    {profileImage ? (
                      <Image
                        source={{ uri: profileImage }}
                        style={styles.profileImage}
                      />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Ionicons name="camera" size={50} color="#ffffff" />
                        <Text style={styles.imagePlaceholderText}>
                          Add Photo
                        </Text>
                      </View>
                    )}
                  </LinearGradient>
                  <View style={styles.cameraButton}>
                    <LinearGradient
                      colors={["#7c3aed", "#a855f7"]}
                      style={styles.cameraGradient}
                    >
                      <Ionicons name="camera" size={20} color="#ffffff" />
                    </LinearGradient>
                  </View>
                </Animated.View>
              </TouchableOpacity>
            </Animated.View>

            {/* Form Section */}
            <Animated.View
              entering={FadeInUp.duration(800).delay(400).springify()}
              style={styles.formSection}
            >
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  <Ionicons name="cash-outline" size={16} color="#c4b5fd" />{" "}
                    Hourly Charged
                </Text>
                <View style={styles.inputWrapper}>
                  <LinearGradient
                    colors={[
                      "rgba(139, 92, 246, 0.1)",
                      "rgba(139, 92, 246, 0.05)",
                    ]}
                    style={styles.inputGradient}
                  >
                    <Text style={styles.currencySymbol}>₹</Text>
                    <TextInput
                      placeholder="Enter your rate"
                      placeholderTextColor="#a78bfa"
                      style={styles.input}
                      value={rate}
                      onChangeText={setRate}
                      keyboardType="numeric"
                    />
                  </LinearGradient>
                </View>
              </View>

              {/* Experience Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  <Ionicons
                    name="briefcase-outline"
                    size={16}
                    color="#c4b5fd"
                  />{" "}
                  Years of Experience
                </Text>
                <View style={styles.inputWrapper}>
                  <LinearGradient
                    colors={[
                      "rgba(139, 92, 246, 0.1)",
                      "rgba(139, 92, 246, 0.05)",
                    ]}
                    style={styles.inputGradient}
                  >
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color="#a78bfa"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      placeholder="e.g., 3 years"
                      placeholderTextColor="#a78bfa"
                      style={styles.input}
                      value={experience}
                      onChangeText={setExperience}
                      keyboardType="numeric"
                    />
                  </LinearGradient>
                </View>
              </View>

              {/* Specialization Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  <Ionicons name="star-outline" size={16} color="#c4b5fd" />{" "}
                  Specialization
                </Text>
                <View style={styles.inputWrapper}>
                  <LinearGradient
                    colors={[
                      "rgba(139, 92, 246, 0.1)",
                      "rgba(139, 92, 246, 0.05)",
                    ]}
                    style={styles.inputGradient}
                  >
                    <Ionicons
                      name="ribbon-outline"
                      size={20}
                      color="#a78bfa"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      placeholder="e.g., Mental Health, Career Counseling"
                      placeholderTextColor="#a78bfa"
                      style={styles.input}
                      value={specialization}
                      onChangeText={setSpecialization}
                    />
                  </LinearGradient>
                </View>
              </View>

              {/* Bio Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  <Ionicons name="person-outline" size={16} color="#c4b5fd" />{" "}
                  About You
                </Text>
                <View style={styles.inputWrapper}>
                  <LinearGradient
                    colors={[
                      "rgba(139, 92, 246, 0.1)",
                      "rgba(139, 92, 246, 0.05)",
                    ]}
                    style={[styles.inputGradient, styles.textAreaGradient]}
                  >
                    <TextInput
                      placeholder="Tell us about yourself and your expertise..."
                      placeholderTextColor="#a78bfa"
                      style={[styles.input, styles.textArea]}
                      value={bio}
                      onChangeText={setBio}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </LinearGradient>
                </View>
              </View>
            </Animated.View>

            {/* Submit Button */}
            <Animated.View
              entering={FadeInUp.duration(800).delay(600).springify()}
              style={styles.buttonSection}
            >
              <TouchableOpacity
                onPress={handleSubmit}
                activeOpacity={0.9}
                style={styles.submitButton}
              >
                <LinearGradient
                  colors={["#7c3aed", "#9333ea", "#a855f7"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>Complete Profile</Text>
                  <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Decorative Elements */}
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />
            <View style={styles.decorativeCircle3} />
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#1a0033",
  },
  gradient: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  headerSection: {
    marginTop: 20,
    marginBottom: 30,
    alignItems: "center",
  },
  title: {
    fontSize: width > 400 ? 32 : 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: width > 400 ? 16 : 14,
    color: "#c4b5fd",
    textAlign: "center",
  },
  imageSection: {
    alignItems: "center",
    marginBottom: 40,
    marginTop: 40,
  },
  imageWrapper: {
    position: "relative",
  },
  imageGradient: {
    width: width > 400 ? 180 : 150,
    height: width > 400 ? 180 : 150,
    borderRadius: width > 400 ? 90 : 75,
    padding: 4,
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: width > 400 ? 86 : 71,
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: width > 400 ? 86 : 71,
    backgroundColor: "rgba(139, 92, 246, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    color: "#ffffff",
    fontSize: 14,
    marginTop: 8,
    fontWeight: "600",
  },
  cameraButton: {
    position: "absolute",
    bottom: 5,
    right: 5,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  cameraGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#1a0033",
  },
  formSection: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e9d5ff",
    marginBottom: 10,
    marginLeft: 4,
  },
  inputWrapper: {
    borderRadius: 16,
    overflow: "hidden",
  },
  inputGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.3)",
  },
  textAreaGradient: {
    paddingVertical: 12,
    minHeight: 120,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#a78bfa",
    marginRight: 8,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#ffffff",
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  buttonSection: {
    marginTop: 10,
    gap: 16,
  },
  submitButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  buttonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
    gap: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 16,
    color: "#c4b5fd",
    textDecorationLine: "underline",
  },
  // Decorative Elements
  decorativeCircle1: {
    position: "absolute",
    top: 100,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    opacity: 0.5,
  },
  decorativeCircle2: {
    position: "absolute",
    top: 300,
    left: -60,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(167, 139, 250, 0.1)",
    opacity: 0.5,
  },
  decorativeCircle3: {
    position: "absolute",
    bottom: 150,
    right: -40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(196, 181, 253, 0.1)",
    opacity: 0.5,
  },
});

export default UserDetailScreen;
