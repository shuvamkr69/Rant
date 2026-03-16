import { useChat } from "@/components/contexts/chatContext";
import { useTheme } from "@/components/contexts/ThemeContext";
import { ChatsScreenSkeleton } from "@/components/skeletons";
import { api } from "@/components/utils/api";
import {
  CACHE_EXPIRY,
  CACHE_KEYS,
  getFromCache,
  saveToCache,
} from "@/components/utils/cacheStorage";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const REPORT_REASONS = [
  { id: "inappropriate_behavior", label: "Inappropriate Behavior" },
  { id: "harassment", label: "Harassment" },
  { id: "spam", label: "Spam" },
  { id: "fake_profile", label: "Fake Profile" },
  { id: "offensive_language", label: "Offensive Language" },
  { id: "other", label: "Other" },
];

const Chats = () => {
  const { matches, loadMatches, setCurrentChatUser } = useChat();
  const { colorScheme } = useTheme();
  const colors = Colors;
  const router = useRouter();
  const animatedPlayed = useRef(false);
  const isFocusedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);

  // Context-menu state
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const menuAnim = useRef(new Animated.Value(0)).current;

  // Report sub-panel state
  const [reportVisible, setReportVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [reportMessage, setReportMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map of animated values per match id
  const animatedMapRef = useRef(new Map());

  const TOPBAR_COLOR = "#000000";

  // ─── open / close helpers ────────────────────────────────────────────────

  const openMenu = (user: any) => {
    setSelectedUser(user);
    setMenuVisible(true);
    Animated.spring(menuAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(menuAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setMenuVisible(false);
      setSelectedUser(null);
      setReportVisible(false);
      setSelectedReason("");
      setReportMessage("");
    });
  };

  // ─── block ───────────────────────────────────────────────────────────────

  const handleBlock = () => {
    if (!selectedUser) return;
    Alert.alert(
      "Block User",
      `Are you sure you want to block ${selectedUser.name}? They will be removed from your matches and you won't see each other anymore.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            try {
              await api.post(`/api/v1/users/block/${selectedUser._id}`);
              // Invalidate the matches cache so the next load fetches fresh data
              await saveToCache(CACHE_KEYS.MATCHES, [] as any);
              await loadMatches();
              closeMenu();
              Alert.alert("Blocked", `${selectedUser.name} has been blocked.`);
            } catch (error: any) {
              console.error("❌ Block error:", error);
              Alert.alert(
                "Error",
                error?.response?.data?.message || "Failed to block user.",
              );
            }
          },
        },
      ],
    );
  };

  // ─── report ──────────────────────────────────────────────────────────────

  const handleOpenReport = () => {
    setReportVisible(true);
  };

  const handleSubmitReport = async () => {
    if (!selectedReason) {
      Alert.alert("Error", "Please select a reason for reporting.");
      return;
    }
    if (!reportMessage.trim()) {
      Alert.alert("Error", "Please provide additional details.");
      return;
    }
    if (reportMessage.length > 500) {
      Alert.alert("Error", "Message must be 500 characters or less.");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/api/v1/users/reports/submit", {
        reportedUserId: selectedUser._id,
        reason: selectedReason,
        message: reportMessage.trim(),
      });
      closeMenu();
      Alert.alert(
        "Report Submitted",
        "Thank you for your report. Our team will review it.",
      );
    } catch (error: any) {
      console.error("❌ Report error:", error);
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to submit report.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── data loading ────────────────────────────────────────────────────────

  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;

      const loadData = async () => {
        const cachedMatches = await getFromCache<any[]>(
          CACHE_KEYS.MATCHES,
          CACHE_EXPIRY.MATCHES,
        );

        if (!cachedMatches) {
          setIsLoading(true);
        } else {
          setIsLoading(false);
        }

        await loadMatches();

        if (matches.length === 0) {
          setTimeout(() => {
            setIsLoading(false);
          }, 1000);
        } else {
          setIsLoading(false);
        }
      };

      loadData();

      return () => {
        isFocusedRef.current = false;
      };
    }, []),
  );

  const handleChatPress = (match: any) => {
    setCurrentChatUser(match);
    // @ts-ignore
    router.push(`/ChatScreen?userId=${match._id}&name=${match.name}`);
  };

  const handleProfilePress = (match: any) => {
    // @ts-ignore
    router.push(`/ViewOtherProfile?userId=${match._id}`);
  };

  const ensureAnimatedValues = (list: any[]) => {
    list.forEach((m) => {
      if (!animatedMapRef.current.has(m._id)) {
        const translate = new Animated.Value(-18);
        const opacity = new Animated.Value(0);
        animatedMapRef.current.set(m._id, { translate, opacity });
      }
    });
  };

  useEffect(() => {
    if (!isFocusedRef.current) return;
    if (matches.length === 0) return;
    ensureAnimatedValues(matches);

    if (animatedPlayed.current) return;

    const animations: Animated.CompositeAnimation[] = matches.map((m) => {
      const vals = animatedMapRef.current.get(m._id);
      return Animated.parallel([
        Animated.spring(vals.translate, {
          toValue: 0,
          useNativeDriver: true,
          speed: 14,
          bounciness: 8,
        }),
        Animated.timing(vals.opacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.stagger(80, animations).start(() => {
      animatedPlayed.current = true;
    });
  }, [matches]);

  // ─── context menu sheet animation styles ─────────────────────────────────

  const sheetTranslate = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });
  const backdropOpacity = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.6],
  });

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={[]}
    >
      {isLoading ? (
        <ChatsScreenSkeleton />
      ) : (
        <View style={styles.chatsContainer}>
          <View style={styles.cardsContainer}>
            <Text style={[styles.headingText, { color: colors.text }]}>
              Chats
            </Text>

            {matches.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyHeader}>
                  <Ionicons
                    name="chatbubbles-outline"
                    size={64}
                    color="#a566daff"
                  />
                  <Text style={[styles.emptyText, { color: colors.text }]}>
                    No listeners matched yet
                  </Text>
                  <Text style={[styles.emptySubtext, { color: colors.icon }]}>
                    Explore and connect with listeners to start ranting!
                  </Text>
                </View>
              </View>
            ) : (
              <FlatList
                data={matches}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => {
                  if (!animatedMapRef.current.has(item._id)) {
                    const translate = new Animated.Value(-18);
                    const opacity = new Animated.Value(0);
                    animatedMapRef.current.set(item._id, {
                      translate,
                      opacity,
                    });
                  }
                  const anim = animatedMapRef.current.get(item._id);

                  return (
                    <Animated.View
                      style={{
                        transform: [{ translateY: anim?.translate || 0 }],
                        opacity: anim?.opacity || 1,
                      }}
                    >
                      <TouchableOpacity
                        style={[
                          styles.card,
                          {
                            backgroundColor: "#1b1226",
                            borderColor: TOPBAR_COLOR,
                          },
                        ]}
                        onPress={() => handleChatPress(item)}
                        onLongPress={() => openMenu(item)}
                        delayLongPress={400}
                        activeOpacity={0.8}
                      >
                        <View style={styles.cardContent}>
                          <TouchableOpacity
                            onPress={() => handleProfilePress(item)}
                            activeOpacity={0.7}
                          >
                            {(item as any).profileImage ? (
                              <Image
                                source={{ uri: (item as any).profileImage }}
                                style={styles.avatarImage}
                                resizeMode="cover"
                              />
                            ) : (
                              <View
                                style={[
                                  styles.avatar,
                                  { backgroundColor: colors.tint },
                                ]}
                              >
                                <Text style={styles.avatarText}>
                                  {item.name?.charAt(0).toUpperCase()}
                                </Text>
                              </View>
                            )}
                          </TouchableOpacity>

                          <View style={styles.chatInfo}>
                            <Text
                              style={[styles.chatName, { color: colors.text }]}
                            >
                              {item.name}
                            </Text>
                            <Text
                              style={[styles.chatType, { color: colors.icon }]}
                            >
                              {item.userType}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.arrow, { color: colors.icon }]}>
                          ›
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                }}
                contentContainerStyle={styles.listContent}
              />
            )}
          </View>
        </View>
      )}

      {/* ── Context-menu bottom sheet ── */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="none"
        onRequestClose={closeMenu}
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={closeMenu}>
          <Animated.View
            style={[styles.backdrop, { opacity: backdropOpacity }]}
          />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: sheetTranslate }] },
          ]}
        >
          {/* Header */}
          <View style={styles.sheetHeader}>
            {selectedUser?.profileImage ? (
              <Image
                source={{ uri: selectedUser.profileImage }}
                style={styles.sheetAvatar}
              />
            ) : (
              <View
                style={[
                  styles.sheetAvatarPlaceholder,
                  { backgroundColor: colors.tint },
                ]}
              >
                <Text style={styles.sheetAvatarText}>
                  {selectedUser?.name?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.sheetName}>{selectedUser?.name}</Text>
              <Text style={styles.sheetType}>{selectedUser?.userType}</Text>
            </View>
          </View>

          <View style={styles.sheetDivider} />

          {!reportVisible ? (
            /* Main options */
            <>
              <TouchableOpacity
                style={styles.sheetOption}
                onPress={handleOpenReport}
              >
                <View
                  style={[
                    styles.sheetOptionIcon,
                    { backgroundColor: "#1e2a3a" },
                  ]}
                >
                  <Ionicons name="flag-outline" size={20} color="#64b5f6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetOptionLabel}>Report</Text>
                  <Text style={styles.sheetOptionSub}>
                    Report inappropriate behaviour
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#555" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetOption}
                onPress={handleBlock}
              >
                <View
                  style={[
                    styles.sheetOptionIcon,
                    { backgroundColor: "#2a1a1a" },
                  ]}
                >
                  <Ionicons name="ban-outline" size={20} color="#ef5350" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sheetOptionLabel, { color: "#ef5350" }]}>
                    Block
                  </Text>
                  <Text style={styles.sheetOptionSub}>
                    Remove and block this user
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sheetOption, { marginTop: 4 }]}
                onPress={closeMenu}
              >
                <Text
                  style={[
                    styles.sheetOptionLabel,
                    { color: "#888", textAlign: "center", flex: 1 },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            /* Report sub-panel */
            <>
              <TouchableOpacity
                style={styles.backRow}
                onPress={() => setReportVisible(false)}
              >
                <Ionicons name="arrow-back" size={18} color="#aaa" />
                <Text style={styles.backRowText}>Back</Text>
              </TouchableOpacity>

              <Text style={styles.reportTitle}>
                Report {selectedUser?.name}
              </Text>
              <Text style={styles.reportSub}>Select a reason</Text>

              <View style={styles.reasonsGrid}>
                {REPORT_REASONS.map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    style={[
                      styles.reasonChip,
                      selectedReason === r.id && styles.reasonChipActive,
                    ]}
                    onPress={() => setSelectedReason(r.id)}
                  >
                    <Text
                      style={[
                        styles.reasonChipText,
                        selectedReason === r.id && styles.reasonChipTextActive,
                      ]}
                    >
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.reportInput}
                placeholder="Add details (required)..."
                placeholderTextColor="#555"
                multiline
                maxLength={500}
                value={reportMessage}
                onChangeText={setReportMessage}
              />
              <Text style={styles.charCount}>{reportMessage.length}/500</Text>

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  (!selectedReason || !reportMessage.trim() || isSubmitting) &&
                    styles.submitBtnDisabled,
                ]}
                onPress={handleSubmitReport}
                disabled={
                  !selectedReason || !reportMessage.trim() || isSubmitting
                }
              >
                <Text style={styles.submitBtnText}>
                  {isSubmitting ? "Submitting…" : "Submit Report"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </Modal>
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
    paddingHorizontal: 20,
    bottom: "10%",
  },
  emptyIcon: {
    width: "60%",
    maxWidth: 200,
    aspectRatio: 1,
    marginBottom: 20,
    opacity: 0.7,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 12,
  },
  emptySubtext: {
    fontSize: 15,
    textAlign: "center",
    opacity: 0.8,
  },
  emptyHeader: {
    alignItems: "center",
  },
  gameWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingBottom: 100,
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
    // nicer shadow / elevation
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
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
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
    backgroundColor: "#ddd",
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
  // ── context-menu sheet ──────────────────────────────────────────────────
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1a1a2e",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sheetAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#333",
  },
  sheetAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  sheetAvatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  sheetName: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  sheetType: {
    color: "#888",
    fontSize: 13,
    marginTop: 2,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: "#2e2e4a",
    marginBottom: 12,
  },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 12,
  },
  sheetOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  sheetOptionLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  sheetOptionSub: {
    color: "#666",
    fontSize: 12,
  },
  // ── report sub-panel ────────────────────────────────────────────────────
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backRowText: {
    color: "#aaa",
    fontSize: 14,
    marginLeft: 6,
  },
  reportTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },
  reportSub: {
    color: "#888",
    fontSize: 13,
    marginBottom: 12,
  },
  reasonsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  reasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#333",
    backgroundColor: "#111",
  },
  reasonChipActive: {
    borderColor: "#a855f7",
    backgroundColor: "#2d1450",
  },
  reasonChipText: {
    color: "#999",
    fontSize: 13,
  },
  reasonChipTextActive: {
    color: "#d8a4ff",
    fontWeight: "600",
  },
  reportInput: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 4,
  },
  charCount: {
    color: "#555",
    fontSize: 12,
    textAlign: "right",
    marginBottom: 14,
  },
  submitBtn: {
    backgroundColor: "#a855f7",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitBtnDisabled: {
    backgroundColor: "#3a1f5a",
    opacity: 0.5,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});

export default Chats;
