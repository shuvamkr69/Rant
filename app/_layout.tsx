import { AuthProvider, useAuth } from "@/components/contexts/authContext";
import { ChatProvider } from "@/components/contexts/chatContext";
import { NotificationProvider } from "@/components/contexts/notificationContext";
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

// Custom dark theme with pure black background to prevent white flash during transitions
const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "#000000",
    card: "#000000",
  },
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
        await NavigationBar.setBackgroundColorAsync("#000000");
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
    <NavigationThemeProvider value={CustomDarkTheme}>
      {isSignedIn ? (
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
            animationDuration: 300,
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{
              gestureEnabled: false,
              animation: "fade",
            }}
            listeners={{
              focus: () => setShowBlur(true),
            }}
          />
          <Stack.Screen
            name="Settings"
            options={{
              animation: "slide_from_right",
            }}
            listeners={{
              focus: () => setShowBlur(true),
            }}
          />
          <Stack.Screen
            name="Notifications"
            options={{
              animation: "slide_from_right",
            }}
            listeners={{
              focus: () => setShowBlur(true),
            }}
          />
          <Stack.Screen
            name="ChatScreen"
            options={{
              animation: "slide_from_right",
            }}
            listeners={{
              focus: () => setShowBlur(true),
            }}
          />
          <Stack.Screen
            name="VerificationWaiting"
            options={{
              animation: "slide_from_right",
            }}
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
          <Stack.Screen
            name="UserDetailScreen"
            listeners={{
              focus: () => setShowBlur(true),
            }}
          />
        </Stack>
      )}

      <BlurTransitionOverlay isVisible={showBlur} />
      <StatusBar
        style="light"
        backgroundColor="#000000"
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
        <NotificationProvider>
          <ChatProvider>
            <RootNavigator />
          </ChatProvider>
        </NotificationProvider>
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
