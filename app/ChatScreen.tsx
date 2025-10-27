import { useChat } from "@/components/contexts/chatContext";
import { useTheme } from "@/components/contexts/ThemeContext";
import { api } from "@/components/utils/api";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
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
  } = useChat();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme] as any;
  const router = useRouter();
  const [inputMessage, setInputMessage] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<any>(null);
  const [myProfileData, setMyProfileData] = useState<any>(null);
  const animatedValuesRef = useRef<Map<string, Animated.Value>>(new Map());

  const fetchMyInfo = async () => {
    try {
      const response = await api.get("/api/v1/users/getBalance");
      setMyProfileData({ walletBalance: response.data.walletBalance });
    } catch (error) {
      setMyProfileData({ walletBalance: 0 });
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

      // Cleanup function - leave room when component unmounts
      return () => {
        socket.emit("leave_room", { otherUserId: userId });
      };
    }
  }, [userId, socket]);

  useEffect(() => {
    fetchMyInfo();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      messages.forEach((message, index) => {
        if (!animatedValuesRef.current.has(message._id)) {
          const animValue = new Animated.Value(0);
          animatedValuesRef.current.set(message._id, animValue);
          
          Animated.spring(animValue, {
            toValue: 1,
            tension: 50,
            friction: 7,
            delay: index * 50,
            useNativeDriver: true,
          }).start();
        }
      });
      
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

    const animValue = animatedValuesRef.current.get(item._id) || new Animated.Value(1);

    const translateY = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [-20, 0],
    });

    const opacity = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    const scale = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1],
    });

    return (
      <Animated.View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessage : styles.theirMessage,
          {
            opacity,
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isMyMessage
                ? "#6b1fa8"
                : colorScheme === "dark"
                ? "#2a1040"
                : "#e9d5f5",
            },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              {
                color: isMyMessage
                  ? "#ffffff"
                  : colorScheme === "dark"
                  ? "#e9d5f5"
                  : "#2a1040",
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
                  : colorScheme === "dark"
                  ? "rgba(233,213,245,0.6)"
                  : "rgba(42,16,64,0.6)",
              },
            ]}
          >
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </Animated.View>
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
            backgroundColor: colors.background,
            borderBottomColor: colors.icon,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerName, { color: colors.text }]}>
            {name}
          </Text>
          <Text style={styles.walletBalance}>
            Balance: {myProfileData?.walletBalance}
          </Text>
          {isTyping && (
            <Text style={[styles.typingIndicator, { color: colors.icon }]}>
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
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: colors.background, borderTopColor: "#6b1fa8" },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colorScheme === "dark" ? "#2a1040" : "#f5ebfc",
                color: colors.text,
                borderWidth: 1,
                borderColor: "#6b1fa8",
              },
            ]}
            placeholder={isPending ? "Chat is pending..." : "Type a message..."}
            placeholderTextColor={colorScheme === "dark" ? "#a56fcc" : "#8442b8"}
            value={inputMessage}
            onChangeText={handleTyping}
            multiline
            maxLength={500}
            editable={!isPending}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: isPending ? "#ccc" : "#6b1fa8" },
            ]}
            onPress={handleSend}
            disabled={isPending || !inputMessage.trim()}
          >
            <Ionicons
              name="send"
              size={20}
              color="#ffffff"
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  walletBalance: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6b1fa8",
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
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 10,
    borderTopWidth: 1,
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
});
