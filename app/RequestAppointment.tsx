import { useAuth } from "@/components/contexts/authContext";
import BackButton from "@/components/resuables/BackButton";
import { api } from "@/components/utils/api";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const RequestAppointment = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const listenerId = params.listenerId as string;
  const listenerName = params.listenerName as string;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [notes, setNotes] = useState("");
  const [duration, setDuration] = useState("60");
  const [loading, setLoading] = useState(false);

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleTimeChange = (event: any, time?: Date) => {
    setShowTimePicker(Platform.OS === "ios");
    if (time) {
      setSelectedTime(time);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Format time as HH:MM
      const hours = selectedTime.getHours().toString().padStart(2, "0");
      const minutes = selectedTime.getMinutes().toString().padStart(2, "0");
      const timeString = `${hours}:${minutes}`;

      const response = await api.post("/api/v1/appointments/create", {
        listenerId,
        requestedDate: selectedDate.toISOString(),
        requestedTime: timeString,
        duration: parseInt(duration),
        notes: notes.trim(),
      });

      if (response.status === 201) {
        Alert.alert(
          "Success",
          "Appointment request sent! The listener will review and respond.",
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error("Error creating appointment:", error);
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to create appointment"
      );
    } finally {
      setLoading(false);
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
        <BackButton screenName={`Request Appointment with ${listenerName}`} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Animated.View
            entering={FadeInUp.duration(600).delay(200).springify()}
            style={styles.formContainer}
          >
            {/* Date Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                <Ionicons name="calendar-outline" size={16} color="#c4b5fd" />{" "}
                Select Date
              </Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <LinearGradient
                  colors={["#4a1475", "#6b1fa8"]}
                  style={styles.pickerGradient}
                >
                  <Text style={styles.pickerText}>{formatDate(selectedDate)}</Text>
                  <Ionicons name="chevron-down" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleDateChange}
                minimumDate={new Date()}
                themeVariant="dark"
              />
            )}

            {/* Time Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                <Ionicons name="time-outline" size={16} color="#c4b5fd" />{" "}
                Select Time
              </Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowTimePicker(true)}
              >
                <LinearGradient
                  colors={["#4a1475", "#6b1fa8"]}
                  style={styles.pickerGradient}
                >
                  <Text style={styles.pickerText}>{formatTime(selectedTime)}</Text>
                  <Ionicons name="chevron-down" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {showTimePicker && (
              <DateTimePicker
                value={selectedTime}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleTimeChange}
                themeVariant="dark"
              />
            )}

            {/* Duration */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                <Ionicons name="hourglass-outline" size={16} color="#c4b5fd" />{" "}
                Duration (minutes)
              </Text>
              <View style={styles.durationContainer}>
                {["30", "60", "90", "120"].map((dur) => (
                  <TouchableOpacity
                    key={dur}
                    style={[
                      styles.durationButton,
                      duration === dur && styles.durationButtonActive,
                    ]}
                    onPress={() => setDuration(dur)}
                  >
                    <Text
                      style={[
                        styles.durationText,
                        duration === dur && styles.durationTextActive,
                      ]}
                    >
                      {dur}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                <Ionicons name="document-text-outline" size={16} color="#c4b5fd" />{" "}
                Notes (Optional)
              </Text>
              <TextInput
                style={styles.textArea}
                value={notes}
                onChangeText={setNotes}
                placeholder="Any specific topics or concerns..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                maxLength={500}
              />
              <Text style={styles.charCount}>{notes.length}/500</Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              <LinearGradient
                colors={["#7c3aed", "#a855f7"]}
                style={styles.submitGradient}
              >
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.submitText}>
                  {loading ? "Sending..." : "Send Request"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default RequestAppointment;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  formContainer: {
    marginTop: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#c4b5fd",
    marginBottom: 8,
  },
  pickerButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  pickerGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  pickerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  durationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  durationButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  durationButtonActive: {
    backgroundColor: "rgba(124, 58, 237, 0.3)",
    borderColor: "#7c3aed",
  },
  durationText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9ca3af",
  },
  durationTextActive: {
    color: "#fff",
  },
  textArea: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#fff",
    minHeight: 100,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  charCount: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
    textAlign: "right",
  },
  submitButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 20,
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 8,
  },
  submitText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
});
