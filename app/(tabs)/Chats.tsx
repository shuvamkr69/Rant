import TopBar from "@/components/resuables/TopBar";
import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const mockChats = ["1", "2", "3", "4","1", "2", "3", "4","1", "2", "3", "4"];

const Chats = () => {
  return (
    <SafeAreaView style={styles.container}>
      <TopBar />
      <View style={styles.chatsContainer}>
        <View style = {styles.cardsContainer}>
            <Text style = {styles.headingText}>Chats</Text>
        <FlatList 
          data={mockChats} 
          keyExtractor={(item, index) => index.toString()} 
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text>{item}</Text>
            </View>
          )}
        />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatsContainer: {
    flex: 1,
    width: "100%",
  },
  cardsContainer : {
    flex: 1,
    width: "100%",
    marginTop: 30,
  },
  headingText:{
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    marginLeft: 10
  },
  card: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#E8E8E8",
    justifyContent: "center",
    backgroundColor: "white",
    paddingVertical: 20,
    paddingHorizontal: 15,
    marginHorizontal: 10,
    marginVertical: 5,
    minHeight: 80,
  }
});

export default Chats;
