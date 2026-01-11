import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const REFRESH_TOKEN_KEY = "refreshToken";
const ACCESS_TOKEN_KEY = "accessToken"; // For fallback only

// In-memory storage for access token
let accessToken: string | null = null;

// Access Token Management (In-Memory)
export const setAccessToken = (token: string | null) => {
  accessToken = token;
  console.log("🔑 Access token stored in memory");
};

export const getAccessToken = (): string | null => {
  return accessToken;
};

export const clearAccessToken = () => {
  accessToken = null;
  console.log("🧹 Access token cleared from memory");
};

// Refresh Token Management (Secure Storage)
export const setRefreshToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    console.log("🔐 Refresh token stored securely");
  } catch (error) {
    console.error("❌ Error storing refresh token:", error);
    // Fallback to AsyncStorage if SecureStore fails
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
    console.log("⚠️ Refresh token stored in AsyncStorage (fallback)");
  }
};

export const getRefreshToken = async (): Promise<string | null> => {
  try {
    const token = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    return token;
  } catch (error) {
    console.error("❌ Error retrieving refresh token:", error);
    // Fallback to AsyncStorage
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  }
};

export const clearRefreshToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    console.log("🧹 Refresh token cleared from secure storage");
  } catch (error) {
    console.error("❌ Error clearing refresh token:", error);
    // Fallback to AsyncStorage
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

// Clear all tokens
export const clearAllTokens = async (): Promise<void> => {
  clearAccessToken();
  await clearRefreshToken();
  // Also clear from AsyncStorage (legacy)
  await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
  console.log("🧹 All tokens cleared");
};

// Initialize access token from AsyncStorage on app start (one-time migration)
export const initializeAccessToken = async (): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      setAccessToken(token);
      // Remove from AsyncStorage after migration
      await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
      console.log("✅ Access token migrated from AsyncStorage to memory");
    }
  } catch (error) {
    console.error("❌ Error initializing access token:", error);
  }
};
