import { Tabs } from "expo-router";
import React, { useEffect } from "react";
import { BackHandler, Platform } from "react-native";

import { useTheme } from "@/components/contexts/ThemeContext";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function TabLayout() {
  const { colorScheme } = useTheme();

  // Handle Android back button to exit app
  useEffect(() => {
    if (Platform.OS === "android") {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          // Return true to prevent default back behavior
          // This will effectively close the app when on the tabs screen
          BackHandler.exitApp();
          return true;
        }
      );

      return () => backHandler.remove();
    }
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#a566daff",
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingVertical: 3,
          height: 55,
          backgroundColor: "#000000ff",
          borderColor: "#6b1fa8",
          borderWidth: 1,
          borderRadius: 50,
          position: "absolute",
          margin: 10,
          elevation: 5,
          shadowColor: "#6b1fa8",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.7,
          shadowRadius: 5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Chats"
        options={{
          title: "Chats",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="message.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="MyWallet"
        options={{
          title: "Wallet",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="creditcard.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="MyProfile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
