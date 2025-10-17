import { useChat } from "@/components/contexts/chatContext";
import { Colors } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatScreen() {
  const { userId, name } = useLocalSearchParams();
  const {
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
  const colors = Colors[colorScheme];
  const router = useRouter();
  const [inputMessage, setInputMessage] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (userId) {
      loadChatHistory(userId as string);
    }
  }, [userId]);

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
              backgroundColor: isMyMessage ? colors.tint : "#E8E8E8",
            },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isMyMessage ? "#000000ff" : "#ffffffff" },
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
                  : "rgba(0,0,0,0.5)",
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
            { backgroundColor: colors.background, borderTopColor: colors.icon },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              { backgroundColor: "#E8E8E8", color: "#000000" },
            ]}
            placeholder={isPending ? "Chat is pending..." : "Type a message..."}
            placeholderTextColor="#999"
            value={inputMessage}
            onChangeText={handleTyping}
            multiline
            maxLength={500}
            editable={!isPending}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: isPending ? "#ccc" : colors.tint },
            ]}
            onPress={handleSend}
            disabled={isPending || !inputMessage.trim()}
          >
            <Ionicons name="send" size={20} color="#ffffff" />
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
  },
  headerName: {
    fontSize: 18,
    fontWeight: "600",
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
