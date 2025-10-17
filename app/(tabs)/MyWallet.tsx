import { useTheme } from "@/components/contexts/ThemeContext";
import TopBar from "@/components/resuables/TopBar";
import { api } from "@/components/utils/api";
import { Colors } from "@/constants/theme";
import { useFocusEffect } from "expo-router";
import React, { useState } from "react";
import { ImageBackground, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MyWallet = () => {
  const [walletBalance, setWalletBalance] = useState<any>(null);
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  const fetchBalance = async () => {
    try {
      const response = await api.get("/api/v1/users/getBalance");
      if (response.status === 200) {
        setWalletBalance(response.data.walletBalance);
      }
    } catch (error) {
      console.log("Error fetching wallet balance:", error);
    }
  };

  useFocusEffect(() => {
    fetchBalance();
  });
  return (
    <SafeAreaView style={{ backgroundColor: colors.background }}>
      <TopBar />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ImageBackground
          source={require("../../assets/images/icons/money.png")} // Replace with your image source
          style={styles.imageBackground}
          imageStyle={styles.imageStyle} // Optional: for styling the image itself
        >
          <Text style={[styles.imageText, { color: colors.text }]}>{walletBalance}</Text>
        </ImageBackground>
      </View>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  imageStyle: {
    width: 256,
    height: 256,
    alignSelf: "center",
  },
  imageBackground: {
    width: 300,
    height: 300,
  },
  imageText: {
    color: "white",
    fontSize: 24,
    textAlign: "center",
    top: "50%",
    right: "20%",
  },
  container: {
    flex: 1,
  },
});

export default MyWallet;
