import { useChat } from "@/components/contexts/chatContext";
import { useTheme } from "@/components/contexts/ThemeContext";
import TopBar from "@/components/resuables/TopBar";
import { Colors } from "@/constants/theme";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Chats = () => {
  const { matches, loadMatches, setCurrentChatUser } = useChat();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      loadMatches();
    }, [])
  );

  const handleChatPress = (match: any) => {
    setCurrentChatUser(match);
    // @ts-ignore - Dynamic route navigation
    router.push(`/ChatScreen?userId=${match._id}&name=${match.name}`);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <TopBar />
      <View style={styles.chatsContainer}>
        <View style={styles.cardsContainer}>
          <Text style={[styles.headingText, { color: colors.text }]}>
            Chats
          </Text>

          {matches.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.icon }]}>
                No listeners matched yet. Explore and connect with listeners to start
                ranting!
              </Text>
            </View>
          ) : (
            <FlatList
              data={matches}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.card, { backgroundColor: colors.background, borderColor: colors.icon }]}
                  onPress={() => handleChatPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardContent}>
                    <View
                      style={[styles.avatar, { backgroundColor: colors.tint }]}
                    >
                      <Text style={styles.avatarText}>
                        {item.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.chatInfo}>
                      <Text style={[styles.chatName, { color: colors.text }]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.chatType, { color: colors.icon }]}>
                        {item.userType}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.arrow, { color: colors.icon }]}>›</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatsContainer: {
    flex: 1,
    width: "100%",
  },
  cardsContainer: {
    flex: 1,
    width: "100%",
    marginTop: 30,
  },
  headingText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    marginLeft: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginHorizontal: 15,
    marginVertical: 6,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  chatType: {
    fontSize: 14,
  },
  arrow: {
    fontSize: 30,
    fontWeight: "300",
  },
});

export default Chats;
