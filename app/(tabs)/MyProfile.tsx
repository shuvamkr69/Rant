import { useTheme } from "@/components/contexts/ThemeContext";
import TopBar from "@/components/resuables/TopBar";
import { api } from "@/components/utils/api";
import { Colors } from "@/constants/theme";
import { useFocusEffect } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';

export default function MyProfile() {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const [userProfileData, setUserProfileData] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [userType, setUserType] = useState<string>("");

  const fetchMyProfile = async () => {
    try {
      const profileRes = await api.get("/api/v1/users/myProfile");
      if (profileRes.data) {
        setUserProfileData(profileRes.data);
        setUserType(profileRes.data.userType);
      }
      const statsRes = await api.get("/api/v1/users/getStats");
      if (statsRes.data) {
        setUserStats(statsRes.data.stats);
      }
    } catch (error) {
      console.log("Error fetching my profile or stats:", error);
    }
  };

  useFocusEffect(() => {
    fetchMyProfile();
  });

  // Prepare data for chart
  let chartData: { label: string, value: number }[] = [];
  if (userStats) {
    if (userType === "Listener") {
      chartData = [
        { label: "Listened", value: userStats.messagesListened },
        { label: "Sessions", value: userStats.sessionsCount },
        { label: "Time(min)", value: Math.round((userStats.timeSpentListening || 0) / 60) },
        { label: "Balance", value: userStats.walletBalance },
      ];
    } else {
      chartData = [
        { label: "Sent", value: userStats.messagesSent },
        { label: "Received", value: userStats.messagesReceived },
        { label: "Chats", value: userStats.chatsParticipated },
        { label: "Balance", value: userStats.walletBalance },
      ];
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.myProfilePage}>
          <View style={[styles.imageContainer, { backgroundColor: colors.icon }]}>
            <View style={styles.profileImage}></View>
          </View>
          <View style={[styles.detailsContainer, { backgroundColor: colors.background }]}>
            <Text style={[styles.detailHeading, { color: colors.text }]}>{userProfileData?.name}</Text>
            <Text style={[styles.detailHeading, { color: colors.icon }]}>{userProfileData?.userType}</Text>
          </View>
        </View>
        
        {/* Stats Section */}
        <View style={{ width: '100%', paddingHorizontal: 20, marginTop: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 20 }}>
            📊 Your Stats
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

              {/* Bar Chart Visualization */}
              <View style={{ 
                backgroundColor: colorScheme === 'dark' ? '#1a1a2e' : '#f8f9fa',
                borderRadius: 20,
                padding: 20,
                marginTop: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 5,
              }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 15 }}>
                  Overview
                </Text>
                <Svg height="220" width="100%">
                  {chartData.map((item, index) => {
                    const barColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];
                    const totalWidth = 320; // Approximate usable width
                    const barWidth = (totalWidth / chartData.length) - 15;
                    const maxValue = Math.max(...chartData.map(d => d.value), 1);
                    const barHeight = (item.value / maxValue) * 140;
                    const x = index * (barWidth + 15) + 10;
                    const y = 160 - barHeight;
                    
                    return (
                      <React.Fragment key={index}>
                        {/* Glow effect */}
                        <Rect
                          x={x - 2}
                          y={y - 2}
                          width={barWidth + 4}
                          height={barHeight + 4}
                          fill={barColors[index % 4]}
                          opacity={0.3}
                          rx={8}
                        />
                        {/* Main Bar with gradient effect */}
                        <Rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={barHeight}
                          fill={barColors[index % 4]}
                          rx={6}
                        />
                        {/* Value on top of bar */}
                        <SvgText
                          x={x + barWidth / 2}
                          y={y - 8}
                          fill={colors.text}
                          fontSize="14"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {item.value}
                        </SvgText>
                        {/* Label below bar */}
                        <SvgText
                          x={x + barWidth / 2}
                          y={180}
                          fill={colors.text}
                          fontSize="11"
                          textAnchor="middle"
                        >
                          {item.label.length > 8 ? item.label.substring(0, 7) + '...' : item.label}
                        </SvgText>
                      </React.Fragment>
                    );
                  })}
                  {/* Base line */}
                  <Line
                    x1="5"
                    y1="160"
                    x2="330"
                    y2="160"
                    stroke={colors.icon}
                    strokeWidth="2"
                    opacity={0.3}
                  />
                </Svg>
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
  },
});
