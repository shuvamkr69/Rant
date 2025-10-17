import { useTheme } from "@/components/contexts/ThemeContext";
import { Colors } from "@/constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type screenName = {
    screenName?: string;
}

const BackButton = (props: screenName) => {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const navigation = useNavigation();

  const handleBackPress = () => {
    navigation.goBack();
  };
  return (
    <View>
      <View style = {styles.BackButton}>
        <TouchableOpacity onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style = {[styles.BackButtonText, { color: colors.text }]}>{props.screenName}</Text>
      </View>
    </View>
  );
 

};
 const styles = StyleSheet.create({
    container : {
        flex:1,
        flexDirection: "row", 
    },
    BackButton : {
        marginTop: 10,  
        flexDirection: "row",
        gap: 10,
        marginLeft: 10,
    },
    BackButtonText : {
        color: "white",
        fontSize: 22,
        fontWeight: "bold",
        marginLeft: 10,
    }


})

export default BackButton;
