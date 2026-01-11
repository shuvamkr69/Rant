import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";
import {
  registerForPushNotificationsAsync,
  removePushTokenFromBackend,
  sendPushTokenToBackend,
  setupNotificationListeners,
} from "../utils/notifications";
import {
  clearAllTokens,
  getAccessToken,
  initializeAccessToken,
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
        const accessToken = getAccessToken();
        const premiumStatus = await AsyncStorage.getItem("isPremium");

        console.log("Stored state:", storedState);
        console.log("Access Token:", accessToken ? "present" : "null");
        console.log("Premium Status:", premiumStatus);

        if (storedState === "true" && accessToken) {
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
    const handleForceLogout = (event: any) => {
      console.log("🔔 [Auth] Received force logout event:", event.detail);
      signOut();
    };

    if (typeof window !== "undefined") {
      window.addEventListener(
        "forceLogout",
        handleForceLogout as EventListener
      );
    }

    return () => {
      cleanup();
      if (typeof window !== "undefined") {
        window.removeEventListener(
          "forceLogout",
          handleForceLogout as EventListener
        );
      }
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
