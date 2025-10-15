import { RootStackParamList } from "@/types/navigation";
import Ionicons from "@expo/vector-icons/Ionicons";
import { NavigationProp } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";


const TopBar = () => {

    const navigate = useNavigation<NavigationProp<RootStackParamList>>();

    const navigateToSettings = () => {
        navigate.navigate("Settings")
        console.log("Navigating to Settings");
    }
    return ( 
    <View style={styles.TopBar}>
        <View style = {styles.logoContainer}>
            <Image source={require("../../assets/images/icons/logo.png")} style={{ width: 30, height: 30 }} />
            <Text style = {styles.logoText}>Rant</Text>
        </View>
        <View style ={styles.sideIconContainer}>
            <TouchableOpacity onPress={navigateToSettings}>
                <Ionicons name="cog-outline" size={26} color="black" />
            </TouchableOpacity>
            
        </View>
    </View>
    );
};

const styles = StyleSheet.create({
  TopBar: {
    flexDirection: "row",
    width: "100%",
    height: 60,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    backgroundColor: "white",
    zIndex: 100,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoText: {
    color: "black",
    fontSize: 20,
    fontWeight: "bold",
  },
  sideIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,

  }
});

export default TopBar;
