import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";

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
        const storedState = await AsyncStorage.getItem("isSignedIn");
        const accessToken = await AsyncStorage.getItem("accessToken");
        const premiumStatus = await AsyncStorage.getItem("isPremium");

        console.log("Stored state:", storedState);
        console.log("Access Token:", accessToken);
        console.log("Premium Status:", premiumStatus);

        if (storedState === "true" && accessToken) {
          setIsSignedIn(true);
          setIsPremium(premiumStatus === "true");
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkStatus();
  }, []);

  const signIn = async () => {
    setIsSignedIn(true);
    await AsyncStorage.setItem("isSignedIn", "true");
  };

  const signOut = async () => {
    try {
      console.log("🔓 Signing out - Removing tokens from storage");
      await AsyncStorage.removeItem("isSignedIn");
      await AsyncStorage.removeItem("accessToken");
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
