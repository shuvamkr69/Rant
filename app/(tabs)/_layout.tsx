import { Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, LayoutChangeEvent, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useTheme } from "@/components/contexts/ThemeContext";
import { HapticTab } from "@/components/resuables/haptic-tab";
import TopBar from "@/components/resuables/TopBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { SafeAreaView } from "react-native-safe-area-context";

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const [tabWidth, setTabWidth] = useState(0);
  const translateX = useSharedValue(0);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    const calculatedTabWidth = width / state.routes.length;
    setTabWidth(calculatedTabWidth);
  };

  useEffect(() => {
    if (tabWidth > 0) {
      translateX.value = withSpring(state.index * tabWidth, {
        damping: 30,
        stiffness: 200,
        mass: 0.5,
      });
    }
  }, [state.index, tabWidth]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <View style={styles.tabBarContainer} onLayout={onLayout}>
      {tabWidth > 0 && (
        <Animated.View
          style={[
            styles.activeIndicator,
            animatedStyle,
            { width: tabWidth - 16 },
          ]}
        />
      )}
      <View style={styles.tabsWrapper}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const color = isFocused ? "#FFFFFF" : "#6B7280";

          return (
            <HapticTab
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={styles.tab}
            >
              <View style={styles.tabContent}>
                {options.tabBarIcon?.({ focused: isFocused, color, size: 32 })}
                {options.title && (
                  <Animated.Text style={[styles.tabLabel, { color }]}>
                    {options.title}
                  </Animated.Text>
                )}
              </View>
            </HapticTab>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { colorScheme } = useTheme();
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#000000" }}
      edges={["top"]}
    >
      <TopBar />
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          tabBarActiveTintColor: "#FFFFFF",
          tabBarInactiveTintColor: "#6B7280",
          headerShown: false,
          animation: "shift",
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={32} name="house.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="Chats"
          options={{
            title: "Chats",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={32} name="message.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="MyProfile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={32} name="person.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="Premium"
          options={{
            title: "",
            tabBarIcon: ({ color }) => (
              <Image
                source={require("../../assets/images/icons/RantPlusLogo.png")}
                style={{ width: 55, height: 55, tintColor: color }}
                resizeMode="contain"
              />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    height: 75,
    backgroundColor: "#000000ff",
    borderColor: "#2A2A2A",
    borderWidth: 1,
    borderRadius: 50,
    elevation: 5,
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    overflow: "hidden",
    justifyContent: "center",
  },
  activeIndicator: {
    position: "absolute",
    height: "70%",
    borderRadius: 1000,
    backgroundColor: "#a566da88",
    top: "15%",
    marginHorizontal: 8,
  },
  tabsWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  tab: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  tabContent: {
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
});
