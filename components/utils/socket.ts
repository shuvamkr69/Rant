import { io, Socket } from "socket.io-client";
import { getAccessToken } from "./tokenStorage";

const SOCKET_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:5000";

let socket: Socket | null = null;

export const initializeSocket = async () => {
  try {
    const token = getAccessToken();
    
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

export const joinRoom = (otherUserId: string) => {
  if (socket?.connected) {
    console.log(`🚪 Emitting join_room for user ${otherUserId}`);
    socket.emit("join_room", { otherUserId });
    
    // Listen for room_joined confirmation
    socket.once("room_joined", (data) => {
    });
  } else {
    console.error("❌ Socket not connected, cannot join room");
  }
};
