import { useChat } from "@/components/contexts/chatContext";
import { useTheme } from "@/components/contexts/ThemeContext";
import { useCustomAlert } from "@/components/resuables/CustomAlert";
import RatingModal from "@/components/resuables/RatingModal";
import { api } from "@/components/utils/api";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  AppState,
  BackHandler,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatScreen() {
  const { userId, name } = useLocalSearchParams();
  const {
    socket,
    messages,
    sendMessage,
    loadChatHistory,
    isTyping,
    startTyping,
    stopTyping,
    isPending,
    pendingMessage,
    wordCountStatus,
    sessionStartTime,
    waitingForOtherUser,
    canRateListener,
    currentSessionId,
    resetRatingState,
  } = useChat();
  const { colorScheme } = useTheme();
  const colors = Colors;
  const router = useRouter();
  const { showAlert, AlertComponent } = useCustomAlert();
  const [inputMessage, setInputMessage] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<any>(null);
  const [myProfileData, setMyProfileData] = useState<any>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [otherUserWordLimitExhausted, setOtherUserWordLimitExhausted] =
    useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Check if session is active (both users present and session has started)
  const isSessionActive =
    sessionStartTime && !waitingForOtherUser && !isPending;

  // Show rating modal when session ends and user can rate
  useEffect(() => {
    if (
      canRateListener &&
      currentSessionId &&
      myProfileData?.userType === "User"
    ) {
      setShowRatingModal(true);
    }
  }, [canRateListener, currentSessionId, myProfileData]);

  const handleSubmitRating = async (rating: number, comment: string) => {
    try {
      console.log("📝 Submitting rating:", {
        rating,
        comment,
        sessionId: currentSessionId,
        listenerId: userId,
      });

      const response = await api.post("/api/v1/sessions/rate", {
        sessionId: currentSessionId,
        listenerId: userId,
        rating,
        comment,
      });

      if (response.status === 200) {
        showAlert(
          "Rating Submitted",
          "Thank you for rating your session!",
          [{ text: "OK", style: "default" }],
          { icon: "checkmark-circle", iconColor: "#4CAF50" }
        );
        setShowRatingModal(false);
        resetRatingState();
      }
    } catch (error: any) {
      console.error("❌ Error submitting rating:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to submit rating. Please try again.";
      showAlert("Error", errorMessage, [{ text: "OK", style: "default" }], {
        icon: "alert-circle",
        iconColor: "#ff5252",
      });
    }
  };

  const handleCloseRatingModal = () => {
    setShowRatingModal(false);
    resetRatingState();
  };

  const fetchMyInfo = async () => {
    try {
      const response = await api.get("/api/v1/users/getBalance");
      setMyProfileData({
        walletBalance: response.data.walletBalance,
        userType: response.data.userType,
      });
    } catch (error) {
      setMyProfileData({ walletBalance: 0 });
    }
  };

  // Handle exit confirmation
  const handleExitSession = () => {
    if (isSessionActive && !isExiting) {
      const message =
        elapsedTime < 1800
          ? `Your active session will end.\n\nNote: Sessions must be 30 minutes or longer to count towards your stats. This session has been running for ${formatTime(
              elapsedTime
            )}.`
          : "Your active session will end.";

      showAlert(
        "End Session?",
        message,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "End Session",
            style: "destructive",
            onPress: () => {
              setIsExiting(true);
              if (socket && userId) {
                // Emit end_session instead of leave_room for explicit session ending
                socket.emit("end_session", { otherUserId: userId });
              }
              router.back();
            },
          },
        ],
        { icon: "exit-outline", iconColor: "#ff5252", cancelable: true }
      );
      return true; // Prevent default back action
    }
    return false; // Allow default back action
  };

  // Timer to track elapsed time
  useEffect(() => {
    if (!sessionStartTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor(
        (now.getTime() - new Date(sessionStartTime).getTime()) / 1000
      );
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // Format time as MM:SS or HH:MM:SS
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle refresh when waiting for other user
  const handleRefresh = async () => {
    if (!waitingForOtherUser || !userId || !socket) return;

    setRefreshing(true);

    try {
      // Re-emit join_room to check if the other user has returned
      console.log(`🔄 Refreshing - re-joining room with user ${userId}`);
      socket.emit("join_room", { otherUserId: userId });

      // Wait a bit for the response
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("❌ Error refreshing:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (userId && socket) {
      loadChatHistory(userId as string);

      // Join the room for session tracking
      console.log(`🚪 Joining room with user ${userId}`);
      socket.emit("join_room", { otherUserId: userId });

      // Listen for room_joined confirmation
      socket.once("room_joined", (data: any) => {});

      // Listen for other user's word limit exhausted (for Listeners)
      const handleOtherUserLimitExhausted = (data: any) => {
        console.log("⚠️ Other user word limit exhausted:", data);
        setOtherUserWordLimitExhausted(true);
      };

      socket.on(
        "other_user_word_limit_exhausted",
        handleOtherUserLimitExhausted
      );

      // Listen for session ended by other user
      const handleSessionEndedByOther = (data: any) => {
        console.log("🛑 Session ended by other user:", data);
        // Don't navigate back, let them see the "waiting for other user" message
        // The chatContext will set waitingForOtherUser to true
        showAlert(
          "Session Ended",
          `${name} has ended the session. You can leave the chat or wait for them to return.`,
          [
            { text: "Stay", style: "cancel" },
            {
              text: "Leave Chat",
              style: "default",
              onPress: () => router.back(),
            },
          ],
          { icon: "information-circle", iconColor: "#6b1fa8" }
        );
      };

      socket.on("session_ended_by_other", handleSessionEndedByOther);

      // Cleanup function - leave room when component unmounts
      return () => {
        socket.emit("leave_room", { otherUserId: userId });
        socket.off(
          "other_user_word_limit_exhausted",
          handleOtherUserLimitExhausted
        );
        socket.off("session_ended_by_other", handleSessionEndedByOther);
      };
    }
  }, [userId, socket]);

  useEffect(() => {
    fetchMyInfo();
  }, []);

  // Handle hardware back button (Android)
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        return handleExitSession();
      }
    );

    return () => backHandler.remove();
  }, [isSessionActive, elapsedTime, isExiting]);

  // Handle app state changes (minimize/background)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "background" || nextAppState === "inactive") {
        if (isSessionActive && !isExiting) {
          // Show warning when app is backgrounded
          showAlert(
            "Session Active",
            "You have an active session. Minimizing the app may end your session.",
            [{ text: "OK", style: "default" }],
            { icon: "warning", iconColor: "#ff9800" }
          );
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isSessionActive, isExiting]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = () => {
    if (inputMessage.trim() && userId) {
      sendMessage(userId as string, inputMessage);
      setInputMessage("");
      stopTyping(userId as string);
    }
  };

  const handleTyping = (text: string) => {
    setInputMessage(text);

    if (text.trim() && userId) {
      startTyping(userId as string);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(userId as string);
      }, 1000);
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMyMessage =
      item.senderId._id === "me" || item.senderId._id !== userId;

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessage : styles.theirMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isMyMessage ? "#6b1fa8" : "#222",
            },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              {
                color: isMyMessage ? "#ffffff" : "#fff",
              },
            ]}
          >
            {item.message}
          </Text>
          <Text
            style={[
              styles.messageTime,
              {
                color: isMyMessage
                  ? "rgba(255,255,255,0.7)"
                  : "rgba(255,255,255,0.6)",
              },
            ]}
          >
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: "#6b1fa8",
            borderBottomColor: "#6b1fa8",
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            if (!handleExitSession()) {
              router.back();
            }
          }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerName, { color: "#ffffff" }]}>{name}</Text>

          {/* Word Count for Users */}
          {wordCountStatus && (
            <Text
              style={[
                styles.wordCount,
                {
                  color:
                    wordCountStatus.wordsRemaining < 1000
                      ? "#ff4444"
                      : "#ffffff",
                },
              ]}
            >
              Words: {wordCountStatus.wordsRemaining.toLocaleString()} left
            </Text>
          )}

          {/* Waiting for other user indicator */}
          {waitingForOtherUser && (
            <Text style={[styles.waitingIndicator, { color: "#ffeb3b" }]}>
              Waiting
            </Text>
          )}

          {/* Session Timer - only show when session has started */}
          {sessionStartTime && !waitingForOtherUser && (
            <View style={styles.timerContainer}>
              <Text style={[styles.sessionTimer, { color: "#ffffff" }]}>
                ⏱️ {formatTime(elapsedTime)}
              </Text>
              {elapsedTime < 1800 && myProfileData?.userType === "Listener" && (
                <Text style={[styles.sessionWarning, { color: "#ffeb3b" }]}>
                  {Math.ceil((1800 - elapsedTime) / 60)} min to count
                </Text>
              )}
            </View>
          )}

          {isTyping && (
            <Text style={[styles.typingIndicator, { color: "#ffffff" }]}>
              typing...
            </Text>
          )}
        </View>
      </View>

      {/* Messages List */}
      {isPending ? (
        <View style={styles.pendingContainer}>
          <Ionicons name="time-outline" size={64} color={colors.icon} />
          <Text style={[styles.pendingTitle, { color: colors.text }]}>
            Waiting for Response
          </Text>
          <Text style={[styles.pendingMessage, { color: colors.icon }]}>
            {pendingMessage}
          </Text>
        </View>
      ) : waitingForOtherUser ? (
        <ScrollView
          contentContainerStyle={styles.pendingContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#6b1fa8"
              colors={["#6b1fa8"]}
              title="Pull to refresh"
              titleColor="#6b1fa8"
            />
          }
        >
          <Ionicons name="hourglass-outline" size={64} color="#6b1fa8" />
          <Text style={[styles.pendingTitle, { color: colors.text }]}>
            Waiting for {name} to join
          </Text>
          <Text style={[styles.pendingMessage, { color: colors.icon }]}>
            The session will start once both of you are in the chat.
          </Text>
          <Text style={[styles.pullToRefreshHint, { color: colors.icon }]}>
            Pull down to refresh
          </Text>
        </ScrollView>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.icon }]}>
                Start the conversation!
              </Text>
            </View>
          }
        />
      )}

      {/* Input Area - Disabled when pending */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* 30-minute session requirement info banner - only show for first 30 minutes and for listeners */}
        {sessionStartTime &&
          !waitingForOtherUser &&
          elapsedTime < 1800 &&
          elapsedTime > 0 &&
          myProfileData?.userType === "Listener" && (
            <View style={styles.infoBanner}>
              <Ionicons
                name="information-circle"
                size={16}
                color="#2196F3"
                style={styles.infoBannerIcon}
              />
              <Text style={styles.infoBannerText}>
                Session counts after 30 minutes (
                {Math.ceil((1800 - elapsedTime) / 60)} min left)
              </Text>
            </View>
          )}

        {/* Word Limit Exhausted Banner */}
        {(otherUserWordLimitExhausted ||
          (wordCountStatus && wordCountStatus.wordsRemaining <= 0)) && (
          <View style={styles.limitBanner}>
            <Ionicons
              name="alert-circle"
              size={18}
              color="#6b1fa8"
              style={styles.limitBannerIcon}
            />
            <Text
              style={[styles.limitBannerText, { color: "#fff" }]}
              numberOfLines={1}
            >
              {wordCountStatus && wordCountStatus.wordsRemaining <= 0
                ? "You have no messages left this month"
                : `${name} has no messages left this month`}
            </Text>
          </View>
        )}

        <View
          style={[
            styles.inputContainer,
            { backgroundColor: "#160426ff", borderTopColor: "#6b1fa8" },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor:
                  otherUserWordLimitExhausted ||
                  (wordCountStatus && wordCountStatus.wordsRemaining <= 0) ||
                  waitingForOtherUser
                    ? "#1a1a1a"
                    : "#222",
                color:
                  otherUserWordLimitExhausted ||
                  (wordCountStatus && wordCountStatus.wordsRemaining <= 0) ||
                  waitingForOtherUser
                    ? "#666"
                    : colors.text,
              },
            ]}
            placeholder={
              isPending
                ? "Chat is pending..."
                : waitingForOtherUser
                ? `Waiting for ${name} to join...`
                : otherUserWordLimitExhausted ||
                  (wordCountStatus && wordCountStatus.wordsRemaining <= 0)
                ? "Messages disabled - word limit reached"
                : "Type a message..."
            }
            placeholderTextColor={
              otherUserWordLimitExhausted ||
              (wordCountStatus && wordCountStatus.wordsRemaining <= 0) ||
              waitingForOtherUser
                ? "#555"
                : colors.icon
            }
            value={inputMessage}
            onChangeText={handleTyping}
            multiline
            maxLength={500}
            editable={
              !isPending &&
              !otherUserWordLimitExhausted &&
              !(wordCountStatus && wordCountStatus.wordsRemaining <= 0) &&
              !waitingForOtherUser
            }
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor:
                  isPending ||
                  otherUserWordLimitExhausted ||
                  (wordCountStatus && wordCountStatus.wordsRemaining <= 0) ||
                  waitingForOtherUser
                    ? "#ccc"
                    : "#6b1fa8",
              },
            ]}
            onPress={handleSend}
            disabled={
              isPending ||
              !inputMessage.trim() ||
              otherUserWordLimitExhausted ||
              (wordCountStatus?.wordsRemaining ?? 1) <= 0 ||
              waitingForOtherUser
            }
          >
            <Ionicons name="send" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Custom Alert Component */}
      <AlertComponent />

      {/* Rating Modal */}
      <RatingModal
        visible={showRatingModal}
        listenerName={name as string}
        onClose={handleCloseRatingModal}
        onSubmit={handleSubmitRating}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 15,
  },
  headerInfo: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerName: {
    fontSize: 18,
    fontWeight: "600",
  },
  wordCount: {
    fontSize: 11,
    fontWeight: "500",
    marginLeft: 10,
    marginTop: 2,
  },
  sessionTimer: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 10,
  },
  timerContainer: {
    marginLeft: 10,
    alignItems: "flex-end",
  },
  sessionWarning: {
    fontSize: 10,
    fontWeight: "500",
    fontStyle: "italic",
    marginTop: 2,
  },
  waitingIndicator: {
    fontSize: 13,
    fontWeight: "500",
  },
  walletBalance: {
    fontSize: 16,
    fontWeight: "500",
    color: "#ffffffff",
  },
  typingIndicator: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 2,
  },
  messagesList: {
    padding: 15,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
  },
  messageContainer: {
    marginBottom: 15,
    maxWidth: "75%",
  },
  myMessage: {
    alignSelf: "flex-end",
  },
  theirMessage: {
    alignSelf: "flex-start",
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  pendingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  pendingTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  pendingMessage: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  pullToRefreshHint: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 16,
    fontStyle: "italic",
    opacity: 0.7,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#6b1fa8",
  },
  input: {
    flex: 1,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  limitBanner: {
    backgroundColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#6b1fa8",
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 30,
    marginHorizontal: 10,
    marginBottom: -1,
    bottom: 5,
  },
  limitBannerIcon: {
    marginRight: 10,
  },
  limitBannerText: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  limitBannerClose: {
    padding: 4,
    marginLeft: 8,
  },
  infoBanner: {
    backgroundColor: "rgba(33, 150, 243, 0.1)",
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#2196F3",
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
    marginHorizontal: 10,
    marginBottom: 5,
  },
  infoBannerIcon: {
    marginRight: 8,
  },
  infoBannerText: {
    flex: 1,
    color: "#2196F3",
    fontSize: 12,
    fontWeight: "500",
  },
});
