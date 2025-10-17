import AsyncStorage from "@react-native-async-storage/async-storage";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:5000";

let socket: Socket | null = null;

export const initializeSocket = async () => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    
    if (!token) {
      console.error("❌ No access token found");
      return null;
    }

    if (socket?.connected) {
      console.log("✅ Socket already connected");
      return socket;
    }

    socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket?.id);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
    });

    return socket;
  } catch (error) {
    console.error("❌ Error initializing socket:", error);
    return null;
  }
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("🔌 Socket disconnected");
  }
};
