import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type screenName = {
  screenName?: string;
};

const BackButton = (props: screenName) => {
  const navigation = useNavigation();

  const handleBackPress = () => {
    navigation.goBack();
  };
  return (
    <View style={styles.container}>
      <View style={styles.BackButton}>
        <TouchableOpacity onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.BackButtonText, { color: "#fff" }]}>
          {props.screenName}
        </Text>
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000000",
    paddingVertical: 10,
  },
  BackButton: {
    marginTop: 10,
    flexDirection: "row",
    gap: 10,
    marginLeft: 10,
  },
  BackButtonText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginLeft: 10,
  },
});

export default BackButton;
