import { useTheme } from "@/components/contexts/ThemeContext";
import TopBar from "@/components/resuables/TopBar";
import { api } from "@/components/utils/api";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Swiper from "react-native-deck-swiper";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function HomeScreen() {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const [profiles, setProfiles] = useState<Array<any>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentUserType, setCurrentUserType] = useState<string>("");
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [preMatchMessage, setPreMatchMessage] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const router = useRouter();

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get("/api/v1/users/myProfile");
      if (response.status === 200) {
        setCurrentUserType(response.data.userType);
        console.log("👤 Current user type:", response.data.userType);
      }
    } catch (error) {
      console.error("❌ Error fetching current user:", error);
    }
  };

  const fetchProfiles = async () => {
    try {
      const response = await api.get("/api/v1/users/profiles");
      if (response.status === 200) {
        console.log("📦 Profiles received:", response.data);
        setProfiles(response.data);
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error("❌ Error fetching profiles:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCurrentUser();
      fetchProfiles();
    }, [])
  );

  const handleSwipeRight = async (cardIndex: number) => {
    try {
      const swipedProfile = profiles[cardIndex];
      console.log(
        "👍 Swiping RIGHT on:",
        swipedProfile?.name,
        "ID:",
        swipedProfile?._id
      );

      const response = await api.post("/api/v1/users/accept", {
        otherUserId: swipedProfile?._id,
        preMatchMessage: preMatchMessage || null, // Send pre-match message if exists
      });

      if (response.status === 200) {
        console.log("✅ Accepted profile successfully:", response.data);
        setPreMatchMessage(""); // Clear message after sending
      }
    } catch (error) {
      console.error("❌ Error accepting profile:", error);
    }
  };

  const handleChatPress = (profile: any) => {
    setSelectedProfile(profile);
    setShowMessageModal(true);
  };

  const handleSendMessageAndSwipeRight = async () => {
    if (!preMatchMessage.trim()) {
      Alert.alert("Error", "Please enter a message");
      return;
    }

    setShowMessageModal(false);

    // Find the profile index and trigger swipe right with message
    const profileIndex = profiles.findIndex(
      (p) => p._id === selectedProfile._id
    );
    if (profileIndex !== -1) {
      await handleSwipeRight(profileIndex);
      // The swiper will automatically move to next card
    }
  };

  const handleSwipeLeft = async (cardIndex: number) => {
    try {
      const swipedProfile = profiles[cardIndex];
      console.log(
        "👎 Swiping LEFT on:",
        swipedProfile?.name,
        "ID:",
        swipedProfile?._id
      );

      const response = await api.post("/api/v1/users/reject", {
        otherUserId: swipedProfile?._id,
      });

      if (response.status === 200) {
        console.log("✅ Rejected profile successfully:", response.data);
      }
    } catch (error) {
      console.error("❌ Error rejecting profile:", error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar />
      <View style={styles.HomeScreen}>
        {profiles.length > 0 ? (
          <Swiper
            cards={profiles}
            renderCard={(card) => {
              if (!card) {
                return (
                  <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.icon }]}>
                    <Text style={[styles.profileCardText, { color: colors.text }]}>No more profiles</Text>
                  </View>
                );
              }

              // Check if current user is "User" viewing "Listener"
              const canSendPreMessage =
                currentUserType === "User" && card.userType === "Listener";

              // Check if this is a Listener viewing a User with pre-match message
              const hasPreMessage =
                currentUserType === "Listener" && card.preMatchMessage;

              return (
                <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.icon }]}>
                  <Text style={[styles.profileCardText, { color: colors.text }]}>
                    {card.name || card.username || "Unknown"}
                  </Text>

                  {/* Show pre-match message if Listener is viewing User's card */}
                  {hasPreMessage && (
                    <View style={[styles.preMessageContainer, { backgroundColor: colorScheme === 'dark' ? '#0f1a1f' : '#f0f8ff', borderLeftColor: colors.tint }]}>
                      <Text style={[styles.preMessageLabel, { color: colors.icon }]}>
                        Message from this user:
                      </Text>
                      <Text style={[styles.preMessageText, { color: colors.text }]}>
                        {card.preMatchMessage}
                      </Text>
                    </View>
                  )}

                  {/* Show chat button if User is viewing Listener */}
                  {canSendPreMessage && (
                    <TouchableOpacity
                      style={[styles.chatButton, { backgroundColor: colors.background, borderColor: colors.icon }]}
                      onPress={() => handleChatPress(card)}
                    >
                      <Ionicons
                        name="chatbubble-outline"
                        size={30}
                        color={colors.tint}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              );
            }}
            cardIndex={currentIndex}
            stackSize={3}
            stackScale={10}
            stackSeparation={15}
            animateCardOpacity
            showSecondCard={true}
            infinite={false}
            verticalSwipe={false}
            horizontalSwipe={true}
            backgroundColor="transparent"
            onSwipedRight={handleSwipeRight}
            onSwipedLeft={handleSwipeLeft}
            onSwiped={(cardIndex) => {
              console.log("📍 Swiped card index:", cardIndex);
              setCurrentIndex(cardIndex + 1);
            }}
            onSwipedAll={() => {
              console.log("🎉 All cards swiped! Fetching new profiles...");
              fetchProfiles();
            }}
          />
        ) : (
          <View style={styles.noProfilesAvailable}>
            <Text style={[styles.noProfilesText, { color: colors.icon }]}>No profiles available</Text>
          </View>
        )}
      </View>

      {/* Pre-Match Message Modal */}
      <Modal
        visible={showMessageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMessageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, borderColor: colors.icon, borderWidth: 1 }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Send a message to {selectedProfile?.name}
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.icon }]}>
              Send an introductory message. Please wait for the listener to accept.
            </Text>

            <TextInput
              style={[styles.messageInput, { color: colors.text, borderColor: colors.icon }]}
              placeholder="Type your message..."
              placeholderTextColor={colors.icon}
              multiline
              maxLength={200}
              value={preMatchMessage}
              onChangeText={setPreMatchMessage}
            />

            <Text style={[styles.charCount, { color: colors.icon }]}>{preMatchMessage.length}/200</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowMessageModal(false);
                  setPreMatchMessage("");
                }}
              >
                <Text style={[styles.cancelButtonText, { color: colors.icon }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.sendButton, { backgroundColor: colors.tint }]}
                onPress={handleSendMessageAndSwipeRight}
              >
                <Text style={[styles.sendButtonText, { color: colorScheme === 'dark' ? '#000' : '#fff' }]}>Send & Like</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#7f7f7fff",
  },
  HomeScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: "-12%",
    width: "100%",
  },
  card: {
    height: SCREEN_HEIGHT * 0.8,
    width: SCREEN_WIDTH * 0.9,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#E8E8E8",
    justifyContent: "flex-end",
    // alignItems: "flex-end",
    backgroundColor: "white",
    padding: 20,
  },
  profileCardText: {
    textAlign: "left",
    fontSize: 32,
    fontWeight: "bold",
    color: "black",
    backgroundColor: "transparent",
  },
  profileBio: {
    textAlign: "center",
    fontSize: 18,
    color: "#666",
    marginTop: 10,
    paddingHorizontal: 20,
  },
  preMessageContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f0f8ff",
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
    width: "90%",
  },
  preMessageLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginBottom: 5,
  },
  preMessageText: {
    fontSize: 16,
    color: "#333",
    fontStyle: "italic",
  },
  chatButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    flexDirection: "row",
    backgroundColor: "#ffffffff",
    borderRadius: 25,
    gap: 8,
  },
  chatButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    width: "85%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  messageInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
    color: "#333",
  },
  charCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 5,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  sendButton: {
    backgroundColor: "#007AFF",
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  noProfilesAvailable: {
    justifyContent: "center",
    alignItems: "center",
  },
  noProfilesText: {
    textAlign: "center",
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
  },
});
