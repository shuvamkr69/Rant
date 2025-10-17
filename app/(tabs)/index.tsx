import TopBar from "@/components/resuables/TopBar";
import { api } from "@/components/utils/api";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Swiper from "react-native-deck-swiper";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function HomeScreen() {
  const [profiles, setProfiles] = useState<Array<any>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchProfiles = async () => {
    try {
      console.log("🔄 Fetching profiles...");
      const response = await api.get("/api/v1/users/profiles");
      console.log("📦 Response:", response);
      if (response.status === 200) {
        console.log("✅ Profiles fetched successfully:", response.data);
        setProfiles(response.data);
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error("❌ Error fetching profiles:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
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
      });

      if (response.status === 200) {
        console.log("✅ Accepted profile successfully:", response.data);
      }
    } catch (error) {
      console.error("❌ Error accepting profile:", error);
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
    <SafeAreaView style={styles.container}>
      <TopBar />
      <View style={styles.HomeScreen}>
        {profiles.length > 0 ? (
          <Swiper
            cards={profiles}
            renderCard={(card) => {
              if (!card) {
                return (
                  <View style={styles.card}>
                    <Text style={styles.profileCardText}>No more profiles</Text>
                  </View>
                );
              }

              return (
                <View style={styles.card}>
                  <Text style={styles.profileCardText}>
                    {card.name || card.username || JSON.stringify(card)}
                  </Text>
                  <Text style={styles.profileDetails}>
                    User Type: {card.userType || "N/A"}
                  </Text>
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
            <Text style={styles.noProfilesText}>No profiles available</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    padding: 20,
  },
  profileCardText: {
    textAlign: "center",
    fontSize: 32,
    fontWeight: "bold",
    color: "black",
    backgroundColor: "transparent",
    marginBottom: 10,
  },
  profileBio: {
    textAlign: "center",
    fontSize: 18,
    color: "#666",
    marginTop: 10,
    paddingHorizontal: 20,
  },
  profileDetails: {
    textAlign: "center",
    fontSize: 16,
    color: "#999",
    marginTop: 5,
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
