import { useAuth } from "@/components/contexts/authContext";
import BackButton from "@/components/resuables/BackButton";
import { api } from "@/components/utils/api";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInUp,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const VerificationWaiting = () => {
  const router = useRouter();
  const { signIn } = useAuth();
  const colors = Colors;

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedStartHour, setSelectedStartHour] = useState<string>("10");
  const [selectedEndHour, setSelectedEndHour] = useState<string>("11");
  const [interviewSlot, setInterviewSlot] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string>("");

  const scale = useSharedValue(1);

  // Fetch user ID from async storage
  useEffect(() => {
    const getUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("userId");
        if (storedUserId) {
          setUserId(storedUserId);
        }
      } catch (error) {
        console.log("Error fetching userId:", error);
      }
    };
    getUserId();
  }, []);

  // Format date as dd/mm/yy
  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleConfirmDateTime = () => {
    if (!selectedStartHour || !selectedEndHour) {
      Alert.alert("Error", "Please select both start and end hours");
      return;
    }

    const startHour = parseInt(selectedStartHour);
    const endHour = parseInt(selectedEndHour);

    if (startHour >= endHour) {
      Alert.alert("Error", "Start hour must be before end hour");
      return;
    }

    const formattedDate = formatDate(selectedDate);
    const slot = `${formattedDate} - ${selectedStartHour} to ${selectedEndHour}`;
    setInterviewSlot(slot);

    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1);
    });
  };

  const handleSubmitSlot = async () => {
    if (!interviewSlot) {
      Alert.alert("Error", "Please select an interview slot first");
      return;
    }

    if (!userId) {
      Alert.alert("Error", "User ID not found. Please try registering again.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await api.post("/api/v1/users/save-interview-slot", {
        userId,
        interviewSlot,
      });

      if (response.status === 200) {
        Alert.alert(
          "Success",
          "Your interview slot has been scheduled. Logging you in now...",
          [
            {
              text: "OK",
              onPress: async () => {
                try {
                  // Sign in the user
                  await signIn();

                  // Clear temporary registration data
                  await AsyncStorage.multiRemove([
                    "userType",
                    "name",
                    "mobileNumber",
                    "age",
                  ]);

                  // Navigate to home
                  router.replace("/(tabs)");
                } catch (error) {
                  console.log("Error signing in:", error);
                  Alert.alert("Error", "Failed to sign in. Please try again.");
                }
              },
            },
          ],
        );
      }
    } catch (error: any) {
      console.log("Error saving interview slot:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "Failed to save interview slot. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const HourPicker = ({
    value,
    onChange,
    label,
  }: {
    value: string;
    onChange: (value: string) => void;
    label: string;
  }) => {
    const hours = Array.from({ length: 24 }, (_, i) =>
      String(i).padStart(2, "0"),
    );

    return (
      <View style={styles.hourPickerContainer}>
        <Text style={[styles.hourLabel, { color: colors.icon }]}>{label}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hourScroll}
        >
          {hours.map((hour) => (
            <TouchableOpacity
              key={hour}
              style={[
                styles.hourOption,
                {
                  backgroundColor:
                    value === hour
                      ? "rgba(168, 85, 247, 0.3)"
                      : colors.cardBackground,
                  borderColor: value === hour ? "#a855f7" : colors.border,
                },
              ]}
              onPress={() => onChange(hour)}
            >
              <Text
                style={[
                  styles.hourText,
                  {
                    color: value === hour ? "#a855f7" : colors.text,
                    fontWeight: value === hour ? "600" : "400",
                  },
                ]}
              >
                {hour}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <BackButton screenName="Verification" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Verification Icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: useSharedValue(1) }],
            },
          ]}
          entering={FadeInUp.duration(600).delay(100)}
        >
          <View
            style={[
              styles.iconBg,
              { backgroundColor: "rgba(168, 85, 247, 0.1)" },
            ]}
          >
            <Ionicons name="hourglass-outline" size={64} color="#a855f7" />
          </View>
        </Animated.View>

        {/* Main Message */}
        <Animated.View entering={FadeInUp.duration(600).delay(200)}>
          <Text style={[styles.mainTitle, { color: colors.text }]}>
            Waiting for Verification
          </Text>
          <Text style={[styles.subtitle, { color: colors.icon }]}>
            Thank you for signing up as a Listener! Our team will verify your
            profile soon.
          </Text>
        </Animated.View>

        {/* Info Card */}
        <Animated.View
          style={[
            styles.infoCard,
            {
              backgroundColor: colors.cardBackground,
              borderColor: "rgba(168, 85, 247, 0.2)",
            },
          ]}
          entering={FadeInUp.duration(600).delay(300)}
        >
          <View style={styles.infoRow}>
            <View
              style={[
                styles.infoIconContainer,
                { backgroundColor: "rgba(168, 85, 247, 0.15)" },
              ]}
            >
              <Ionicons name="videocam-outline" size={22} color="#a855f7" />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                Verification Process
              </Text>
              <Text style={[styles.infoDescription, { color: colors.icon }]}>
                We conduct video interviews to verify your identity and
                credibility as a Listener.
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Interview Slot Section */}
        <Animated.View entering={FadeInUp.duration(600).delay(400)}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, marginTop: 32, marginBottom: 16 },
            ]}
          >
            Schedule Your Interview
          </Text>

          {/* Date Picker */}
          <TouchableOpacity
            style={[
              styles.datePickerButton,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#a855f7" />
            <Text style={[styles.datePickerText, { color: colors.text }]}>
              {formatDate(selectedDate)}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          {Platform.OS === "ios" && showDatePicker && (
            <TouchableOpacity
              style={[styles.datePickerConfirm, { backgroundColor: "#a855f7" }]}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.datePickerConfirmText}>Done</Text>
            </TouchableOpacity>
          )}

          {/* Hour Selection */}
          <Text
            style={[
              styles.hoursLabel,
              { color: colors.icon, marginTop: 20, marginBottom: 12 },
            ]}
          >
            Select Time Slot (24-hour format)
          </Text>

          <HourPicker
            value={selectedStartHour}
            onChange={setSelectedStartHour}
            label="Start Hour"
          />

          <View style={styles.divider} />

          <HourPicker
            value={selectedEndHour}
            onChange={setSelectedEndHour}
            label="End Hour"
          />

          {/* Confirm Button */}
          <TouchableOpacity
            style={[
              styles.confirmButton,
              { backgroundColor: "#a855f7", marginTop: 24 },
            ]}
            onPress={handleConfirmDateTime}
          >
            <Text style={styles.confirmButtonText}>Confirm Time Slot</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Selected Slot Display */}
        {interviewSlot && (
          <Animated.View
            style={[
              styles.slotDisplayCard,
              {
                backgroundColor: "rgba(168, 85, 247, 0.1)",
                borderColor: "#a855f7",
              },
            ]}
            entering={FadeInUp.duration(400)}
          >
            <View style={styles.slotDisplayRow}>
              <Ionicons name="checkmark-circle" size={24} color="#a855f7" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.slotDisplayLabel, { color: colors.icon }]}>
                  Selected Interview Slot
                </Text>
                <Text style={[styles.slotDisplayValue, { color: colors.text }]}>
                  {interviewSlot}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Submit Button */}
        {interviewSlot && (
          <Animated.View entering={FadeInUp.duration(600).delay(500)}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: "#a855f7",
                  opacity: isSubmitting ? 0.6 : 1,
                },
              ]}
              onPress={handleSubmitSlot}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Text style={styles.submitButtonText}>Submitting...</Text>
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#fff" />
                  <Text style={[styles.submitButtonText, { marginLeft: 8 }]}>
                    Submit Interview Slot
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Info Footer */}
        <Animated.View
          style={[
            styles.footerInfo,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            },
          ]}
          entering={FadeInUp.duration(600).delay(600)}
        >
          <View style={styles.footerRow}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#3b82f6"
            />
            <Text style={[styles.footerText, { color: colors.icon }]}>
              Once verified, you can accept chat requests and earn money!
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
  },
  iconContainer: {
    alignItems: "center",
    marginVertical: 24,
  },
  iconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24,
    opacity: 0.8,
  },
  infoCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 28,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    marginBottom: 16,
  },
  datePickerText: {
    fontSize: 15,
    fontWeight: "500",
  },
  datePickerConfirm: {
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  datePickerConfirmText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  hoursLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  hourPickerContainer: {
    marginBottom: 16,
  },
  hourLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 10,
  },
  hourScroll: {
    gap: 8,
    paddingHorizontal: 0,
  },
  hourOption: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  hourText: {
    fontSize: 14,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginVertical: 16,
  },
  confirmButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  slotDisplayCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 24,
    marginBottom: 16,
  },
  slotDisplayRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  slotDisplayLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  slotDisplayValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  submitButton: {
    flexDirection: "row",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footerInfo: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  footerText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
    opacity: 0.9,
  },
});

export default VerificationWaiting;
