import { useAuth } from "@/components/contexts/authContext";
import { useTheme } from "@/components/contexts/ThemeContext";
import BackButton from "@/components/resuables/BackButton";
import { api } from "@/components/utils/api";
import { Colors } from "@/constants/theme";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Settings = () => {
  const navigation = useRouter();
  const { colorScheme, themeMode, setThemeMode } = useTheme();
  const { signOut } = useAuth();
  const colors = Colors[colorScheme];

  const isDarkMode = colorScheme === "dark";

  const handleThemeToggle = (value: boolean) => {
    setThemeMode(value ? "dark" : "light");
  };

  const handleLogout = async () => {
    try {
      const response = await api.post("/api/v1/users/logout");
      if (response.status === 200) {
        console.log("Logged out successfully");
      }
    } catch (error) {
      console.log("Logout API error:", error);
    } finally {
      // Always sign out locally regardless of API response
      await signOut();
      navigation.replace("/Login");
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <BackButton screenName="Settings" />
      <View style={styles.content}>
        <View style={styles.settingItem}>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Dark Mode
            </Text>
            <Text style={[styles.settingDescription, { color: colors.icon }]}>
              Enable dark theme for the app
            </Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={handleThemeToggle}
            trackColor={{ false: "#767577", true: colors.tint }}
            thumbColor={isDarkMode ? "#f4f3f4" : "#f4f3f4"}
          />
        </View>
        <TouchableOpacity
          style={styles.loginButton}
          activeOpacity={0.9}
          onPress={() => handleLogout()}
        >
          <Text style={styles.loginButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 30,
    marginTop: 10,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(128, 128, 128, 0.1)",
    marginBottom: 12,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  loginButton: {
    marginTop: 30,
    padding: 15,
    backgroundColor: "#ffffff",
    borderRadius: 15,
  },
  loginButtonText: {
    color: "#000000",
    fontWeight: "600",
    fontSize: 18,
  },
});

export default Settings;
