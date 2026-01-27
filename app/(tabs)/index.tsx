import { useTheme } from "@/components/contexts/ThemeContext";
import { HomeScreenSkeleton } from "@/components/skeletons";
import { api } from "@/components/utils/api";
import {
  CACHE_EXPIRY,
  CACHE_KEYS,
  clearCache,
  getFromCache,
  saveToCache,
} from "@/components/utils/cacheStorage";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
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
  const colors = Colors;
  const [profiles, setProfiles] = useState<Array<any>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentUserType, setCurrentUserType] = useState<string>("");
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [preMatchMessage, setPreMatchMessage] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get("/api/v1/users/myProfile");
      if (response.status === 200) {
        setCurrentUserType(response.data.userType);
      }
    } catch (error) {
      console.error("❌ Error fetching current user:", error);
    }
  };

  const fetchProfiles = async (useCache: boolean = true) => {
    try {
      // Try to get from cache first
      if (useCache) {
        const cachedProfiles = await getFromCache<any[]>(
          CACHE_KEYS.PROFILES,
          CACHE_EXPIRY.PROFILES,
        );
        if (cachedProfiles) {
          console.log("✅ Loading profiles from cache");
          setProfiles(cachedProfiles);
          setCurrentIndex(0);
          setIsLoading(false);
          return;
        }
      }

      // Fetch from API if no cache or cache expired
      console.log("📡 Fetching profiles from API");
      const response = await api.get("/api/v1/users/profiles");
      if (response.status === 200) {
        setProfiles(response.data);
        setCurrentIndex(0);
        // Save to cache
        await saveToCache(CACHE_KEYS.PROFILES, response.data);
      }
    } catch (error) {
      console.error("❌ Error fetching profiles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      // Check if we have cached data
      const loadData = async () => {
        const cachedProfiles = await getFromCache<any[]>(
          CACHE_KEYS.PROFILES,
          CACHE_EXPIRY.PROFILES,
        );

        // Only show loading skeleton if no cache exists
        if (!cachedProfiles) {
          setIsLoading(true);
        }

        fetchCurrentUser();
        fetchProfiles();
      };

      loadData();
    }, []),
  );

  const handleSwipeRight = async (cardIndex: number) => {
    try {
      const swipedProfile = profiles[cardIndex];

      const response = await api.post("/api/v1/users/accept", {
        otherUserId: swipedProfile?._id,
        preMatchMessage: preMatchMessage || null, // Send pre-match message if exists
      });

      if (response.status === 200) {
        setPreMatchMessage(""); // Clear message after sending
        // Invalidate matches cache as a new match may have been created
        await clearCache(CACHE_KEYS.MATCHES);
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
      (p) => p._id === selectedProfile._id,
    );
    if (profileIndex !== -1) {
      await handleSwipeRight(profileIndex);
      // The swiper will automatically move to next card
    }
  };

  const handleSwipeLeft = async (cardIndex: number) => {
    try {
      const swipedProfile = profiles[cardIndex];

      const response = await api.post("/api/v1/users/reject", {
        otherUserId: swipedProfile?._id,
      });
    } catch (error) {
      console.error("❌ Error rejecting profile:", error);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={[]}
    >
      {isLoading ? (
        <HomeScreenSkeleton />
      ) : (
        <View style={styles.HomeScreen}>
          {profiles.length > 0 ? (
            <Swiper
              cards={profiles}
              renderCard={(card) => {
                if (!card) {
                  return (
                    <View
                      style={[
                        styles.card,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.icon,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.profileCardText, { color: colors.text }]}
                      >
                        No more profiles
                      </Text>
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
                  <View
                    style={[
                      styles.card,
                      {
                        backgroundColor: colors.background,
                        borderColor: "#2A2A2A",
                      },
                    ]}
                  >
                    <Image
                      source={{ uri: card.profileImage }}
                      style={styles.profileImage}
                    />
                    <LinearGradient
                      colors={[
                        "transparent",
                        "rgba(0,0,0,0.3)",
                        "rgba(0,0,0,0.8)",
                        "rgba(0,0,0,0.95)",
                      ]}
                      style={styles.profileInfoContainer}
                    >
                      <Text
                        style={[styles.profileCardText, { color: colors.text }]}
                      >
                        {card.name || card.username || " "} {card.age || " "}
                      </Text>
                      <Text
                        style={[styles.occupationText, { color: colors.icon }]}
                      >
                        {card.occupation || " "}
                      </Text>

                      {/* Show rating for Listeners */}
                      {card.userType === "Listener" && card.listenerStats && (
                        <View style={styles.ratingContainer}>
                          <Ionicons name="star" size={16} color="#FFD700" />
                          <Text style={styles.ratingText}>
                            {card.listenerStats.averageRating > 0
                              ? card.listenerStats.averageRating.toFixed(1)
                              : "New"}{" "}
                            {card.listenerStats.totalRatings > 0 && (
                              <Text style={styles.ratingCountText}>
                                ({card.listenerStats.totalRatings})
                              </Text>
                            )}
                          </Text>
                        </View>
                      )}

                      <Text style={[styles.profileBio, { color: colors.text }]}>
                        {card.bio || "No bio available"}
                      </Text>

                      {hasPreMessage && (
                        <View
                          style={[
                            styles.preMessageContainer,
                            {
                              backgroundColor: "#0f1a1f",
                              borderLeftColor: colors.tint,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.preMessageText,
                              { color: colors.text },
                            ]}
                          >
                            {card.preMatchMessage}
                          </Text>
                        </View>
                      )}
                    </LinearGradient>

                    {canSendPreMessage && (
                      <TouchableOpacity
                        style={[
                          styles.chatButton,
                          {
                            backgroundColor: colors.background,
                            borderColor: colors.icon,
                          },
                        ]}
                        onPress={() => handleChatPress(card)}
                      >
                        <Ionicons
                          name="chatbubble-outline"
                          size={30}
                          color={"#FFFFFF"}
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
                setCurrentIndex(cardIndex + 1);
              }}
              onSwipedAll={() => {
                fetchProfiles();
              }}
            />
          ) : (
            <View style={styles.noProfilesAvailable}>
              <View style={styles.noProfilesHeader}>
                <Ionicons name="people-outline" size={64} color="#a566daff" />
                <Text style={[styles.noProfilesText, { color: colors.text }]}>
                  No more profiles for now
                </Text>
                <Text
                  style={[styles.noProfilesSubtext, { color: colors.icon }]}
                >
                  Check back later for new matches!
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      <Modal
        visible={showMessageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMessageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: "#271235ff",
                borderColor: "#2A2A2A",
                borderWidth: 2,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Send a message to {selectedProfile?.name}
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.icon }]}>
              Send an introductory message. Please wait for the listener to
              accept.
            </Text>

            <TextInput
              style={[
                styles.messageInput,
                { color: colors.text, borderColor: "#2A2A2A" },
              ]}
              placeholder="Type your message..."
              placeholderTextColor={colors.icon}
              multiline
              maxLength={200}
              value={preMatchMessage}
              onChangeText={setPreMatchMessage}
            />

            <Text style={[styles.charCount, { color: colors.icon }]}>
              {preMatchMessage.length}/200
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowMessageModal(false);
                  setPreMatchMessage("");
                }}
              >
                <Text
                  style={[
                    styles.cancelButtonText,
                    { color: colors.cancelButton },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.sendButton,
                  { backgroundColor: colors.tint },
                ]}
                onPress={handleSendMessageAndSwipeRight}
              >
                <Text style={[styles.sendButtonText, { color: "#000" }]}>
                  Send
                </Text>
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
    borderColor: "#2A2A2A",
    justifyContent: "flex-end",
    backgroundColor: "white",
    overflow: "hidden",
    shadowColor: "#2A2A2A",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  profileImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  profileInfoContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  profileCardText: {
    textAlign: "left",
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    backgroundColor: "transparent",
  },
  occupationText: {
    textAlign: "left",
    fontSize: 20,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.9)",
    backgroundColor: "transparent",
  },
  profileBio: {
    textAlign: "left",
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.85)",
    fontWeight: "400",
    marginTop: 10,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFD700",
    marginLeft: 5,
  },
  ratingCountText: {
    fontSize: 14,
    fontWeight: "400",
    color: "rgba(255, 255, 255, 0.7)",
  },
  preMessageContainer: {
    marginTop: 10,
    padding: 15,
    backgroundColor: "rgba(42, 42, 42, 0.2)",
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#2A2A2A",
  },
  preMessageText: {
    fontSize: 16,
    color: "white",
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
    borderColor: "#2A2A2A",
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
    backgroundColor: "#ff6a6aff",
  },
  cancelButtonText: {
    color: "#000000ff",
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
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  notFoundGif: {
    width: "60%",
    maxWidth: 250,
    aspectRatio: 1,
    marginBottom: 20,
  },
  noProfilesText: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 12,
  },
  noProfilesSubtext: {
    textAlign: "center",
    fontSize: 15,
    opacity: 0.8,
  },
  noProfilesHeader: {
    alignItems: "center",
  },
  gameWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
});
