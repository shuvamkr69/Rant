import { useAuth } from "@/components/contexts/authContext";
import { useChat } from "@/components/contexts/chatContext";
import BackButton from "@/components/resuables/BackButton";
import { api } from "@/components/utils/api";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Settings = () => {
  const navigation = useRouter();
  const { signOut } = useAuth();
  const { socket } = useChat();
  const colors = Colors;

  const [pushNotifications, setPushNotifications] = React.useState(true);
  const [emailNotifications, setEmailNotifications] = React.useState(false);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            console.log("🔓 Logout button pressed - Starting logout process");

            // Disconnect socket first
            if (socket) {
              console.log("🔌 Disconnecting socket on logout");
              socket.disconnect();
            }

            // Call backend logout endpoint (backend will log the user ID)
            const response = await api.post("/api/v1/users/logout");
            if (response.status === 200) {
              console.log("✅ Logged out successfully from backend");
              console.log("✅ Response:", response.data);
            }
          } catch (error: any) {
            console.log("⚠️ Logout API error:", error);
            if (error.response) {
              console.log("⚠️ Error response:", error.response.data);
            }
          } finally {
            // Always sign out locally regardless of API response
            await signOut();
            console.log("✅ Local auth state cleared");
            navigation.replace("/Login");
          }
        },
      },
    ]);
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showArrow = true,
    showSwitch = false,
    switchValue = false,
    onSwitchChange,
  }: any) => (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: colors.cardBackground }]}
      activeOpacity={0.7}
      onPress={onPress}
      disabled={showSwitch}
    >
      <View style={styles.settingLeft}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.accent + "20" },
          ]}
        >
          <Ionicons name={icon} size={22} color={colors.tint} />
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.settingDescription, { color: colors.icon }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {showSwitch && (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: colors.border, true: colors.accent }}
          thumbColor={switchValue ? colors.tint : "#f4f3f4"}
        />
      )}
      {showArrow && !showSwitch && (
        <Ionicons name="chevron-forward" size={20} color={colors.icon} />
      )}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={[styles.sectionHeader, { color: colors.icon }]}>{title}</Text>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <BackButton screenName="Settings" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <SectionHeader title="ACCOUNT" />
        <SettingItem
          icon="person-outline"
          title="Edit Profile"
          subtitle="Update your personal information"
          onPress={() => navigation.push("/MyProfile")}
        />
        <SettingItem
          icon="lock-closed-outline"
          title="Change Password"
          subtitle="Update your password"
          onPress={() =>
            Alert.alert("Coming Soon", "This feature is under development")
          }
        />
        <SettingItem
          icon="trash-outline"
          title="Delete Account"
          subtitle="Permanently delete your account"
          onPress={() => {
            Alert.alert(
              "Delete Account",
              "Are you sure? This action cannot be undone.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => {} },
              ]
            );
          }}
        />

        {/* Notifications Section */}
        <SectionHeader title="NOTIFICATIONS" />
        <SettingItem
          icon="notifications-outline"
          title="Push Notifications"
          subtitle="Receive push notifications"
          showSwitch={true}
          switchValue={pushNotifications}
          onSwitchChange={setPushNotifications}
        />
        <SettingItem
          icon="mail-outline"
          title="Email Notifications"
          subtitle="Receive email updates"
          showSwitch={true}
          switchValue={emailNotifications}
          onSwitchChange={setEmailNotifications}
        />

        {/* Privacy & Security Section */}
        <SectionHeader title="PRIVACY & SECURITY" />
        <SettingItem
          icon="shield-checkmark-outline"
          title="Privacy Policy"
          subtitle="Read our privacy policy"
          onPress={() => navigation.push("/PrivacyPolicy" as any)}
        />
        <SettingItem
          icon="document-text-outline"
          title="Terms & Conditions"
          subtitle="Read our terms of service"
          onPress={() => navigation.push("/TermsAndConditions" as any)}
        />
        <SettingItem
          icon="eye-off-outline"
          title="Blocked Users"
          subtitle="Manage blocked users"
          onPress={() =>
            Alert.alert("Coming Soon", "This feature is under development")
          }
        />

        {/* Support Section */}
        <SectionHeader title="SUPPORT" />
        <SettingItem
          icon="help-circle-outline"
          title="Help & Support"
          subtitle="Get help and contact us"
          onPress={() => navigation.push("/HelpSupport" as any)}
        />
        <SettingItem
          icon="chatbubble-ellipses-outline"
          title="Send Feedback"
          subtitle="Share your thoughts with us"
          onPress={() =>
            Alert.alert("Feedback", "Please email us at support@rant.com")
          }
        />
        <SettingItem
          icon="star-outline"
          title="Rate Us"
          subtitle="Rate us on the app store"
          onPress={() =>
            Alert.alert("Thank You!", "Please rate us on your app store")
          }
        />

        {/* About Section */}
        <SectionHeader title="ABOUT" />
        <SettingItem
          icon="information-circle-outline"
          title="About Rant"
          subtitle="Learn more about the app"
          onPress={() => navigation.push("/AboutScreen" as any)}
        />

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: "#ff4444" }]}
          activeOpacity={0.9}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 16,
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
  },
  logoutButton: {
    marginTop: 32,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  logoutButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
});

export default Settings;
