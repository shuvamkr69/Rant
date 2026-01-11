import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { api } from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return null;
    }
    
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.error("Expo project ID not found in app.json");
      return null;
    }
    
    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;
    console.log("📱 Push token:", token);
  } else {
    console.log("Must use physical device for Push Notifications");
  }

  return token;
}

export async function sendPushTokenToBackend(token: string) {
  try {
    await api.post("/api/v1/users/update-push-token", { pushToken: token });
    console.log("✅ Push token sent to backend");
  } catch (error) {
    console.error("❌ Error sending push token:", error);
  }
}

export async function removePushTokenFromBackend() {
  try {
    await api.post("/api/v1/users/remove-push-token");
    console.log("✅ Push token removed from backend");
  } catch (error) {
    console.error("❌ Error removing push token:", error);
  }
}

export function setupNotificationListeners() {
  const notificationListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log("🔔 Notification received:", notification);
    }
  );

  const responseListener =
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("👆 Notification tapped:", response);
    });

  return () => {
    notificationListener.remove();
    responseListener.remove();
  };
}
