import { AuthProvider, useAuth } from "@/components/contexts/authContext";
import { ChatProvider } from "@/components/contexts/chatContext";
import { ThemeProvider, useTheme } from "@/components/contexts/ThemeContext";
import {
  DarkTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { BlurView } from "expo-blur";
import * as NavigationBar from "expo-navigation-bar";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { AppState, Platform, StyleSheet } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export const unstable_settings = {
  anchor: "(tabs)",
};

const screenOptions = {
  animation: "fade" as const,
  animationDuration: 300,
};

function BlurTransitionOverlay({ isVisible }: { isVisible: boolean }) {
  const opacity = useSharedValue(0);
  const blurIntensity = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      opacity.value = withTiming(1, {
        duration: 200,
        easing: Easing.inOut(Easing.ease),
      });
      blurIntensity.value = withTiming(20, {
        duration: 200,
        easing: Easing.inOut(Easing.ease),
      });

      setTimeout(() => {
        opacity.value = withTiming(0, {
          duration: 300,
          easing: Easing.inOut(Easing.ease),
        });
        blurIntensity.value = withTiming(0, {
          duration: 300,
          easing: Easing.inOut(Easing.ease),
        });
      }, 200);
    }
  }, [isVisible]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  if (!isVisible && opacity.value === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.blurOverlay, animatedStyle]}
      pointerEvents="none"
    >
      <BlurView intensity={50} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

type RootNavigator = {
  isSignedIn: boolean;
};
function RootNavigator() {
  const { colorScheme } = useTheme();
  const { isSignedIn, isLoading } = useAuth();
  const [showBlur, setShowBlur] = useState(false);
  const [prevIsSignedIn, setPrevIsSignedIn] = useState(isSignedIn);

  useEffect(() => {
    const applyAndroidSystemBars = async () => {
      if (Platform.OS !== "android") return;
      try {
        await NavigationBar.setBackgroundColorAsync("#6b1fa8");
        await NavigationBar.setButtonStyleAsync("light");
        await NavigationBar.setVisibilityAsync("visible");
        await NavigationBar.setBehaviorAsync("inset-swipe");
      } catch (e) {}
    };
    applyAndroidSystemBars();

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        applyAndroidSystemBars();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (prevIsSignedIn !== isSignedIn && !isLoading) {
      setShowBlur(true);
      const timer = setTimeout(() => {
        setShowBlur(false);
      }, 500);
      setPrevIsSignedIn(isSignedIn);
      return () => clearTimeout(timer);
    }
  }, [isSignedIn, isLoading, prevIsSignedIn]);

  if (isLoading) {
    return null;
  }

  return (
    <NavigationThemeProvider value={DarkTheme}>
      {isSignedIn ? (
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade",
            animationDuration: 1000,
            gestureEnabled: true,
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{
              gestureEnabled: false,
            }}
            listeners={{
              focus: () => setShowBlur(true),
            }}
          />
          <Stack.Screen
            name="Settings"
            listeners={{
              focus: () => setShowBlur(true),
            }}
          />
          <Stack.Screen
            name="Notifications"
            listeners={{
              focus: () => setShowBlur(true),
            }}
          />
          <Stack.Screen
            name="ChatScreen"
            listeners={{
              focus: () => setShowBlur(true),
            }}
          />
        </Stack>
      ) : (
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade",
            animationDuration: 300,
            gestureEnabled: true,
          }}
        >
          <Stack.Screen
            name="Register"
            options={{
              gestureEnabled: false,
            }}
            listeners={{
              focus: () => setShowBlur(true),
            }}
          />
          <Stack.Screen
            name="Login"
            listeners={{
              focus: () => setShowBlur(true),
            }}
          />
          <Stack.Screen
            name="ListenerDetailScreen"
            listeners={{
              focus: () => setShowBlur(true),
            }}
          />
        </Stack>
      )}

      <BlurTransitionOverlay isVisible={showBlur} />
      <StatusBar
        style="light"
        backgroundColor="#6b1fa8"
        translucent={false}
        hidden={false}
        animated={true}
      />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ChatProvider>
          <RootNavigator />
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
});
