import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { clearAllCaches } from "../utils/cacheStorage";
import { APP_EVENTS, appEvents } from "../utils/eventEmitter";
import {
  registerForPushNotificationsAsync,
  removePushTokenFromBackend,
  sendPushTokenToBackend,
  setupNotificationListeners,
} from "../utils/notifications";
import {
  clearAllTokens,
  getAccessToken,
  getRefreshToken,
  initializeAccessToken,
  isAccessTokenExpiringSoon,
  setAccessToken,
  setRefreshToken,
} from "../utils/tokenStorage";

type AuthContextType = {
  isSignedIn: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  user: any;
  isLoading: boolean;
  isPremium: boolean;
  updatePremiumStatus: (status: boolean) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  // Function to refresh the access token
  const refreshAccessToken = async (): Promise<boolean> => {
    try {
      const refreshToken = await getRefreshToken();

      if (!refreshToken) {
        console.error("❌ [Auth] No refresh token found");
        return false;
      }

      console.log("🔄 [Auth] Proactively refreshing access token...");

      const backend_url = process.env.EXPO_PUBLIC_BACKEND_URL;
      const response = await axios.post(
        `${backend_url}/api/v1/users/refresh-token`,
        { refreshToken },
      );

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        response.data;

      if (newAccessToken) {
        console.log("✅ [Auth] Successfully refreshed access token");
        // Assuming token expires in 15 minutes (900 seconds) by default
        await setAccessToken(newAccessToken, 900);
        if (newRefreshToken) {
          await setRefreshToken(newRefreshToken);
        }
        return true;
      } else {
        console.error("❌ [Auth] No access token in refresh response");
        return false;
      }
    } catch (refreshError: any) {
      console.error("❌ [Auth] Failed to refresh token:", refreshError);

      // If refresh token is invalid/expired, force logout
      if (refreshError.response?.status === 401) {
        console.log("🚪 [Auth] Refresh token expired, forcing logout");
        await signOut();
      }

      return false;
    }
  };

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Initialize access token from AsyncStorage (one-time migration)
        await initializeAccessToken();

        const storedState = await AsyncStorage.getItem("isSignedIn");
        let accessToken = getAccessToken();
        const refreshToken = await getRefreshToken();
        const premiumStatus = await AsyncStorage.getItem("isPremium");

        console.log("🔍 [Auth] Checking auth status on app start...");
        console.log("🔍 [Auth] Stored state:", storedState);
        console.log(
          "🔍 [Auth] Access Token:",
          accessToken ? "present" : "null",
        );
        console.log(
          "🔍 [Auth] Refresh Token:",
          refreshToken ? "present" : "null",
        );
        console.log("🔍 [Auth] Premium Status:", premiumStatus);

        // If user should be signed in but no access token in memory
        if (storedState === "true" && !accessToken && refreshToken) {
          console.log(
            "🔄 [Auth] No access token in memory, but refresh token exists. Refreshing...",
          );

          try {
            // Use refresh token to get new access token
            const backend_url = process.env.EXPO_PUBLIC_BACKEND_URL;
            const response = await axios.post(
              `${backend_url}/api/v1/users/refresh-token`,
              { refreshToken },
            );

            const {
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
            } = response.data;

            if (newAccessToken) {
              console.log(
                "✅ [Auth] Successfully refreshed access token on app start",
              );
              await setAccessToken(newAccessToken, 900); // 15 minutes
              if (newRefreshToken) {
                await setRefreshToken(newRefreshToken);
              }
              accessToken = newAccessToken;
            } else {
              console.error("❌ [Auth] No access token in refresh response");
              throw new Error("No access token in refresh response");
            }
          } catch (refreshError: any) {
            console.error(
              "❌ [Auth] Failed to refresh token on app start:",
              refreshError,
            );
            console.log("🚪 [Auth] Clearing auth state and forcing logout");

            // Clear all auth data
            await clearAllTokens();
            await AsyncStorage.removeItem("isSignedIn");
            await AsyncStorage.removeItem("isPremium");
            setIsSignedIn(false);
            setIsPremium(false);
            setIsLoading(false);
            return;
          }
        }

        if (storedState === "true" && accessToken) {
          console.log("✅ [Auth] User is authenticated");
          setIsSignedIn(true);
          setIsPremium(premiumStatus === "true");

          // Register push token when app opens and user is signed in (non-blocking)
          console.log("🔔 [Auth] Starting push token registration...");
          registerForPushNotificationsAsync()
            .then((pushToken) => {
              console.log(
                "🔔 [Auth] Push token received from registration:",
                pushToken,
              );
              if (pushToken) {
                console.log("🔔 [Auth] Sending push token to backend...");
                sendPushTokenToBackend(pushToken);
              } else {
                console.warn(
                  "⚠️ [Auth] Push token is null, not sending to backend",
                );
              }
            })
            .catch((error) => {
              console.error("❌ [Auth] Failed to register push token:", error);
            });
        } else {
          console.log("ℹ️ [Auth] User is not authenticated");
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkStatus();

    // Setup notification listeners
    const cleanup = setupNotificationListeners();

    // Listen for forced logout events from API interceptor
    const handleForceLogout = (data: any) => {
      console.log("🔔 [Auth] Received force logout event:", data);
      signOut();
    };

    appEvents.on(APP_EVENTS.FORCE_LOGOUT, handleForceLogout);

    // Set up periodic token refresh check (every 2 minutes)
    const tokenRefreshInterval = setInterval(
      async () => {
        // Only check if user is signed in
        if (!isSignedIn) return;

        const accessToken = getAccessToken();
        if (!accessToken) {
          console.log("⚠️ [Auth] No access token found during periodic check");
          return;
        }

        // Check if token is expiring soon
        if (isAccessTokenExpiringSoon()) {
          console.log("⏰ [Auth] Access token expiring soon, refreshing...");
          const refreshed = await refreshAccessToken();

          if (!refreshed) {
            console.log(
              "❌ [Auth] Failed to refresh token during periodic check",
            );
          }
        }
      },
      2 * 60 * 1000,
    ); // Check every 2 minutes

    return () => {
      cleanup();
      clearInterval(tokenRefreshInterval);
      appEvents.off(APP_EVENTS.FORCE_LOGOUT, handleForceLogout);
    };
  }, [isSignedIn]);

  const signIn = async () => {
    setIsSignedIn(true);
    await AsyncStorage.setItem("isSignedIn", "true");
  };

  const signOut = async () => {
    try {
      console.log("🔓 Signing out - Starting logout process");

      // Try to remove push token from backend BEFORE clearing tokens (best effort)
      // This needs to be done while we still have a valid access token
      try {
        await removePushTokenFromBackend();
      } catch (error) {
        console.warn("⚠️ Failed to remove push token (non-critical):", error);
        // Continue with logout even if this fails
      }

      // Clear all tokens
      await clearAllTokens();
      console.log("🧹 All tokens cleared");

      // Clear all cached data
      await clearAllCaches();
      console.log("🗑️ All caches cleared");

      // Clear auth state
      await AsyncStorage.removeItem("isSignedIn");
      await AsyncStorage.removeItem("isPremium");

      setIsSignedIn(false);
      setUser(null);
      setIsPremium(false);
      console.log("✅ Sign out complete - User logged out successfully");
    } catch (error) {
      console.error("❌ Error during sign out:", error);
      
      // Even if there's an error, ensure user is logged out locally
      try {
        await clearAllTokens();
        await AsyncStorage.removeItem("isSignedIn");
        await AsyncStorage.removeItem("isPremium");
        setIsSignedIn(false);
        setUser(null);
        setIsPremium(false);
        console.log("✅ Forced local logout after error");
      } catch (finalError) {
        console.error("❌ Critical error during forced logout:", finalError);
      }
    }
  };

  const updatePremiumStatus = async (status: boolean) => {
    setIsPremium(status);
    await AsyncStorage.setItem("isPremium", status.toString());
  };

  return (
    <AuthContext.Provider
      value={{
        isSignedIn,
        signIn,
        signOut,
        user,
        isLoading,
        isPremium,
        updatePremiumStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
