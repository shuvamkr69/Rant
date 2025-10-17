import { AuthProvider, useAuth } from "@/components/contexts/authContext";
import { ChatProvider } from "@/components/contexts/chatContext";
import { ThemeProvider, useTheme } from "@/components/contexts/ThemeContext";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

export const unstable_settings = {
  anchor: "(tabs)",
};

type RootNavigator = {
  isSignedIn: boolean;
};
function RootNavigator() {
  const { colorScheme } = useTheme();

  const { isSignedIn, isLoading } = useAuth();

  if (isLoading) {
    // Return a loading screen while checking authentication status
    return null; // or a custom loading component
  }

  return (
    <NavigationThemeProvider
      value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
    >
      {isSignedIn ? (
        <Stack>
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="Settings"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="Notifications"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="ChatScreen"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
      ) : (
        <Stack>
          <Stack.Screen
            name="Register"
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="Login"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
      )}

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
