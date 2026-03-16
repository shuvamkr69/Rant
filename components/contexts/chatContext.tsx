import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { api } from "../utils/api";
import {
  CACHE_EXPIRY,
  CACHE_KEYS,
  getFromCache,
  saveToCache,
} from "../utils/cacheStorage";
import { getAccessToken } from "../utils/tokenStorage";

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
  currentSessionId: string | null;
  resetRatingState: () => void;
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
  const [wordCountStatus, setWordCountStatus] =
    useState<WordCountStatus | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [canRateListener, setCanRateListener] = useState(false);
  const [waitingForOtherUser, setWaitingForOtherUser] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Refs to avoid stale closures in socket event handlers
  const currentChatUserRef = useRef<Match | null>(null);
  const socketRef = useRef<any>(null);

  // Keep refs in sync with state
  useEffect(() => {
    currentChatUserRef.current = currentChatUser;
    // Reset typing state when switching chat users
    setIsTyping(false);
  }, [currentChatUser]);

  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  useEffect(() => {
    initSocket();

    return () => {
      if (socketRef.current) {
        console.log("🔌 Disconnecting socket on unmount");
        socketRef.current.disconnect();
      }
    };
  }, []);

  const initSocket = async () => {
    try {
      const token = getAccessToken();
      console.log(
        "🔌 Initializing socket with token:",
        token ? token.substring(0, 20) + "..." : "none",
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
        // Deduplicate: don't add if message with same _id already exists
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
      });

      newSocket.on("message_sent", (message: Message) => {
        // Replace the temporary optimistic message with the server-confirmed one
        setMessages((prev) => {
          // Find the last temp message (senderId._id === "me") that matches
          // the same text and receiverId, and replace it
          const tempIndex = prev.findIndex(
            (m) =>
              m.senderId._id === "me" &&
              m.message === message.message &&
              m.receiverId._id === message.receiverId._id,
          );
          if (tempIndex !== -1) {
            const updated = [...prev];
            updated[tempIndex] = message;
            return updated;
          }
          // If no temp message found, add only if not duplicate
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
      });

      newSocket.on("user_typing", (data: { userId: string }) => {
        if (data.userId === currentChatUserRef.current?._id) {
          setIsTyping(true);
        }
      });

      newSocket.on("user_stop_typing", (data: { userId: string }) => {
        if (data.userId === currentChatUserRef.current?._id) {
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
      newSocket.on(
        "room_joined",
        (data: {
          sessionId?: string;
          sessionStartTime?: string;
          waitingForOtherUser?: boolean;
          bothUsersPresent?: boolean;
        }) => {
          console.log("🚪 Room joined, session data:", JSON.stringify(data));
          console.log("🔍 bothUsersPresent:", data.bothUsersPresent);
          console.log("⏳ waitingForOtherUser:", data.waitingForOtherUser);

          if (data.sessionId) {
            setCurrentSessionId(data.sessionId);
          }
          if (data.sessionStartTime) {
            setSessionStartTime(new Date(data.sessionStartTime));
            setWaitingForOtherUser(false);
            console.log(
              "✅ Session start time set, waitingForOtherUser = false",
            );
          } else if (data.waitingForOtherUser) {
            setWaitingForOtherUser(true);
            setSessionStartTime(null);
            console.log("⏳ Waiting for other user...");
          }
        },
      );

      // Session actually started (when both users are present)
      newSocket.on(
        "session_started",
        (data: { sessionId: string; sessionStartTime: string }) => {
          console.log("🚀 Session started with both users:", data);
          setCurrentSessionId(data.sessionId);
          setSessionStartTime(new Date(data.sessionStartTime));
          setWaitingForOtherUser(false);
        },
      );

      // Session resumed (when user comes back)
      newSocket.on(
        "session_resumed",
        (data: { sessionId: string; sessionStartTime: string }) => {
          console.log("▶️ Session resumed:", data);
          setCurrentSessionId(data.sessionId);
          setSessionStartTime(new Date(data.sessionStartTime));
          setWaitingForOtherUser(false);
        },
      );

      // Session ended
      newSocket.on(
        "session_ended",
        (data: {
          sessionId: string;
          durationInSeconds: number;
          requestRating?: boolean;
        }) => {
          console.log("🏁 Session ended:", data);
          setCurrentSessionId(data.sessionId);
          setSessionDuration(data.durationInSeconds);
          setSessionStartTime(null);
          setWaitingForOtherUser(false);
          if (data.requestRating) {
            setCanRateListener(true);
          }
        },
      );

      // Session ended by other user
      newSocket.on(
        "session_ended_by_other",
        (data: { message: string; endedBy: string }) => {
          console.log("🛑 Session ended by other user:", data);
          setSessionStartTime(null);
          setWaitingForOtherUser(true); // Show "waiting for other user" if they try to stay
        },
      );

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
      // Try to get from cache first
      const cachedMatches = await getFromCache<Match[]>(
        CACHE_KEYS.MATCHES,
        CACHE_EXPIRY.MATCHES,
      );

      if (cachedMatches) {
        console.log("✅ Loading matches from cache");
        setMatches(cachedMatches);
        // Still fetch from API in background to update cache
        fetchMatchesFromAPI();
        return;
      }

      // No cache, fetch from API
      await fetchMatchesFromAPI();
    } catch (error: any) {
      console.error("❌ Error loading matches:", error);
      console.error("Error details:", error.response?.data || error.message);
    }
  };

  const fetchMatchesFromAPI = async () => {
    try {
      const response = await api.get("/api/v1/users/fetchMatches");

      if (response.status === 200) {
        setMatches(response.data.matches);
        // Save to cache
        await saveToCache(CACHE_KEYS.MATCHES, response.data.matches);
      }
    } catch (error: any) {
      console.error("❌ Error fetching matches from API:", error);
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

  const resetRatingState = () => {
    setCanRateListener(false);
    setCurrentSessionId(null);
    setSessionDuration(0);
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
        currentSessionId,
        resetRatingState,
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
