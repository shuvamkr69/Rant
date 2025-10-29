import { useAuth } from "@/components/contexts/authContext";
import BackButton from "@/components/resuables/BackButton";
import { api } from "@/components/utils/api";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const RATE_VALUES = [20, 40, 60, 80, 100];

const ListenerDetailScreen = () => {
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [rateIndex, setRateIndex] = useState(2);
  const [bio, setBio] = useState("");
  const [charge, setCharge] = useState(RATE_VALUES[2]);
  const [occupation, setOccupation] = useState("");
  const [userType, setUserType] = useState<"User" | "Listener">("User");

  const scale = useSharedValue(1);

  const formData = {
    //setformdata is not being used because we are taking the initial form data from async storage
    userType: userType,
    name: "",
    mobileNumber: "",
    bio: bio,
    age: 0,
  };

  const { signIn } = useAuth();
  const navigation = useRouter();

  const handleImagePress = async () => {
    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1);
    });

    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Denied",
        "Permission to access media library is required!"
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1], // Square aspect ratio for profile images
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const detailsAsyncStorage = () => {
    AsyncStorage.getItem("userType").then((type) => {
      formData.userType = type as "User" | "Listener";
    });
    AsyncStorage.getItem("name").then((type) => {
      formData.name = type as string;
    });
    AsyncStorage.getItem("mobileNumber").then((type) => {
      formData.mobileNumber = type as string;
    });
    AsyncStorage.getItem("age").then((type) => {
      formData.age = parseInt(type as any);
    });
  };

  useFocusEffect(() => {
    detailsAsyncStorage();
  });

  const animatedImageStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handleRegister = async () => {
    try {
      // Validate required fields
      if (
        !formData.name ||
        !formData.mobileNumber ||
        !profileImage ||
        !bio ||
        !occupation
      ) {
        Alert.alert("Error", "Please fill in all required fields");
        return;
      }

      // Create FormData for multipart/form-data request
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("mobileNumber", formData.mobileNumber);
      formDataToSend.append("userType", formData.userType);
      formDataToSend.append("bio", bio);
      formDataToSend.append("occupation", occupation);
      formDataToSend.append("age", formData.age.toString());

      // Add profile image if selected
      if (profileImage) {
        const filename = profileImage.split("/").pop();
        const match = /\.(\w+)$/.exec(filename || "");
        const type = match ? `image/${match[1]}` : "image/jpeg";

        formDataToSend.append("profileImage", {
          uri: profileImage,
          name: filename || "profile.jpg",
          type: type,
        } as any);
      }

      const response = await api.post(
        "/api/v1/users/register",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 201) {
        await AsyncStorage.removeItem("accessToken");
        await AsyncStorage.removeItem("isSignedIn");
        const newToken = response.data.accessToken;
        await AsyncStorage.setItem("accessToken", newToken);

        await signIn();
        Alert.alert("Success", "Profile created successfully!");
        navigation.replace("/(tabs)" as any);
      }
    } catch (error: any) {
      console.log("The registration has failed:", error);
      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Registration failed. Please try again."
      );
    }
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
              {/* Specialization Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  <Ionicons name="star-outline" size={16} color="#c4b5fd" />{" "}
                  Occupation
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
                      value={occupation}
                      onChangeText={setOccupation}
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
                onPress={handleRegister}
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
    paddingTop: 40,
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
  // Rate Slider Styles
  rateDisplayContainer: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
  },
  rateDisplayGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 30,
    gap: 8,
  },
  currencySymbolLarge: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
  },
  rateValue: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#ffffff",
  },
  perHour: {
    fontSize: 16,
    color: "#e9d5ff",
    marginTop: 20,
  },
  sliderContainer: {
    marginTop: 10,
  },
  sliderTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 20,
  },
  sliderTrackGradient: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  activeTrack: {
    position: "absolute",
    left: 0,
    top: 0,
    height: "100%",
    borderRadius: 4,
    overflow: "hidden",
  },
  activeTrackGradient: {
    width: "100%",
    height: "100%",
  },
  rateOptionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  rateOption: {
    alignItems: "center",
    gap: 8,
  },
  rateCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#a78bfa",
    justifyContent: "center",
    alignItems: "center",
  },
  rateCircleActive: {
    borderColor: "#7c3aed",
    borderWidth: 3,
  },
  rateCircleGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  rateCircleInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ffffff",
  },
  rateOptionText: {
    fontSize: 14,
    color: "#a78bfa",
    fontWeight: "600",
  },
  rateOptionTextActive: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "bold",
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

export default ListenerDetailScreen;
