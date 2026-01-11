import { User } from "../models/user.model.js";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.pushToken) {
      console.log(`⚠️ No push token found for user ${userId}`);
      return;
    }

    const message = {
      to: user.pushToken,
      sound: "default",
      title,
      body,
      data,
      priority: "high",
    };

    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (result.data && result.data[0]?.status === "error") {
      console.error(
        `❌ Push notification error for ${userId}:`,
        result.data[0].message
      );
      if (result.data[0].details?.error === "DeviceNotRegistered") {
        await User.findByIdAndUpdate(userId, { pushToken: null });
        console.log(`🗑️ Removed invalid push token for user ${userId}`);
      }
    } else {
      console.log(`✅ Push notification sent to user ${userId}`);
    }
  } catch (error) {
    console.error(`❌ Error sending push notification to ${userId}:`, error);
  }
};

export const sendBatchPushNotifications = async (notifications) => {
  try {
    const validNotifications = [];

    for (const notif of notifications) {
      const user = await User.findById(notif.userId);
      if (user && user.pushToken) {
        validNotifications.push({
          to: user.pushToken,
          sound: "default",
          title: notif.title,
          body: notif.body,
          data: notif.data || {},
          priority: "high",
        });
      }
    }

    if (validNotifications.length === 0) {
      console.log("⚠️ No valid push tokens found for batch notification");
      return;
    }

    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validNotifications),
    });

    const result = await response.json();
    console.log(
      `✅ Batch push notifications sent: ${validNotifications.length} messages`
    );

    if (result.data) {
      for (let i = 0; i < result.data.length; i++) {
        if (result.data[i]?.status === "error") {
          console.error(`❌ Notification ${i} failed:`, result.data[i].message);
          if (result.data[i].details?.error === "DeviceNotRegistered") {
            const userId = notifications[i]?.userId;
            if (userId) {
              await User.findByIdAndUpdate(userId, { pushToken: null });
              console.log(`🗑️ Removed invalid push token for user ${userId}`);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ Error sending batch push notifications:", error);
  }
};
