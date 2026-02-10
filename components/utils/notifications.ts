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

  try {
    console.log("🔔 Starting push notification registration...");

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
      console.log("✅ Notification channel created");
    }

    if (Device.isDevice) {
      console.log("📱 Running on physical device");
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      console.log("🔐 Current permission status:", existingStatus);

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log("🔐 Permission requested, new status:", finalStatus);
      }

      if (finalStatus !== "granted") {
        console.warn("⚠️ Push notification permission not granted");
        return null;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      console.log("🔑 Project ID:", projectId);

      if (!projectId) {
        console.error("❌ Expo project ID not found in app.json");
        return null;
      }

      console.log("🎫 Requesting Expo push token...");
      try {
        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId,
          })
        ).data;
        console.log("✅ Push token obtained:", token);
      } catch (tokenError: any) {
        console.error("❌ Error getting Expo push token:", tokenError);
        console.error("❌ Token error details:", tokenError?.message);
        
        // If it's a Firebase error, it might be a configuration issue
        if (tokenError?.message?.includes("Firebase") || tokenError?.message?.includes("firebase")) {
          console.warn("⚠️ Firebase-related error detected");
          console.warn("⚠️ This might be due to google-services.json configuration");
        }
        
        throw tokenError; // Re-throw to be caught by outer catch
      }
    } else {
      console.warn("⚠️ Must use physical device for Push Notifications");
    }

    return token;
  } catch (error: any) {
    console.error("❌ Push notification registration failed");
    console.error("❌ Error type:", error?.constructor?.name);
    console.error("❌ Error message:", error?.message);
    console.error("❌ Full error:", JSON.stringify(error, null, 2));
    
    // Handle Firebase not initialized error gracefully
    if (error?.message?.includes("FirebaseApp is not initialized") || 
        error?.message?.includes("Firebase")) {
      console.warn("⚠️ Firebase not configured. Push notifications disabled.");
      console.warn("⚠️ Follow FIREBASE_SETUP.md to enable push notifications.");
    }
    
    return null;
  }
}

export async function sendPushTokenToBackend(token: string) {
  try {
    console.log("🚀 [Push Token] Sending to backend:", token);
    console.log("🚀 [Push Token] Backend URL:", process.env.EXPO_PUBLIC_BACKEND_URL);
    
    // Import here to get fresh token value
    const { getAccessToken } = await import("./tokenStorage");
    const accessToken = getAccessToken();
    console.log("🔑 [Push Token] Access token available:", !!accessToken);
    
    if (!accessToken) {
      console.error("❌ [Push Token] No access token found! Cannot send push token.");
      return false;
    }
    
    const response = await api.post("/api/v1/users/update-push-token", {
      pushToken: token,
    });
    
    console.log("✅ [Push Token] Successfully sent to backend:", response.data);
    return true;
  } catch (error: any) {
    console.error("❌ [Push Token] Failed to send to backend");
    console.error("❌ [Push Token] Error message:", error?.message);
    
    if (error.response) {
      console.error("❌ [Push Token] Response status:", error.response.status);
      console.error("❌ [Push Token] Response data:", error.response.data);
    } else if (error.request) {
      console.error("❌ [Push Token] No response received from server");
      console.error("❌ [Push Token] Request details:", error.request);
    } else {
      console.error("❌ [Push Token] Error details:", error);
    }
    
    return false;
  }
}

export async function removePushTokenFromBackend() {
  try {
    console.log("🗑️ Attempting to remove push token from backend...");
    
    // Create a promise that times out after 5 seconds
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 5000)
    );
    
    const apiPromise = api.post("/api/v1/users/remove-push-token");
    
    // Race between the API call and timeout
    await Promise.race([apiPromise, timeoutPromise]);
    
    console.log("✅ Push token removed from backend");
  } catch (error: any) {
    // Silently handle errors - this is a best-effort operation during logout
    const errorMsg = error?.response?.data?.message || error?.message || 'Unknown error';
    console.warn("⚠️ Could not remove push token from backend (non-critical):", errorMsg);
    
    // Log more details for debugging but don't throw
    if (error?.response?.status) {
      console.warn(`⚠️ Backend returned status: ${error.response.status}`);
    }
    
    // Don't rethrow - allow logout to continue even if this fails
  }
}

export function setupNotificationListeners() {
  const notificationListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log("🔔 Notification received:", notification);
    },
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
