import PremiumTimeline from "@/components/ui/PremiumTimeline";
import React from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Premium = () => {
  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <PremiumTimeline />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
  },
});

export default Premium;
