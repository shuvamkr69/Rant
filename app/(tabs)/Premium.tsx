import PremiumTimeline from "@/components/ui/PremiumTimeline";
import React from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Premium = () => {
  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.timelineContainer}>
        <PremiumTimeline />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
  },
  timelineContainer: {
    flex: 1,
    backgroundColor: "#000000",
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#a855f7",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.2)",
  },
});

export default Premium;
