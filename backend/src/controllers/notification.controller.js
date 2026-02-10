import Notification from "../models/notification.model.js";

// Get all notifications for the logged-in user
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 50, skip = 0 } = req.query;

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const unreadCount = await Notification.countDocuments({
      userId,
      read: false,
    });

    res.status(200).json({
      notifications,
      unreadCount,
      total: notifications.length,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Mark a notification as read
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany({ userId, read: false }, { read: true });

    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a notification
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Clear all notifications
export const clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.deleteMany({ userId });

    res.status(200).json({ message: "All notifications cleared" });
  } catch (error) {
    console.error("Error clearing notifications:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create a notification (internal use or admin)
export const createNotification = async (req, res) => {
  try {
    const { userId, type, title, message, data } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        message: "userId, type, title, and message are required",
      });
    }

    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      data: data || {},
    });

    res.status(201).json({
      message: "Notification created successfully",
      notification,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get unread count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const unreadCount = await Notification.countDocuments({
      userId,
      read: false,
    });

    res.status(200).json({ unreadCount });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Helper function to create notification (for internal use in other controllers)
export const createNotificationHelper = async (
  userId,
  type,
  title,
  message,
  data = {},
) => {
  try {
    await Notification.create({
      userId,
      type,
      title,
      message,
      data,
    });
    console.log(`✅ Notification created for user ${userId}: ${title}`);
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};
