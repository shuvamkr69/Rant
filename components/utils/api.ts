import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { APP_EVENTS, appEvents } from "./eventEmitter";
import {
  clearAllTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
} from "./tokenStorage";

const backend_url = process.env.EXPO_PUBLIC_BACKEND_URL;

export const api = axios.create({
    baseURL: backend_url,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
})

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
// Queue to store requests made while token is being refreshed
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

// Process all queued requests with the new token
const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Request interceptor - add access token to headers
api.interceptors.request.use(
  async (config) => {
    const token = getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log('🔵 [API] Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      hasToken: !!token,
      data: config.data,
    });

    return config;
  },
  (error) => {
    console.error('❌ [API] Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging and token refresh
api.interceptors.response.use(
  (response) => {
    console.log('✅ [API] Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    console.error('❌ [API] Response error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
      fullError: error,
    });

    // Check if error is 401 (Unauthorized) and we haven't retried yet
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      // Skip refresh for login and register endpoints
      if (
        originalRequest.url?.includes("/login") ||
        originalRequest.url?.includes("/register") ||
        originalRequest.url?.includes("/refresh-token")
      ) {
        return Promise.reject(error);
      }

      console.log("🔄 [Token Refresh] 401 detected, attempting token refresh...");

      // If already refreshing, queue this request
      if (isRefreshing) {
        console.log("⏳ [Token Refresh] Already refreshing, queuing request...");
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            // Retry with new token
            originalRequest.headers.Authorization = `Bearer ${getAccessToken()}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getRefreshToken();

        if (!refreshToken) {
          console.error("❌ [Token Refresh] No refresh token found");
          throw new Error("No refresh token available");
        }

        console.log("🔄 [Token Refresh] Calling refresh endpoint...");

        // Call refresh token endpoint
        const response = await axios.post(
          `${backend_url}/api/v1/users/refresh-token`,
          { refreshToken }
        );

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          response.data;

        if (!newAccessToken) {
          throw new Error("No access token in refresh response");
        }

        console.log("✅ [Token Refresh] New tokens received");

        // Update tokens in storage
        await setAccessToken(newAccessToken);
        if (newRefreshToken) {
          const { setRefreshToken } = await import("./tokenStorage");
          await setRefreshToken(newRefreshToken);
        }

        // Update authorization header for the original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Process queued requests
        processQueue();
        isRefreshing = false;

        console.log("✅ [Token Refresh] Retrying original request");
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError: any) {
        console.error("❌ [Token Refresh] Failed:", refreshError);

        // Clear failed queue
        processQueue(refreshError);
        isRefreshing = false;

        // Check if refresh token is invalid/expired
        if (
          refreshError.response?.status === 401 ||
          refreshError.message === "No refresh token available"
        ) {
          console.log(
            "🚪 [Token Refresh] Invalid/missing refresh token, forcing logout"
          );

          // Clear all tokens
          await clearAllTokens();

          // Clear other auth-related storage
          await AsyncStorage.removeItem("isSignedIn");
          await AsyncStorage.removeItem("isPremium");

          // Notify the app to redirect to login using React Native event emitter
          appEvents.emit(APP_EVENTS.FORCE_LOGOUT, {
            reason: "token_refresh_failed",
          });

          console.log("✅ [Token Refresh] Forced logout complete");
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);