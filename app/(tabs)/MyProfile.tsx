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
        },
      ]}
    >
      <View style={styles.statIconContainer}>
        <Ionicons name={item.icon as any} size={24} color={colors.tint} />
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statLabel, { color: colors.icon }]}>
          {item.label}
        </Text>
        <Text style={[styles.statValue, { color: colors.text }]}>
          {item.value}
          {item.suffix || ""}
        </Text>
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
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
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

            <Text style={[styles.profileName, { color: colors.text }]}>
              {userProfileData?.name}
            </Text>

            <View
              style={[
                styles.userTypeBadge,
                { backgroundColor: colors.accent + "20" },
              ]}
            >
              <Ionicons
                name={
                  userType === "Listener" ? "headset-outline" : "person-outline"
                }
                size={16}
                color={colors.tint}
              />
              <Text style={[styles.userTypeText, { color: colors.tint }]}>
                {userProfileData?.userType}
              </Text>
            </View>

            {/* Quick Info */}
            {userProfileData?.bio && (
              <Text style={[styles.bioText, { color: colors.icon }]}>
                {userProfileData.bio}
              </Text>
            )}
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View
            style={[
              styles.actionButtonsContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: colors.cardBackground },
              ]}
              onPress={() => router.push("/Settings")}
            >
              <Ionicons name="settings-outline" size={20} color={colors.text} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>
                Settings
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: colors.cardBackground },
              ]}
              onPress={() => router.push("/EditProfile")}
            >
              <Ionicons name="create-outline" size={20} color={colors.text} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>
                Edit Profile
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Stats Section */}
          <View style={styles.statsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Statistics
            </Text>

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
                <Ionicons
                  name="analytics-outline"
                  size={48}
                  color={colors.icon}
                />
                <Text style={[styles.emptyStateText, { color: colors.icon }]}>
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
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: "center",
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  profileImageContainer: {
    marginBottom: 20,
  },
  profileImage: {
    width: 240,
    height: 240,
    borderRadius: 200,
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
    borderColor: "#FFFFFF",
  },
  profileName: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  userTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginTop: 8,
  },
  userTypeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  editProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 16,
  },
  editProfileButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  bioText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 16,
    paddingHorizontal: 20,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  statsSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
  },
  statsGrid: {
    gap: 12,
  },
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(183, 148, 246, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  emptyState: {
    padding: 40,
    borderRadius: 12,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    opacity: 0.7,
  },
});
