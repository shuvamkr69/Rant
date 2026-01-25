import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
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
          accessToken ? "present" : "null"
        );
        console.log(
          "🔍 [Auth] Refresh Token:",
          refreshToken ? "present" : "null"
        );
        console.log("🔍 [Auth] Premium Status:", premiumStatus);

        // If user should be signed in but no access token in memory
        if (storedState === "true" && !accessToken && refreshToken) {
          console.log(
            "🔄 [Auth] No access token in memory, but refresh token exists. Refreshing..."
          );

          try {
            // Use refresh token to get new access token
            const backend_url = process.env.EXPO_PUBLIC_BACKEND_URL;
            const response = await axios.post(
              `${backend_url}/api/v1/users/refresh-token`,
              { refreshToken }
            );

            const {
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
            } = response.data;

            if (newAccessToken) {
              console.log(
                "✅ [Auth] Successfully refreshed access token on app start"
              );
              await setAccessToken(newAccessToken);
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
              refreshError
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
          registerForPushNotificationsAsync()
            .then((pushToken) => {
              if (pushToken) {
                sendPushTokenToBackend(pushToken);
              }
            })
            .catch((error) => {
              console.error("Failed to register push token:", error);
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

    return () => {
      cleanup();
      appEvents.off(APP_EVENTS.FORCE_LOGOUT, handleForceLogout);
    };
  }, []);

  const signIn = async () => {
    setIsSignedIn(true);
    await AsyncStorage.setItem("isSignedIn", "true");
  };

  const signOut = async () => {
    try {
      console.log("🔓 Signing out - Removing tokens from storage");

      // Remove push token from backend (non-blocking, best effort)
      removePushTokenFromBackend().catch((error) => {
        console.error("Failed to remove push token:", error);
      });

      // Clear all tokens
      await clearAllTokens();

      // Clear auth state
      await AsyncStorage.removeItem("isSignedIn");
      await AsyncStorage.removeItem("isPremium");

      setIsSignedIn(false);
      setUser(null);
      setIsPremium(false);
      console.log("✅ Sign out complete - All tokens removed");
    } catch (error) {
      console.error("❌ Error signing out:", error);
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
