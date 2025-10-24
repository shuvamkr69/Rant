import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";

type AuthContextType = {
  isSignedIn: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  user: any;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const storedState = await AsyncStorage.getItem("isSignedIn");
        const accessToken = await AsyncStorage.getItem("accessToken");

        console.log("Stored state:", storedState);
        console.log("Access Token:", accessToken);

        if (storedState === "true" && accessToken) {
          setIsSignedIn(true);
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
      setIsSignedIn(false);
      setUser(null);
      console.log("✅ Sign out complete - All tokens removed");
    } catch (error) {
      console.error("❌ Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ isSignedIn, signIn, signOut, user, isLoading }}
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
