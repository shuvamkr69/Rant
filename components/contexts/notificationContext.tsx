import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "../utils/api";

interface Notification {
  id: string;
  type: "match" | "message" | "system" | "premium" | "session";
  title: string;
  message: string;
  time: string;
  timestamp: number;
  read: boolean;
  data?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "time">,
  ) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

const NOTIFICATIONS_STORAGE_KEY = "@notifications";

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const saveToStorage = async (notifs: Notification[]) => {
    try {
      await AsyncStorage.setItem(
        NOTIFICATIONS_STORAGE_KEY,
        JSON.stringify(notifs),
      );
    } catch (error) {
      console.error("Error saving notifications:", error);
    }
  };

  const loadFromStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        setNotifications(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);

      // Fetch notifications from backend
      const response = await api.get("/api/v1/users/notifications");
      const backendNotifications = response.data.notifications || [];

      // Transform backend notifications to match frontend format
      const formattedNotifications: Notification[] = backendNotifications.map(
        (notif: any) => ({
          id: notif._id,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          time: formatTime(new Date(notif.createdAt).getTime()),
          timestamp: new Date(notif.createdAt).getTime(),
          read: notif.read,
          data: notif.data || {},
        }),
      );

      setNotifications(formattedNotifications);
      await saveToStorage(formattedNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      // Load from local storage as fallback
      await loadFromStorage();
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      // Update backend
      await api.put(`/api/v1/users/notifications/${id}/read`);

      // Update local state
      const updated = notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      );
      setNotifications(updated);
      await saveToStorage(updated);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      // Update locally even if backend fails
      const updated = notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      );
      setNotifications(updated);
      await saveToStorage(updated);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Update backend
      await api.put("/api/v1/users/notifications/mark-all-read");

      // Update local state
      const updated = notifications.map((n) => ({ ...n, read: true }));
      setNotifications(updated);
      await saveToStorage(updated);
    } catch (error) {
      console.error("Error marking all as read:", error);
      // Update locally even if backend fails
      const updated = notifications.map((n) => ({ ...n, read: true }));
      setNotifications(updated);
      await saveToStorage(updated);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      // Delete from backend
      await api.delete(`/api/v1/users/notifications/${id}`);

      // Update local state
      const updated = notifications.filter((n) => n.id !== id);
      setNotifications(updated);
      await saveToStorage(updated);
    } catch (error) {
      console.error("Error deleting notification:", error);
      // Update locally even if backend fails
      const updated = notifications.filter((n) => n.id !== id);
      setNotifications(updated);
      await saveToStorage(updated);
    }
  };

  const clearAll = async () => {
    try {
      // Clear from backend
      await api.delete("/api/v1/users/notifications");

      // Update local state
      setNotifications([]);
      await AsyncStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing notifications:", error);
      // Update locally even if backend fails
      setNotifications([]);
      await AsyncStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
    }
  };

  const addNotification = async (
    notif: Omit<Notification, "id" | "timestamp" | "time">,
  ) => {
    const timestamp = Date.now();
    const newNotif: Notification = {
      ...notif,
      id: `${notif.type}-${timestamp}`,
      timestamp,
      time: formatTime(timestamp),
    };
    const updated = [newNotif, ...notifications];
    setNotifications(updated);
    await saveToStorage(updated);
  };

  useEffect(() => {
    loadFromStorage();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  }
  return context;
};
