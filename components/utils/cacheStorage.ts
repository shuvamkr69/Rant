import AsyncStorage from "@react-native-async-storage/async-storage";

// Cache keys
const CACHE_KEYS = {
  PROFILES: "cached_profiles",
  MY_PROFILE: "cached_my_profile",
  USER_STATS: "cached_user_stats",
  MATCHES: "cached_matches",
  PREMIUM_INFO: "cached_premium_info",
  PREMIUM_PRODUCTS: "cached_premium_products",
};

// Cache expiry times (in milliseconds)
const CACHE_EXPIRY = {
  PROFILES: 5 * 60 * 1000, // 5 minutes
  MY_PROFILE: 10 * 60 * 1000, // 10 minutes
  USER_STATS: 10 * 60 * 1000, // 10 minutes
  MATCHES: 2 * 60 * 1000, // 2 minutes
  PREMIUM_INFO: 30 * 60 * 1000, // 30 minutes
  PREMIUM_PRODUCTS: 60 * 60 * 1000, // 1 hour
};

interface CachedData<T> {
  data: T;
  timestamp: number;
}

/**
 * Save data to cache with current timestamp
 */
export const saveToCache = async <T>(key: string, data: T): Promise<void> => {
  try {
    const cachedData: CachedData<T> = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(cachedData));
  } catch (error) {
    console.error(`Error saving to cache (${key}):`, error);
  }
};

/**
 * Get data from cache if it exists and hasn't expired
 */
export const getFromCache = async <T>(
  key: string,
  expiryTime: number,
): Promise<T | null> => {
  try {
    const cachedString = await AsyncStorage.getItem(key);
    if (!cachedString) return null;

    const cachedData: CachedData<T> = JSON.parse(cachedString);
    const isExpired = Date.now() - cachedData.timestamp > expiryTime;

    if (isExpired) {
      // Remove expired cache
      await AsyncStorage.removeItem(key);
      return null;
    }

    return cachedData.data;
  } catch (error) {
    console.error(`Error getting from cache (${key}):`, error);
    return null;
  }
};

/**
 * Clear specific cache
 */
export const clearCache = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Error clearing cache (${key}):`, error);
  }
};

/**
 * Clear all caches
 */
export const clearAllCaches = async (): Promise<void> => {
  try {
    const keys = Object.values(CACHE_KEYS);
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.error("Error clearing all caches:", error);
  }
};

// Export cache keys and expiry times
export { CACHE_EXPIRY, CACHE_KEYS };

