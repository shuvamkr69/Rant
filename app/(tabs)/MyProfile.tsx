import { useTheme } from "@/components/contexts/ThemeContext";
import TopBar from "@/components/resuables/TopBar";
import { MyProfileSkeleton } from "@/components/skeletons";
import { api } from "@/components/utils/api";
import { Colors } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Circular progress stat component
const CircularStat = ({
  label,
  value,
  maxValue = 100,
  color,
  delay = 0,
}: {
  label: string;
  value: number;
  maxValue?: number;
  color: string;
  delay?: number;
}) => {
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    // Calculate percentage (0-100)
    const percentage = Math.min((value / maxValue) * 100, 100);

    Animated.timing(animatedProgress, {
      toValue: percentage,
      duration: 1200,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [value, maxValue, delay]);

  // Calculate stroke dash offset based on animated progress
  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ alignItems: "center", marginBottom: 24 }}>
      <View style={{ position: "relative" }}>
        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e0e0e0"
            strokeWidth={strokeWidth}
            fill="none"
            opacity={0.2}
          />
          {/* Animated progress circle */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        {/* Center value display */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 26, fontWeight: "bold", color }}>
            {value}
          </Text>
        </View>
      </View>
      <Text
        style={{
          marginTop: 8,
          fontSize: 14,
          fontWeight: "600",
          color: "#666",
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </View>
  );
};

