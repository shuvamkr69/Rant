import { AuthProvider, useAuth } from "@/components/contexts/authContext";
import { ChatProvider } from "@/components/contexts/chatContext";
import { ThemeProvider, useTheme } from "@/components/contexts/ThemeContext";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { BlurView } from "expo-blur";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export const unstable_settings = {
  anchor: "(tabs)",
};

// Screen transition animation config
const screenOptions = {
  animation: "fade" as const,
  animationDuration: 300,
};

// Blur Transition Overlay Component
function BlurTransitionOverlay({ isVisible }: { isVisible: boolean }) {
  const opacity = useSharedValue(0);
  const blurIntensity = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      // Fade in and blur
      opacity.value = withTiming(1, {
        duration: 200,
        easing: Easing.inOut(Easing.ease),
      });
      blurIntensity.value = withTiming(20, {
        duration: 200,
        easing: Easing.inOut(Easing.ease),
      });

      // Fade out after a brief moment
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
    <Animated.View style={[styles.blurOverlay, animatedStyle]} pointerEvents="none">
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

  // Trigger blur effect on authentication state change
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
    // Return a loading screen while checking authentication status
    return null; // or a custom loading component
  }

  return (
    <NavigationThemeProvider
      value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
    >
      {isSignedIn ? (
        <Stack
          screenOptions={{
            animation: "fade",
            animationDuration: 300,
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
            listeners={{
              focus: () => setShowBlur(true),
            }}
          />
          <Stack.Screen
            name="Settings"
            options={{
              headerShown: false,
            }}
            listeners={{
              focus: () => setShowBlur(true),
            }}
          />
          <Stack.Screen
            name="Notifications"
            options={{
              headerShown: false,
            }}
            listeners={{
              focus: () => setShowBlur(true),
            }}
          />
          <Stack.Screen
            name="ChatScreen"
            options={{
              headerShown: false,
            }}
            listeners={{
              focus: () => setShowBlur(true),
            }}
          />
        </Stack>
      ) : (
        <Stack
          screenOptions={{
            animation: "fade",
            animationDuration: 300,
          }}
        >
          <Stack.Screen
            name="Register"
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
            listeners={{
              focus: () => setShowBlur(true),
            }}
          />
          <Stack.Screen
            name="Login"
            options={{
              headerShown: false,
            }}
            listeners={{
              focus: () => setShowBlur(true),
            }}
          />
        </Stack>
      )}

      <BlurTransitionOverlay isVisible={showBlur} />
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
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
