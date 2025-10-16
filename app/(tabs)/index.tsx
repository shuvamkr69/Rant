import TopBar from "@/components/resuables/TopBar";
import { Dimensions, Image, StyleSheet, View } from "react-native";
import Swiper from "react-native-deck-swiper";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function HomeScreen() {
  const MockProfiles = ["https://images.ladbible.com/resize?type=webp&quality=70&width=3840&fit=contain&gravity=auto&url=https://images.ladbiblegroup.com/v3/assets/bltcd74acc1d0a99f3a/blt5c525ede6cfdc60d/6849c28ed1866b2dce22f7c0/lana-rhoades-adult-industry.png",
     "https://www.thesun.co.uk/wp-content/uploads/2024/11/hayley-davies-m-la-pornstar-952373582.jpg?strip=all&w=720", 
     "https://i1.sndcdn.com/artworks-oF8RVR2yfn2zNNye-jApWcQ-t500x500.jpg",
     "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqZIPkleabqtHsNU5HI2KwFjpb0xCDD72nSg&s"];

     const handleSwipeRight = () => {
      console.log("Accepted");
     }

     const handleSwipeLeft = () => {
      console.log("Rejected");
     }

  return (
    <SafeAreaView style={styles.container}>
      <TopBar />
      <View style={styles.HomeScreen}>
        <Swiper
          cards={MockProfiles}
          renderCard={(card) => {
            return (
              <View style={styles.card}>
                <Image
                  style={{ width: "100%", height: "100%", borderRadius: 20 }}
                  source={{ uri: typeof card === "string" ? card : undefined }}
                  resizeMode="cover"
                />
              </View>
            );
          }}
          showSecondCard={true}
          infinite={true}
          verticalSwipe={false}
          backgroundColor="black"
          onSwipedRight={handleSwipeRight}
          onSwipedLeft={handleSwipeLeft}
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
    justifyContent: "center",
    alignItems: "center",
    marginTop: "-12%",
    width: "100%",
  },
  card: {
    height: SCREEN_HEIGHT * 0.80,
    width: SCREEN_WIDTH * 0.9,
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
