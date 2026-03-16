import { useTheme } from "@/components/contexts/ThemeContext";
import { MyProfileSkeleton } from "@/components/skeletons";
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
  Animated,
  Easing,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MyProfile() {
  const { colorScheme } = useTheme();
  const colors = Colors;
  const router = useRouter();
  const [userProfileData, setUserProfileData] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [userType, setUserType] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const fetchMyProfile = async (useCache: boolean = true) => {
    try {
      // Try to get from cache first
      if (useCache) {
        const [cachedProfile, cachedStats] = await Promise.all([
          getFromCache<any>(CACHE_KEYS.MY_PROFILE, CACHE_EXPIRY.MY_PROFILE),
          getFromCache<any>(CACHE_KEYS.USER_STATS, CACHE_EXPIRY.USER_STATS),
        ]);

        if (cachedProfile && cachedStats) {
          console.log("✅ Loading profile from cache");
          setUserProfileData(cachedProfile);
          setUserType(cachedProfile.userType);
          setProfileImage(cachedProfile.profileImage);
          setUserStats(cachedStats);
          setIsLoading(false);
          return;
        }
      }

      // Fetch from API if no cache
      console.log("📡 Fetching profile from API");
      const profileRes = await api.get("/api/v1/users/myProfile");
      if (profileRes.data) {
        setUserProfileData(profileRes.data);
        setUserType(profileRes.data.userType);
        setProfileImage(profileRes.data.profileImage);
        // Save to cache
        await saveToCache(CACHE_KEYS.MY_PROFILE, profileRes.data);
      }

      const statsRes = await api.get("/api/v1/users/getStats");
      if (statsRes.data) {
        setUserStats(statsRes.data.stats);
        // Save to cache
        await saveToCache(CACHE_KEYS.USER_STATS, statsRes.data.stats);
      }
    } catch (error) {
      console.log("Error fetching my profile or stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyProfile(false); // Force fetch from API on refresh
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      const loadProfile = async () => {
        // Check if we have cached data
        const cachedProfile = await getFromCache<any>(
          CACHE_KEYS.MY_PROFILE,
          CACHE_EXPIRY.MY_PROFILE,
        );

        // Only show loading skeleton if no cache exists
        if (!cachedProfile) {
          setIsLoading(true);
        }

        fetchMyProfile();
      };

      loadProfile();
    }, []),
  );

  useEffect(() => {
    if (!isLoading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isLoading]);

  // Prepare data for stats
  let statsData: {
    label: string;
    value: number;
    icon: string;
    suffix?: string;
  }[] = [];

  if (userStats) {
    if (userType === "Listener") {
      statsData = [
        {
          label: "Users Helped",
          value: userStats.uniqueUsersListenedTo?.length || 0,
          icon: "people-outline",
        },
        {
          label: "Sessions Conducted",
          value: userStats.sessionsConducted || userStats.sessionsCount || 0,
          icon: "chatbubbles-outline",
        },
        {
          label: "Total Time",
          value: Math.round(
            (userStats.totalChatTime || userStats.timeSpentListening || 0) / 60,
          ),
          icon: "time-outline",
          suffix: "min",
        },
        {
          label: "Average Rating",
          value: Math.round((userStats.averageRating || 0) * 10) / 10,
          icon: "star-outline",
          suffix: "/5",
        },
      ];
    } else {
      statsData = [
        {
          label: "Messages Sent",
          value: userStats.messagesSent || 0,
          icon: "send-outline",
        },
        {
          label: "Messages Received",
          value: userStats.messagesReceived || 0,
          icon: "mail-outline",
        },
        {
          label: "Sessions Completed",
          value: userStats.sessionsCompleted || 0,
          icon: "checkmark-circle-outline",
        },
        {
          label: "Total Time",
          value: Math.round((userStats.totalSessionTime || 0) / 60),
          icon: "time-outline",
          suffix: "min",
        },
      ];
    }
  }

  const StatCard = ({ item, index }: { item: any; index: number }) => (
    <Animated.View
      style={[
        styles.statCard,
        {
          backgroundColor: colors.cardBackground,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          borderWidth: 1,
          borderColor: colors.border || "rgba(255, 255, 255, 0.05)",
        },
      ]}
    >
      <View
        style={[
          styles.statIconContainer,
          { backgroundColor: `${colors.tint}15` },
        ]}
      >
        <Ionicons name={item.icon as any} size={22} color={colors.tint} />
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statLabel, { color: colors.icon }]}>
          {item.label}
        </Text>
        <Text style={[styles.statValue, { color: colors.text }]}>
          {item.value}
          {item.suffix && (
            <Text style={[styles.statSuffix, { color: colors.icon }]}>
              {" "}
              {item.suffix}
            </Text>
          )}
        </Text>
      </View>
      <View style={[styles.statArrow, { backgroundColor: `${colors.tint}10` }]}>
        <Ionicons name="trending-up" size={16} color={colors.tint} />
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={[]}
    >
      {isLoading ? (
        <MyProfileSkeleton />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.tint}
              colors={[colors.tint]}
            />
          }
        >
          {/* Profile Header */}
          <Animated.View
            style={[
              styles.profileHeader,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.profileImageWrapper}>
              <View style={styles.profileImageContainer}>
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={styles.profileImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={[
                      styles.profileImagePlaceholder,
                      { backgroundColor: colors.cardBackground },
                    ]}
                  >
                    <Ionicons name="person" size={60} color={colors.icon} />
                  </View>
                )}
              </View>
              {/* User Type Badge on Image */}
              <View
                style={[
                  styles.userTypeBadgeOverlay,
                  {
                    backgroundColor: colors.background,
                    borderColor:
                      userType === "Listener" ? "#a855f7" : "#3b82f6",
                  },
                ]}
              >
                <Ionicons
                  name={userType === "Listener" ? "headset" : "person"}
                  size={16}
                  color={userType === "Listener" ? "#a855f7" : "#3b82f6"}
                />
              </View>
            </View>

            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {userProfileData?.name}
              </Text>

              {userProfileData?.email ? (
                <Text style={[styles.profileEmail, { color: colors.icon }]}>
                  {userProfileData.email}
                </Text>
              ) : null}

              <View
                style={[
                  styles.userTypeBadge,
                  {
                    backgroundColor:
                      userType === "Listener"
                        ? "rgba(168, 85, 247, 0.1)"
                        : "rgba(59, 130, 246, 0.1)",
                    borderColor:
                      userType === "Listener"
                        ? "rgba(168, 85, 247, 0.3)"
                        : "rgba(59, 130, 246, 0.3)",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.userTypeText,
                    { color: userType === "Listener" ? "#a855f7" : "#3b82f6" },
                  ]}
                >
                  {userProfileData?.userType}
                </Text>
              </View>

              {/* Quick Info */}
              {userProfileData?.bio && (
                <Text style={[styles.bioText, { color: colors.icon }]}>
                  {userProfileData.bio}
                </Text>
              )}
            </View>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View
            style={[
              styles.actionButtonsContainer,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryActionButton]}
              onPress={() => router.push("/EditProfile")}
            >
              <View style={styles.actionButtonContent}>
                <View
                  style={[
                    styles.actionButtonIconContainer,
                    { backgroundColor: "rgba(168, 85, 247, 0.15)" },
                  ]}
                >
                  <Ionicons name="create-outline" size={20} color="#a855f7" />
                </View>
                <Text style={styles.actionButtonLabel}>Edit Profile</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryActionButton]}
              onPress={() => router.push("/Settings")}
            >
              <View style={styles.actionButtonContent}>
                <View
                  style={[
                    styles.actionButtonIconContainer,
                    { backgroundColor: "rgba(107, 114, 128, 0.15)" },
                  ]}
                >
                  <Ionicons name="settings-outline" size={20} color="#6b7280" />
                </View>
                <Text
                  style={[styles.actionButtonLabel, { color: colors.icon }]}
                >
                  Settings
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Stats Section */}
          <View
            style={[
              styles.statsSection,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.statsSectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Your Statistics
              </Text>
              <View
                style={[
                  styles.statsDecorator,
                  { backgroundColor: colors.tint },
                ]}
              />
            </View>

            {userStats && statsData.length > 0 ? (
              <View style={styles.statsGrid}>
                {statsData.map((item, index) => (
                  <StatCard key={index} item={item} index={index} />
                ))}
              </View>
            ) : (
              <View
                style={[
                  styles.emptyState,
                  { backgroundColor: colors.cardBackground },
                ]}
              >
                <View
                  style={[
                    styles.emptyStateIconContainer,
                    { backgroundColor: "rgba(168, 85, 247, 0.1)" },
                  ]}
                >
                  <Ionicons
                    name="analytics-outline"
                    size={32}
                    color={colors.tint}
                  />
                </View>
                <Text style={[styles.emptyStateText, { color: colors.text }]}>
                  No statistics available yet
                </Text>
                <Text
                  style={[styles.emptyStateSubtext, { color: colors.icon }]}
                >
                  Start chatting to see your stats
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120,
    gap: 14,
  },
  profileHeader: {
    alignItems: "center",
    paddingTop: 24,
    paddingHorizontal: 18,
    paddingBottom: 24,
    borderRadius: 20,
    borderWidth: 1,
  },
  profileImageWrapper: {
    position: "relative",
    marginBottom: 20,
  },
  profileImageContainer: {
    position: "relative",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#a855f7",
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#a855f7",
  },
  userTypeBadgeOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  profileInfo: {
    alignItems: "center",
    width: "100%",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  profileEmail: {
    fontSize: 13,
    marginBottom: 12,
    opacity: 0.9,
  },
  userTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  userTypeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 16,
    paddingHorizontal: 20,
    opacity: 0.8,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  actionButton: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  primaryActionButton: {
    backgroundColor: "rgba(168, 85, 247, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.3)",
  },
  secondaryActionButton: {
    backgroundColor: "rgba(107, 114, 128, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(107, 114, 128, 0.2)",
  },
  actionButtonContent: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 8,
  },
  actionButtonIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#a855f7",
  },
  statsSection: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 20,
    borderWidth: 1,
  },
  statsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  statsDecorator: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    opacity: 0.3,
  },
  statsGrid: {
    gap: 12,
  },
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 14,
    marginBottom: 8,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 13,
    marginBottom: 4,
    fontWeight: "500",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
  },
  statSuffix: {
    fontSize: 16,
    fontWeight: "600",
  },
  statArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  emptyState: {
    padding: 48,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  emptyStateIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  emptyStateSubtext: {
    fontSize: 13,
    opacity: 0.7,
  },
});
