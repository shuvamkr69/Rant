import TopBar from "@/components/resuables/TopBar";
import { StyleSheet, Text, View } from "react-native";
import Swiper from "react-native-deck-swiper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const MockProfiles = ["1", "2", "3", "4"];

  return (
    <SafeAreaView style={styles.container}>
      <TopBar />
      <View style={styles.HomeScreen}>
        <Swiper
          cards={MockProfiles}
          renderCard={(card) => {
            return (
              <View style={styles.card}>
                <Text style={styles.text}>{card}</Text>
              </View>
            );
          }}
          showSecondCard={true}
          infinite={true}
          verticalSwipe={false}
          backgroundColor="black"
        ></Swiper>
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
  },
  card: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#E8E8E8",
    justifyContent: "center",
    backgroundColor: "white",
  },
  text: {
    textAlign: "center",
    fontSize: 50,
    backgroundColor: "transparent",
  },
});
