import BackButton from "@/components/resuables/BackButton";
import { api } from "@/components/utils/api";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const ViewOtherProfile = () => {
  const { userId } = useLocalSearchParams();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOtherUserProfile();
  }, [userId]);

  const fetchOtherUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/users/profile/${userId}`);
      if (response.status === 200) {
        setProfileData(response.data);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <LinearGradient
          colors={["#000000", "#0A0A0A", "#1A1A1A", "#2A2A2A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <BackButton screenName="Profile" />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!profileData) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <LinearGradient
          colors={["#000000", "#0A0A0A", "#1A1A1A", "#2A2A2A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <BackButton screenName="Profile" />
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#ffffff" />
            <Text style={styles.errorText}>Profile not found</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <LinearGradient
        colors={["#000000", "#0A0A0A", "#1A1A1A", "#2A2A2A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <BackButton screenName="Profile" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Image Section */}
          <View style={styles.imageSection}>
            <View style={styles.imageWrapper}>
              <LinearGradient
                colors={["#8b5cf6", "#a78bfa", "#c4b5fd"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.imageGradient}
              >
                {profileData.profileImage ? (
                  <Image
                    source={{ uri: profileData.profileImage }}
                    style={styles.profileImage}
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="person" size={80} color="#ffffff" />
                  </View>
                )}
              </LinearGradient>
            </View>
          </View>

          {/* Name and Type Section */}
          <View style={styles.nameSection}>
            <Text style={styles.name}>{profileData.name}</Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{profileData.userType}</Text>
            </View>
          </View>

          {/* Bio Section */}
          {profileData.bio && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="person-outline" size={20} color="#c4b5fd" />
                <Text style={styles.sectionTitle}>About</Text>
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.bioText}>{profileData.bio}</Text>
              </View>
            </View>
          )}

          {/* Occupation Section (for Listeners) */}
          {profileData.occupation && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="briefcase-outline" size={20} color="#c4b5fd" />
                <Text style={styles.sectionTitle}>Occupation</Text>
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.infoText}>{profileData.occupation}</Text>
              </View>
            </View>
          )}

          {/* Days Available Section (for Listeners) */}
          {profileData.daysAvailable &&
            profileData.daysAvailable.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="calendar-outline" size={20} color="#c4b5fd" />
                  <Text style={styles.sectionTitle}>Days Available</Text>
                </View>
                <View style={styles.sectionContent}>
                  <View style={styles.daysContainer}>
                    {profileData.daysAvailable.map(
                      (day: string, index: number) => (
                        <View key={index} style={styles.dayChip}>
                          <Text style={styles.dayChipText}>{day}</Text>
                        </View>
                      )
                    )}
                  </View>
                </View>
              </View>
            )}

          {/* Timings Section (for Listeners) */}
          {profileData.timings && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="time-outline" size={20} color="#c4b5fd" />
                <Text style={styles.sectionTitle}>Preferred Timings</Text>
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.infoText}>{profileData.timings}</Text>
              </View>
            </View>
          )}

          {/* Age Section */}
          {profileData.age && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="calendar-outline" size={20} color="#c4b5fd" />
                <Text style={styles.sectionTitle}>Age</Text>
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.infoText}>{profileData.age} years</Text>
              </View>
            </View>
          )}

          {/* Member Since Section */}
          {profileData.createdAt && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="time-outline" size={20} color="#c4b5fd" />
                <Text style={styles.sectionTitle}>Member Since</Text>
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.infoText}>
                  {new Date(profileData.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
              </View>
            </View>
          )}

          {/* Decorative Elements */}
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#1a0033",
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorText: {
    color: "#ffffff",
    fontSize: 18,
    marginTop: 20,
    textAlign: "center",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
  },
  imageSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  imageWrapper: {
    position: "relative",
  },
  imageGradient: {
    width: width > 400 ? 180 : 150,
    height: width > 400 ? 180 : 150,
    borderRadius: width > 400 ? 90 : 75,
    padding: 4,
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: width > 400 ? 86 : 71,
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: width > 400 ? 86 : 71,
    backgroundColor: "rgba(139, 92, 246, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  nameSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  name: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 10,
  },
  typeBadge: {
    backgroundColor: "rgba(139, 92, 246, 0.3)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#8b5cf6",
  },
  typeText: {
    color: "#c4b5fd",
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#e9d5ff",
    marginLeft: 8,
  },
  sectionContent: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.3)",
  },
  bioText: {
    fontSize: 16,
    color: "#ffffff",
    lineHeight: 24,
  },
  infoText: {
    fontSize: 16,
    color: "#ffffff",
  },
  decorativeCircle1: {
    position: "absolute",
    top: 50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    opacity: 0.5,
  },
  decorativeCircle2: {
    position: "absolute",
    bottom: 100,
    left: -60,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(167, 139, 250, 0.1)",
    opacity: 0.5,
  },
  daysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dayChip: {
    backgroundColor: "rgba(139, 92, 246, 0.3)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#8b5cf6",
  },
  dayChipText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default ViewOtherProfile;
