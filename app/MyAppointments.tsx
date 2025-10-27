import { useAuth } from "@/components/contexts/authContext";
import BackButton from "@/components/resuables/BackButton";
import { api } from "@/components/utils/api";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Appointment {
  _id: string;
  userId: any;
  listenerId: any;
  requestedDate: string;
  requestedTime: string;
  proposedDate?: string;
  proposedTime?: string;
  duration: number;
  status: string;
  notes?: string;
}

const MyAppointments = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "accepted">("all");

  const fetchAppointments = async () => {
    try {
      const params: any = {};
      if (filter !== "all") {
        params.status = filter;
      }

      const response = await api.get("/api/v1/appointments/my-appointments", {
        params,
      });

      if (response.data.success) {
        setAppointments(response.data.appointments);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchAppointments();
    }, [filter])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const handleAccept = async (appointmentId: string) => {
    try {
      const response = await api.patch(
        `/api/v1/appointments/${appointmentId}/accept`
      );
      if (response.data.success) {
        Alert.alert("Success", "Appointment accepted!");
        fetchAppointments();
      }
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed to accept");
    }
  };

  const handleCancel = async (appointmentId: string) => {
    Alert.alert(
      "Cancel Appointment",
      "Are you sure you want to cancel this appointment?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              await api.patch(`/api/v1/appointments/${appointmentId}/cancel`);
              Alert.alert("Success", "Appointment cancelled");
              fetchAppointments();
            } catch (error: any) {
              Alert.alert("Error", error?.response?.data?.message || "Failed to cancel");
            }
          },
        },
      ]
    );
  };

  const handleJoinSession = (appointment: Appointment) => {
    const otherUser = appointment.userId._id === user?._id ? appointment.listenerId : appointment.userId;
    router.push({
      pathname: "/ChatScreen" as any,
      params: {
        otherUserId: otherUser._id,
        otherUserName: otherUser.name,
        appointmentId: appointment._id,
      },
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
  };

  const renderAppointment = (appointment: Appointment) => {
    const isListener = appointment.listenerId._id === user?._id;
    const otherUser = isListener ? appointment.userId : appointment.listenerId;
    const isRescheduled = appointment.status === "rescheduled";

    return (
      <View key={appointment._id} style={styles.appointmentCard}>
        <LinearGradient
          colors={["#4a1475", "#6b1fa8"]}
          style={styles.cardGradient}
        >
          {/* User Info */}
          <View style={styles.userInfo}>
            {otherUser.profileImage ? (
              <Image
                source={{ uri: otherUser.profileImage }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={24} color="#fff" />
              </View>
            )}
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{otherUser.name}</Text>
              <Text style={styles.userRole}>
                {isListener ? "User" : "Listener"}
              </Text>
            </View>
            <View style={[styles.statusBadge, getStatusStyle(appointment.status)]}>
              <Text style={styles.statusText}>{appointment.status}</Text>
            </View>
          </View>

          {/* Appointment Details */}
          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar" size={16} color="#c4b5fd" />
              <Text style={styles.detailText}>
                {formatDate(appointment.requestedDate)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="time" size={16} color="#c4b5fd" />
              <Text style={styles.detailText}>{appointment.requestedTime}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="hourglass" size={16} color="#c4b5fd" />
              <Text style={styles.detailText}>{appointment.duration} mins</Text>
            </View>
          </View>

          {/* Rescheduled Time */}
          {isRescheduled && appointment.proposedDate && (
            <View style={styles.proposedSection}>
              <Text style={styles.proposedLabel}>Listener proposed:</Text>
              <View style={styles.proposedDetails}>
                <Ionicons name="calendar-outline" size={14} color="#fbbf24" />
                <Text style={styles.proposedText}>
                  {formatDate(appointment.proposedDate)} at {appointment.proposedTime}
                </Text>
              </View>
            </View>
          )}

          {/* Notes */}
          {appointment.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText}>{appointment.notes}</Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsSection}>
            {appointment.status === "pending" && isListener && (
              <>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => handleAccept(appointment._id)}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => router.push({
                    pathname: "/ProposeNewTime" as any,
                    params: { appointmentId: appointment._id },
                  })}
                >
                  <Ionicons name="time" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Propose Time</Text>
                </TouchableOpacity>
              </>
            )}

            {appointment.status === "rescheduled" && !isListener && (
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={async () => {
                  try {
                    await api.patch(
                      `/api/v1/appointments/${appointment._id}/accept-reschedule`
                    );
                    Alert.alert("Success", "New time accepted!");
                    fetchAppointments();
                  } catch (error: any) {
                    Alert.alert("Error", error?.response?.data?.message);
                  }
                }}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.buttonText}>Accept New Time</Text>
              </TouchableOpacity>
            )}

            {appointment.status === "accepted" && (
              <TouchableOpacity
                style={styles.joinButton}
                onPress={() => handleJoinSession(appointment)}
              >
                <Ionicons name="chatbubbles" size={20} color="#fff" />
                <Text style={styles.buttonText}>Join Session</Text>
              </TouchableOpacity>
            )}

            {(appointment.status === "pending" || appointment.status === "accepted") && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleCancel(appointment._id)}
              >
                <Ionicons name="close-circle" size={20} color="#fff" />
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </View>
    );
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "pending":
        return styles.statusPending;
      case "accepted":
        return styles.statusAccepted;
      case "rejected":
      case "cancelled":
        return styles.statusRejected;
      case "completed":
        return styles.statusCompleted;
      case "rescheduled":
        return styles.statusRescheduled;
      default:
        return {};
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient
          colors={["#1a0033", "#2d0a4e", "#4a1475", "#6b1fa8"]}
          style={styles.gradient}
        >
          <BackButton screenName="My Appointments" />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <LinearGradient
        colors={["#1a0033", "#2d0a4e", "#4a1475", "#6b1fa8"]}
        style={styles.gradient}
      >
        <BackButton screenName="My Appointments" />

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {["all", "pending", "accepted"].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f as any)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === f && styles.filterTextActive,
                ]}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
          }
        >
          {appointments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#9ca3af" />
              <Text style={styles.emptyText}>No appointments yet</Text>
            </View>
          ) : (
            appointments.map(renderAppointment)
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default MyAppointments;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  gradient: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  filterContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
  },
  filterTabActive: {
    backgroundColor: "#7c3aed",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9ca3af",
  },
  filterTextActive: {
    color: "#fff",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: "#9ca3af",
    marginTop: 16,
  },
  appointmentCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  cardGradient: {
    padding: 16,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  userRole: {
    fontSize: 14,
    color: "#c4b5fd",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    textTransform: "capitalize",
  },
  statusPending: { backgroundColor: "#f59e0b" },
  statusAccepted: { backgroundColor: "#10b981" },
  statusRejected: { backgroundColor: "#ef4444" },
  statusCompleted: { backgroundColor: "#6b7280" },
  statusRescheduled: { backgroundColor: "#3b82f6" },
  detailsSection: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: "#e9d5ff",
  },
  proposedSection: {
    backgroundColor: "rgba(251, 191, 36, 0.2)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  proposedLabel: {
    fontSize: 12,
    color: "#fbbf24",
    fontWeight: "600",
    marginBottom: 4,
  },
  proposedDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  proposedText: {
    fontSize: 14,
    color: "#fff",
  },
  notesSection: {
    marginBottom: 12,
  },
  notesLabel: {
    fontSize: 12,
    color: "#c4b5fd",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: "#e9d5ff",
  },
  actionsSection: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  acceptButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10b981",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  rejectButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3b82f6",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  joinButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7c3aed",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  cancelButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ef4444",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
