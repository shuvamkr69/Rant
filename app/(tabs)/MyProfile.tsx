import TopBar from "@/components/resuables/TopBar";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MyProfile() {
  return (
    <SafeAreaView style={styles.container}>
      <TopBar />
      <View style={styles.myProfilePage}>
        
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
});
