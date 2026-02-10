import { useTheme } from "@/components/contexts/ThemeContext";
import { useNotifications } from "@/components/contexts/notificationContext";
import { Colors } from "@/constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Notifications = () => {
  const { colorScheme } = useTheme();
  const colors = Colors;
  const navigation = useNavigation();

  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  const [refreshing, setRefreshing] = React.useState(false);

  // Fetch on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const getIconName = (type: string) => {
    switch (type) {
      case "match":
        return "heart";
      case "message":
        return "chatbubble";
      case "premium":
        return "star";
      case "session":
        return "time";
      case "system":
        return "information-circle";
      default:
        return "notifications";
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "match":
        return "#ef4444";
      case "message":
        return "#3b82f6";
      case "premium":
        return "#fbbf24";
      case "session":
        return "#10b981";
      case "system":
        return "#a855f7";
      default:
        return colors.text;
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Notifications
        </Text>
        <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
          <Ionicons name="checkmark-done" size={24} color="#a855f7" />
        </TouchableOpacity>
      </View>

      {/* Unread Count */}
      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Text style={styles.unreadText}>
            {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
          </Text>
          <TouchableOpacity onPress={clearAll}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notifications List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#a855f7"
            colors={["#a855f7"]}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#a855f7" />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="notifications-off-outline"
              size={64}
              color="#6b7280"
            />
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>
              We'll notify you when something arrives
            </Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                {
                  backgroundColor: notification.read
                    ? colors.cardBackground
                    : "#1a1a2e",
                  borderLeftColor: getIconColor(notification.type),
                },
              ]}
              onPress={() => markAsRead(notification.id)}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: getIconColor(notification.type) + "20" },
                  ]}
                >
                  <Ionicons
                    name={getIconName(notification.type) as any}
                    size={24}
                    color={getIconColor(notification.type)}
                  />
                </View>

                <View style={styles.textContainer}>
                  <View style={styles.titleRow}>
                    <Text
                      style={[
                        styles.title,
                        {
                          color: colors.text,
                          fontWeight: notification.read ? "normal" : "bold",
                        },
                      ]}
                    >
                      {notification.title}
                    </Text>
                    {!notification.read && <View style={styles.unreadDot} />}
                  </View>
                  <Text
                    style={[styles.message, { color: "#9ca3af" }]}
                    numberOfLines={2}
                  >
                    {notification.message}
                  </Text>
                  <Text style={[styles.time, { color: "#6b7280" }]}>
                    {notification.time}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteNotification(notification.id)}
                >
                  <Ionicons name="close-circle" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

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
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  markAllButton: {
    padding: 5,
  },
  unreadBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#a855f7",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  unreadText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  clearText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
  },
  loadingText: {
    fontSize: 16,
    color: "#9ca3af",
    marginTop: 15,
  },
  notificationCard: {
    marginHorizontal: 15,
    marginVertical: 6,
    borderRadius: 12,
    padding: 15,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    marginRight: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  time: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 5,
    marginLeft: 5,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 8,
  },
});

export default Notifications;
