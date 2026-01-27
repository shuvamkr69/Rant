import { useTheme } from "@/components/contexts/ThemeContext";
import BackButton from "@/components/resuables/BackButton";
import { api } from "@/components/utils/api";
import { CACHE_KEYS, clearCache } from "@/components/utils/cacheStorage";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { SafeAreaView } from "react-native-safe-area-context";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function EditProfile() {
  const { colorScheme } = useTheme();
  const colors = Colors;
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userType, setUserType] = useState<string>("");

  // Form fields
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [bio, setBio] = useState("");
  const [occupation, setOccupation] = useState("");
  const [timings, setTimings] = useState("");
  const [daysAvailable, setDaysAvailable] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [newImageUri, setNewImageUri] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/api/v1/users/myProfile");
      if (response.data) {
        const userData = response.data;
        setName(userData.name || "");
        setAge(userData.age?.toString() || "");
        setBio(userData.bio || "");
        setOccupation(userData.occupation || "");
        setTimings(userData.timings || "");
        setDaysAvailable(userData.daysAvailable || []);
        setProfileImage(userData.profileImage || null);
        setUserType(userData.userType || "User");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      Alert.alert("Error", "Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photos to change your profile picture.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setNewImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleSave = async () => {
    try {
      // Validation
      if (!name.trim()) {
        Alert.alert("Validation Error", "Name is required");
        return;
      }

      const ageNum = parseInt(age);
      if (!age || isNaN(ageNum) || ageNum < 18) {
        Alert.alert("Validation Error", "Age must be at least 18");
        return;
      }

      if (userType === "Listener") {
        if (!bio?.trim()) {
          Alert.alert("Validation Error", "Bio is required for listeners");
          return;
        }
        if (!occupation?.trim()) {
          Alert.alert(
            "Validation Error",
            "Occupation is required for listeners",
          );
          return;
        }
      }

      setIsSaving(true);

      // Prepare form data
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("age", ageNum.toString());

      if (bio) formData.append("bio", bio.trim());
      if (occupation) formData.append("occupation", occupation.trim());
      if (timings) formData.append("timings", timings.trim());
      if (daysAvailable.length > 0) {
        formData.append("daysAvailable", JSON.stringify(daysAvailable));
      }

      // Add new profile image if selected
      if (newImageUri) {
        const filename = newImageUri.split("/").pop() || "profile.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        formData.append("profileImage", {
          uri: newImageUri,
          name: filename,
          type,
        } as any);
      }

      console.log("🔵 [Edit Profile] Submitting update...");

      const response = await api.put("/api/v1/users/update-profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("✅ [Edit Profile] Profile updated successfully");

      // Clear profile and stats caches to force refresh on next view
      await clearCache(CACHE_KEYS.MY_PROFILE);
      await clearCache(CACHE_KEYS.USER_STATS);
      console.log("🗑️ Profile caches cleared");

      Alert.alert("Success", "Profile updated successfully", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error("❌ [Edit Profile] Error:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to update profile",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDay = (day: string) => {
    if (daysAvailable.includes(day)) {
      setDaysAvailable(daysAvailable.filter((d) => d !== day));
    } else {
      setDaysAvailable([...daysAvailable, day]);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.header}>
          <BackButton />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Edit Profile
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Edit Profile
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            style={styles.saveButton}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.tint} />
            ) : (
              <Text style={[styles.saveButtonText, { color: colors.tint }]}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Image */}
          <View style={styles.imageSection}>
            <View style={styles.imageContainer}>
              {newImageUri || profileImage ? (
                <Image
                  source={{ uri: newImageUri || profileImage || undefined }}
                  style={styles.profileImage}
                />
              ) : (
                <View
                  style={[
                    styles.profileImage,
                    styles.placeholderImage,
                    { backgroundColor: colors.cardBackground },
                  ]}
                >
                  <Ionicons name="person" size={60} color={colors.icon} />
                </View>
              )}
              <TouchableOpacity
                style={[
                  styles.editImageButton,
                  { backgroundColor: colors.tint },
                ]}
                onPress={pickImage}
              >
                <Ionicons name="camera" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <Text style={[styles.imageHint, { color: colors.icon }]}>
              Tap to change profile picture
            </Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.cardBackground,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={colors.icon}
              />
            </View>

            {/* Age */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Age <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.cardBackground,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={age}
                onChangeText={setAge}
                placeholder="Enter your age"
                placeholderTextColor={colors.icon}
                keyboardType="number-pad"
              />
            </View>

            {/* Bio (for all users, but required for Listeners) */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Bio{" "}
                {userType === "Listener" && (
                  <Text style={styles.required}>*</Text>
                )}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: colors.cardBackground,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={bio}
                onChangeText={setBio}
                placeholder={
                  userType === "Listener"
                    ? "Tell users about yourself and your listening experience"
                    : "Tell others about yourself (optional)"
                }
                placeholderTextColor={colors.icon}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Occupation (for Listeners) */}
            {userType === "Listener" && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Occupation <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.cardBackground,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    value={occupation}
                    onChangeText={setOccupation}
                    placeholder="e.g., Psychologist, Counselor, Life Coach"
                    placeholderTextColor={colors.icon}
                  />
                </View>

                {/* Timings */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Available Timings
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.cardBackground,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    value={timings}
                    onChangeText={setTimings}
                    placeholder="e.g., 9 AM - 6 PM"
                    placeholderTextColor={colors.icon}
                  />
                </View>

                {/* Days Available */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Days Available
                  </Text>
                  <View style={styles.daysContainer}>
                    {DAYS_OF_WEEK.map((day) => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.dayChip,
                          {
                            backgroundColor: daysAvailable.includes(day)
                              ? colors.tint
                              : colors.cardBackground,
                            borderColor: daysAvailable.includes(day)
                              ? colors.tint
                              : colors.border,
                          },
                        ]}
                        onPress={() => toggleDay(day)}
                      >
                        <Text
                          style={[
                            styles.dayChipText,
                            {
                              color: daysAvailable.includes(day)
                                ? "#FFFFFF"
                                : colors.text,
                            },
                          ]}
                        >
                          {day.substring(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}
          </View>

          {/* User Type Badge */}
          <View style={styles.userTypeBadge}>
            <Ionicons
              name={userType === "Listener" ? "ear" : "person"}
              size={16}
              color={colors.tint}
            />
            <Text style={[styles.userTypeText, { color: colors.icon }]}>
              {userType}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  saveButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  imageSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  imageContainer: {
    position: "relative",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholderImage: {
    justifyContent: "center",
    alignItems: "center",
  },
  editImageButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  imageHint: {
    marginTop: 10,
    fontSize: 14,
  },
  formSection: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
  },
  required: {
    color: "#EF4444",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 15,
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
  },
  pickerButtonText: {
    fontSize: 16,
    flex: 1,
  },
  userTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    paddingVertical: 8,
  },
  userTypeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  daysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  dayChipText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
