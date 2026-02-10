import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const REFRESH_TOKEN_KEY = "refreshToken";
const ACCESS_TOKEN_KEY = "accessToken"; // Now used for persistence
const ACCESS_TOKEN_EXPIRY_KEY = "accessTokenExpiry";

// In-memory storage for access token (for fast synchronous access)
let accessToken: string | null = null;
let accessTokenExpiry: number | null = null; // Timestamp when token expires

// Access Token Management (In-Memory + AsyncStorage for persistence)
export const setAccessToken = async (
  token: string | null,
  expiresIn?: number,
) => {
  accessToken = token;
  if (token) {
    // Calculate expiry time (default to 15 minutes if not provided)
    const expiryTime =
      Date.now() + (expiresIn ? expiresIn * 1000 : 15 * 60 * 1000);
    accessTokenExpiry = expiryTime;

    try {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
      await AsyncStorage.setItem(
        ACCESS_TOKEN_EXPIRY_KEY,
        expiryTime.toString(),
      );
      console.log("🔑 Access token stored in memory and AsyncStorage");
      console.log(
        `⏰ Access token expires at: ${new Date(expiryTime).toISOString()}`,
      );
    } catch (error) {
      console.error("❌ Error storing access token to AsyncStorage:", error);
      console.log("🔑 Access token stored in memory only");
    }
  } else {
    accessTokenExpiry = null;
    try {
      await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
      await AsyncStorage.removeItem(ACCESS_TOKEN_EXPIRY_KEY);
      console.log("🧹 Access token cleared from memory and AsyncStorage");
    } catch (error) {
      console.error("❌ Error removing access token from AsyncStorage:", error);
    }
  }
};

export const getAccessToken = (): string | null => {
  return accessToken;
};

export const getAccessTokenExpiry = (): number | null => {
  return accessTokenExpiry;
};

export const isAccessTokenExpired = (): boolean => {
  if (!accessTokenExpiry) return true;
  // Consider token expired if it expires in less than 1 minute
  return Date.now() >= accessTokenExpiry - 60000;
};

export const isAccessTokenExpiringSoon = (): boolean => {
  if (!accessTokenExpiry) return true;
  // Consider token expiring soon if it expires in less than 5 minutes
  return Date.now() >= accessTokenExpiry - 5 * 60000;
};

export const clearAccessToken = async () => {
  accessToken = null;
  accessTokenExpiry = null;
  try {
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    await AsyncStorage.removeItem(ACCESS_TOKEN_EXPIRY_KEY);
    console.log("🧹 Access token cleared from memory and AsyncStorage");
  } catch (error) {
    console.error("❌ Error clearing access token from AsyncStorage:", error);
    console.log("🧹 Access token cleared from memory");
  }
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
  await clearAccessToken();
  await clearRefreshToken();
  console.log("🧹 All tokens cleared");
};

// Initialize access token from AsyncStorage on app start
export const initializeAccessToken = async (): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const expiry = await AsyncStorage.getItem(ACCESS_TOKEN_EXPIRY_KEY);

    if (token && expiry) {
      const expiryTime = parseInt(expiry, 10);

      // Check if token is still valid
      if (Date.now() < expiryTime) {
        accessToken = token; // Set in memory
        accessTokenExpiry = expiryTime;
        console.log("✅ Access token loaded from AsyncStorage to memory");
        console.log(
          `⏰ Token expires at: ${new Date(expiryTime).toISOString()}`,
        );
      } else {
        console.log("⚠️ Stored access token is expired, clearing...");
        await clearAccessToken();
      }
    }
  } catch (error) {
    console.error("❌ Error initializing access token:", error);
  }
};
