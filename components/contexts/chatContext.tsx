import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

type Message = {
  _id: string;
  senderId: {
    _id: string;
    name: string;
    userType: string;
  };
  receiverId: {
    _id: string;
    name: string;
    userType: string;
  };
  message: string;
  isRead: boolean;
  createdAt: string;
};

type Match = {
  _id: string;
  name: string;
  userType: string;
};

type ChatContextType = {
  socket: any;
  messages: Message[];
  matches: Match[];
  currentChatUser: Match | null;
  setCurrentChatUser: (user: Match | null) => void;
  sendMessage: (receiverId: string, message: string) => void;
  loadChatHistory: (otherUserId: string) => Promise<void>;
  loadMatches: () => Promise<void>;
  isTyping: boolean;
  startTyping: (receiverId: string) => void;
  stopTyping: (receiverId: string) => void;
  isPending: boolean;
  pendingMessage: string;
  reconnectSocket: () => Promise<void>;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentChatUser, setCurrentChatUser] = useState<Match | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");

  useEffect(() => {
    initSocket();

    return () => {
      if (socket) {
        console.log("🔌 Disconnecting socket on unmount");
        socket.disconnect();
      }
    };
  }, []);

  // DO NOT auto-reconnect - this was causing issues
  // Socket should only be initialized once per session
  // Use reconnectSocket() manually if needed

  const initSocket = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      console.log(
        "🔌 Initializing socket with token:",
        token ? token.substring(0, 20) + "..." : "none"
      );

      if (!token) {
        console.log("⚠️ No token found, skipping socket initialization");
        return;
      }

      // Dynamic import to avoid issues
      const { io } = await import("socket.io-client");
      const SOCKET_URL =
        process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:5000";

      console.log("🔌 Connecting to socket server:", SOCKET_URL);

      const newSocket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket"],
      });

      newSocket.on("connect", () => {
        console.log("✅ Socket connected with ID:", newSocket.id);
      });

      newSocket.on("receive_message", (message: Message) => {
        console.log("📨 New message received:", message);
        setMessages((prev) => [...prev, message]);
      });

      newSocket.on("message_sent", (message: Message) => {
        console.log("✅ Message sent confirmation:", message);
      });

      newSocket.on("user_typing", (data: { userId: string }) => {
        if (data.userId === currentChatUser?._id) {
          setIsTyping(true);
        }
      });

      newSocket.on("user_stop_typing", (data: { userId: string }) => {
        if (data.userId === currentChatUser?._id) {
          setIsTyping(false);
        }
      });

      newSocket.on("error", (error: any) => {
        console.error("❌ Socket error:", error);
      });

      setSocket(newSocket);
    } catch (error) {
      console.error("❌ Failed to initialize socket:", error);
    }
  };

  const sendMessage = (receiverId: string, message: string) => {
    console.log("📤 Sending message:", {
      receiverId,
      message,
      socketConnected: !!socket,
    });

    if (!socket) {
      console.error("❌ Socket not connected! Trying to reconnect...");
      initSocket();
      return;
    }

    if (socket && message.trim()) {
      console.log("📨 Emitting send_message event to:", receiverId);
      socket.emit("send_message", { receiverId, message: message.trim() });

      // Optimistically add message to UI
      const tempMessage: any = {
        _id: Date.now().toString(),
        senderId: { _id: "me", name: "You", userType: "" },
        receiverId: { _id: receiverId, name: "", userType: "" },
        message: message.trim(),
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempMessage]);
    }
  };

  const loadChatHistory = async (otherUserId: string) => {
    try {
      const { api } = require("../utils/api");
      console.log("📜 Loading chat history with:", otherUserId);
      const response = await api.get(`/api/v1/users/history/${otherUserId}`);

      if (response.status === 200) {
        console.log(
          "✅ Chat history loaded:",
          response.data.messages.length,
          "messages"
        );
        setMessages(response.data.messages);
        setIsPending(response.data.isPending || false);
        setPendingMessage(response.data.message || "");
      }
    } catch (error) {
      console.error("❌ Error loading chat history:", error);
      setIsPending(false);
      setPendingMessage("");
    }
  };

  const loadMatches = async () => {
    try {
      const { api } = require("../utils/api");
      const response = await api.get("/api/v1/users/fetchMatches");

      if (response.status === 200) {
        console.log(
          "✅ Matches loaded:",
          response.data.matches.length,
          "matches"
        );
        setMatches(response.data.matches);
      }
    } catch (error: any) {
      console.error("❌ Error loading matches:", error);
      console.error("Error details:", error.response?.data || error.message);
    }
  };

  const startTyping = (receiverId: string) => {
    if (socket) {
      socket.emit("typing", { receiverId });
    }
  };

  const stopTyping = (receiverId: string) => {
    if (socket) {
      socket.emit("stop_typing", { receiverId });
    }
  };

  const reconnectSocket = async () => {
    console.log("🔄 Manually reconnecting socket with fresh token...");

    // Completely destroy old socket
    if (socket) {
      console.log("🔌 Removing all listeners and disconnecting old socket");
      socket.removeAllListeners();
      socket.disconnect();
      setSocket(null);
    }

    // Wait a bit to ensure clean disconnect
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Create fresh socket with new token
    await initSocket();
    console.log("✅ Socket reconnection complete");
  };

  return (
    <ChatContext.Provider
      value={{
        socket,
        messages,
        matches,
        currentChatUser,
        setCurrentChatUser,
        sendMessage,
        loadChatHistory,
        loadMatches,
        isTyping,
        startTyping,
        stopTyping,
        isPending,
        pendingMessage,
        reconnectSocket,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
