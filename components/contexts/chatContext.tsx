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

type WordCountStatus = {
  wordsUsed: number;
  wordLimit: number;
  wordsRemaining: number;
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
  wordCountStatus: WordCountStatus | null;
  sessionStartTime: Date | null;
  sessionDuration: number; // in seconds
  canRateListener: boolean;
  waitingForOtherUser: boolean;
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
  const [wordCountStatus, setWordCountStatus] = useState<WordCountStatus | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [canRateListener, setCanRateListener] = useState(false);
  const [waitingForOtherUser, setWaitingForOtherUser] = useState(false);

  useEffect(() => {
    initSocket();

    return () => {
      if (socket) {
        console.log("🔌 Disconnecting socket on unmount");
        socket.disconnect();
      }
    };
  }, []);

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

      const { io } = await import("socket.io-client");
      const SOCKET_URL =
        process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:5000";

      const newSocket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket"],
      });

      newSocket.on("connect", () => {
        console.log("✅ Socket connected in ChatContext:", newSocket.id);
      });

      newSocket.on("receive_message", (message: Message) => {
        setMessages((prev) => [...prev, message]);
      });

      newSocket.on("message_sent", (message: Message) => {});

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

      // Word count update
      newSocket.on("word_count_update", (data: WordCountStatus) => {
        console.log("📊 Word count updated:", data);
        setWordCountStatus(data);
      });

      // Word limit exceeded
      newSocket.on("word_limit_exceeded", (data: any) => {
        console.log("⚠️ Word limit exceeded:", data);
        alert(data.message);
        setWordCountStatus({
          wordsUsed: data.wordsUsed,
          wordLimit: data.wordLimit,
          wordsRemaining: data.wordsRemaining,
        });
      });

      // Session started/joined
      newSocket.on("room_joined", (data: { sessionStartTime?: string; waitingForOtherUser?: boolean }) => {
        console.log("🚪 Room joined, session data:", data);
        if (data.sessionStartTime) {
          setSessionStartTime(new Date(data.sessionStartTime));
          setWaitingForOtherUser(false);
        } else if (data.waitingForOtherUser) {
          setWaitingForOtherUser(true);
          setSessionStartTime(null);
        }
      });

      // Session actually started (when both users are present)
      newSocket.on("session_started", (data: { sessionStartTime: string }) => {
        console.log("🚀 Session started with both users:", data);
        setSessionStartTime(new Date(data.sessionStartTime));
        setWaitingForOtherUser(false);
      });

      // Session resumed (when user comes back)
      newSocket.on("session_resumed", (data: { sessionStartTime: string }) => {
        console.log("▶️ Session resumed:", data);
        setSessionStartTime(new Date(data.sessionStartTime));
        setWaitingForOtherUser(false);
      });

      // Session ended
      newSocket.on("session_ended", (data: { durationInSeconds: number; requestRating?: boolean }) => {
        console.log("🏁 Session ended:", data);
        setSessionDuration(data.durationInSeconds);
        setSessionStartTime(null);
        setWaitingForOtherUser(false);
        if (data.requestRating) {
          setCanRateListener(true);
        }
      });

      // Session ended by other user
      newSocket.on("session_ended_by_other", (data: { message: string; endedBy: string }) => {
        console.log("🛑 Session ended by other user:", data);
        setSessionStartTime(null);
        setWaitingForOtherUser(true); // Show "waiting for other user" if they try to stay
      });

      newSocket.on("error", (error: any) => {
        console.error("❌ Socket error:", error);
      });

      newSocket.on("disconnect", (reason: string) => {
        console.log("❌ Socket disconnected in ChatContext:", reason);
      });

      newSocket.on("connect_error", (error: any) => {
        console.error("❌ Socket connection error:", error.message);
      });

      setSocket(newSocket);
      console.log("🔌 Socket instance set in context");
    } catch (error) {
      console.error("❌ Failed to initialize socket:", error);
    }
  };

  const sendMessage = (receiverId: string, message: string) => {

    if (!socket) {
      console.error("❌ Socket not connected! Trying to reconnect...");
      initSocket();
      return;
    }

    if (socket && message.trim()) {
      socket.emit("send_message", { receiverId, message: message.trim() });

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
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      setSocket(null);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    await initSocket();
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
        wordCountStatus,
        sessionStartTime,
        sessionDuration,
        canRateListener,
        waitingForOtherUser,
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
