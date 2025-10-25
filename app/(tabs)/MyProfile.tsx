import { useTheme } from "@/components/contexts/ThemeContext";
import TopBar from "@/components/resuables/TopBar";
import { api } from "@/components/utils/api";
import { Colors } from "@/constants/theme";
import { useFocusEffect } from "expo-router";
import React, { useState } from "react";
import { Image, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MyProfile() {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const [userProfileData, setUserProfileData] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [userType, setUserType] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

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
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyProfile();
    setRefreshing(false);
  };

  useFocusEffect(() => {
    fetchMyProfile();
  });

  // Prepare data for chart
  let chartData: { label: string, value: number }[] = [];
  if (userStats) {
    if (userType === "Listener") {
      chartData = [
        { label: "Users", value: userStats.uniqueUsersListenedTo?.length || 0 },
        { label: "Sessions", value: userStats.sessionsConducted || userStats.sessionsCount || 0 },
        { label: "Time(min)", value: Math.round((userStats.totalChatTime || userStats.timeSpentListening || 0) / 60) },
        { label: "Rating", value: userStats.averageRating || 0 },
      ];
    } else {
      chartData = [
        { label: "Sent", value: userStats.messagesSent },
        { label: "Received", value: userStats.messagesReceived },
        { label: "Sessions", value: userStats.sessionsCompleted || 0 },
        { label: "Time(min)", value: Math.round((userStats.totalSessionTime || 0) / 60) },
      ];
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar />
      <ScrollView 
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
          <View style={[styles.imageContainer, { backgroundColor: colors.icon }]}>
            <View style={styles.profileImage}>
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
            </View>
          </View>
          <View style={[styles.detailsContainer, { backgroundColor: colors.background }]}>
            <Text style={[styles.detailHeading, { color: colors.text }]}>{userProfileData?.name}</Text>
            <Text style={[styles.detailHeading, { color: colors.icon }]}>{userProfileData?.userType}</Text>
          </View>
        </View>
        
        {/* Stats Section */}
        <View style={{ width: '100%', paddingHorizontal: 20, marginTop: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 20 }}>
            Your Stats
          </Text>
          {userStats && chartData.length > 0 ? (
            <View>
              {/* Stat Cards */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 }}>
                {chartData.map((item, index) => {
                  const cardColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];
                  const gradientColors = [
                    ['#FF6B6B', '#FF8E8E'],
                    ['#4ECDC4', '#6EDDD5'],
                    ['#45B7D1', '#67C7E1'],
                    ['#FFA07A', '#FFB89A']
                  ];
                  
                  return (
                    <View 
                      key={index}
                      style={{
                        width: '48%',
                        backgroundColor: cardColors[index % 4],
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 15,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 8,
                      }}
                    >
                      <Text style={{ fontSize: 13, color: '#fff', opacity: 0.9, marginBottom: 8 }}>
                        {item.label}
                      </Text>
                      <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#fff' }}>
                        {item.value}
                      </Text>
                    </View>
                  );
                })}
              </View>

              
            </View>
          ) : (
            <View style={{
              backgroundColor: colorScheme === 'dark' ? '#1a1a2e' : '#f8f9fa',
              borderRadius: 16,
              padding: 30,
              alignItems: 'center',
            }}>
              <Text style={{ fontSize: 40, marginBottom: 10 }}>📈</Text>
              <Text style={{ color: colors.text, fontSize: 16, opacity: 0.7 }}>No stats available yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
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
