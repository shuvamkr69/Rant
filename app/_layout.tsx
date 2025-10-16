import { AuthProvider, useAuth } from '@/components/contexts/authContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

export const unstable_settings = {
  anchor: '(tabs)',
};

type RootNavigator = {
  isSignedIn: boolean
}
function RootNavigator() {
  const { colorScheme } = useTheme();

  const {isSignedIn} = useAuth();

  return (
    <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {isSignedIn ? <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="Settings" options={{ headerShown: false}}/>
        <Stack.Screen name="Notifications" options={{ headerShown: false}}/>
      </Stack>: 
      <Stack>
        <Stack.Screen name="Register" options={{ headerShown: false }} />
      </Stack>

      }
      
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