export default function MyProfile() {
  const { colorScheme } = useTheme();
  const colors = Colors;
  const TOPBAR_COLOR = "#6b1fa8";
  const [userProfileData, setUserProfileData] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [userType, setUserType] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // animation refs
  const profileScale = useRef(new Animated.Value(0.96)).current;
  const detailsOpacity = useRef(new Animated.Value(0)).current;
  const detailsTranslate = useRef(new Animated.Value(12)).current;
  const statsAnimRef = useRef<
    Array<{ translate: Animated.Value; opacity: Animated.Value }>
  >([]);

  const fetchMyProfile = async () => {
    try {
      const profileRes = await api.get("/api/v1/users/myProfile");
      if (profileRes.data) {
        setUserProfileData(profileRes.data);
        setUserType(profileRes.data.userType);
        setProfileImage(profileRes.data.profileImage);
      }
      const statsRes = await api.get("/api/v1/users/getStats");
      if (statsRes.data) {
        setUserStats(statsRes.data.stats);
      }
    } catch (error) {
      console.log("Error fetching my profile or stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyProfile();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchMyProfile();
    }, [])
  );

  // initialize stat animated values when stats change
  useEffect(() => {
    const len = statsData.length;
    // ensure array has correct length
    while (statsAnimRef.current.length < len) {
      statsAnimRef.current.push({
        translate: new Animated.Value(12),
        opacity: new Animated.Value(0),
      });
    }
    if (statsAnimRef.current.length > len) {
      statsAnimRef.current = statsAnimRef.current.slice(0, len);
    }

    // run entrance animations when profile/ stats load
    Animated.sequence([
      Animated.parallel([
        Animated.timing(profileScale, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(detailsOpacity, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(detailsTranslate, {
          toValue: 0,
          duration: 360,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [userProfileData, userStats]);

  // Prepare data for stats
  let statsData: {
    label: string;
    value: number;
    maxValue: number;
    color: string;
  }[] = [];
  if (userStats) {
    if (userType === "Listener") {
      statsData = [
        {
          label: "Users Helped",
          value: userStats.uniqueUsersListenedTo?.length || 0,
          maxValue: 50, // max scale for display
          color: TOPBAR_COLOR,
        },
        {
          label: "Sessions",
          value: userStats.sessionsConducted || userStats.sessionsCount || 0,
          maxValue: 100,
          color: "#4ECDC4",
        },
        {
          label: "Time in minutes",
          value: Math.round(
            (userStats.totalChatTime || userStats.timeSpentListening || 0) / 60
          ),
          maxValue: 500,
          color: "#45B7D1",
        },
        {
          label: "Rating",
          value: Math.round((userStats.averageRating || 0) * 10) / 10,
          maxValue: 5,
          color: "#FFA07A",
        },
      ];
    } else {
      statsData = [
        {
          label: "Sent",
          value: userStats.messagesSent || 0,
          maxValue: 500,
          color: TOPBAR_COLOR,
        },
        {
          label: "Received",
          value: userStats.messagesReceived || 0,
          maxValue: 500,
          color: "#4ECDC4",
        },
        {
          label: "Sessions",
          value: userStats.sessionsCompleted || 0,
          maxValue: 50,
          color: "#45B7D1",
        },
        {
          label: "Time in minutes",
          value: Math.round((userStats.totalSessionTime || 0) / 60),
          maxValue: 300,
          color: "#FFA07A",
        },
      ];
    }
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <TopBar />
      {isLoading ? (
        <MyProfileSkeleton />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.tint}
              colors={[colors.tint]}
            />
          }
        >
          <View style={styles.myProfilePage}>
            <LinearGradient
              colors={[TOPBAR_COLOR, "#7f2bb8"]}
              style={[styles.imageContainer]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Animated.View
                style={[
                  styles.profileImage,
                  { transform: [{ scale: profileScale }] },
                ]}
              >
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={styles.profileImageActual}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <Text style={styles.placeholderText}>No Image</Text>
                  </View>
                )}
              </Animated.View>
            </LinearGradient>

            <Animated.View
              style={[
                styles.detailsContainer,
                {
                  backgroundColor: colors.background,
                  opacity: detailsOpacity,
                  transform: [{ translateY: detailsTranslate }],
                },
              ]}
            >
              <Text style={[styles.detailHeading, { color: colors.text }]}>
                {userProfileData?.name}
              </Text>
              <Text style={[styles.userTypeText, { color: TOPBAR_COLOR }]}>
                {userProfileData?.userType}
              </Text>
            </Animated.View>
          </View>

          {/* Stats Section */}
          <View style={{ width: "100%", paddingHorizontal: 20, marginTop: 20 }}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: colors.text,
                marginBottom: 30,
              }}
            >
              Your Stats
            </Text>
            {userStats && statsData.length > 0 ? (
              <View>
                {/* Circular Stats Grid */}
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    marginBottom: 20,
                  }}
                >
                  {statsData.map((item, index) => (
                    <View
                      key={index}
                      style={{ width: "48%", alignItems: "center" }}
                    >
                      <CircularStat
                        label={item.label}
                        value={item.value}
                        maxValue={item.maxValue}
                        color={item.color}
                        delay={index * 150}
                      />
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View
                style={{
                  backgroundColor: "#1a1a2e",
                  borderRadius: 16,
                  padding: 30,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 40, marginBottom: 10 }}>📈</Text>
                <Text
                  style={{ color: colors.text, fontSize: 16, opacity: 0.7 }}
                >
                  No stats available yet
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
    alignItems: "center",
    justifyContent: "center",
  },
  myProfilePage: {
    flex: 1,
    width: "100%",
  },
  imageContainer: {
    width: "100%",
    height: 300,
    backgroundColor: "grey",
  },
  detailsContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: "#707070ff",
    alignItems: "center",
  },
  detailHeading: {
    fontSize: 34,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  userTypeText: {
    fontSize: 16,
    fontWeight: "600",
    opacity: 0.95,
  },
  profileImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    borderColor: "#fff",
    backgroundColor: "#c4c4c4",
    alignSelf: "center",
    marginTop: 75,
    overflow: "hidden",
  },
  profileImageActual: {
    width: "100%",
    height: "100%",
  },
  profileImagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e0e0e0",
  },
  placeholderText: {
    color: "#999",
    fontSize: 12,
  },
});
