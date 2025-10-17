import TopBar from "@/components/resuables/TopBar";
import { api } from "@/components/utils/api";
import { useFocusEffect } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MyProfile() {
  const [userProfileData, setUserProfileData] = useState<any>(null);
  const fetchMyProfile = async () => {
    try {
      const response = await api.get("/api/v1/users/myProfile");
      if (!response.data) {
        console.log("No profile data found");
        return;
      }
      setUserProfileData(response.data);
    } catch (error) {
      console.log("Error fetching my profile:", error);
    }
  };

  useFocusEffect(() => {
    fetchMyProfile();
  });
  return (
    <SafeAreaView style={styles.container}>
      <TopBar />
      <View style={styles.myProfilePage}>
        <View style={styles.imageContainer}>
          <View style={styles.profileImage}></View>
        </View>
        <View style={styles.detailsContainer}>
          <Text style={styles.detailHeading}>{userProfileData?.name}</Text>
          <Text style={styles.detailHeading}>{userProfileData?.userType}</Text>
        </View>
      </View>
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
