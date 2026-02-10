import { useAuth } from "@/components/contexts/authContext";
import { api } from "@/components/utils/api";
import {
  registerForPushNotificationsAsync,
  sendPushTokenToBackend,
} from "@/components/utils/notifications";
import {
  setAccessToken,
  setRefreshToken,
} from "@/components/utils/tokenStorage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

const Login = () => {
  const navigation = useRouter();
  const { signIn } = useAuth();
  const colors = {
    background: "#000000",
    text: "#ffffff",
    icon: "#adadadff",
    tint: "#ff0000ff",
  };
  const [formData, setFormData] = useState({
    mobileNumber: "",
  });

  const handleLogin = async () => {
    try {
      const response = await api.post("/api/v1/users/login", {
        mobileNumber: formData.mobileNumber,
      });

      if (response.status === 200) {
        const { accessToken, refreshToken } = response.data;

        console.log("🔐 [Login] Storing tokens...");
        // Store tokens in memory and secure storage (assuming 15 minutes expiry)
        await setAccessToken(accessToken, 900);
        await setRefreshToken(refreshToken);
        console.log("✅ [Login] Tokens stored successfully");

        await signIn();
        console.log("✅ [Login] User signed in");

        // Navigate to tabs first
        navigation.replace("/(tabs)");

        // Register push token after login (non-blocking, after navigation)
        console.log("🔔 [Login] Scheduling push token registration...");
        setTimeout(async () => {
          console.log("🔔 [Login] Starting push token registration...");
          try {
            const pushToken = await registerForPushNotificationsAsync();
            console.log("🔔 [Login] Push token received:", pushToken);
            
            if (pushToken) {
              console.log("🔔 [Login] Sending push token to backend...");
              const sent = await sendPushTokenToBackend(pushToken);
              if (sent) {
                console.log("✅ [Login] Push token successfully sent");
              } else {
                console.warn("⚠️ [Login] Failed to send push token");
              }
            } else {
              console.warn("⚠️ [Login] Push token is null, not sending to backend");
            }
          } catch (error) {
            console.error("❌ [Login] Failed to register push token:", error);
          }
        }, 1500); // Increased delay to 1.5 seconds
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };
  return (
    <SafeAreaProvider>
      <View style={[styles.loginPage, { backgroundColor: colors.background }]}>
        <View style={styles.topImageContainer}>
          <Image
            source={require("@/assets/images/RegisterLoginScreenTopImage.png")}
            style={styles.topImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)", "#000000"]}
            style={styles.gradient}
            locations={[0, 0.7, 1]}
          />
        </View>

        <View style={styles.contentContainer}>
          <Text style={[styles.headingText, { color: colors.text }]}>
            Login
          </Text>

          <View style={styles.inputContainer}>
            <View>
              <TextInput
                style={styles.input}
                placeholder="Your Mobile Number"
                placeholderTextColor={"#adadadff"}
                onChangeText={(value) =>
                  setFormData({ ...formData, mobileNumber: value })
                }
                keyboardType="numeric"
              ></TextInput>
            </View>
          </View>

          <View>
            <TouchableOpacity
              style={styles.loginButton}
              activeOpacity={0.9}
              onPress={handleLogin}
            >
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.replace("/Register")}
          >
            <View style={styles.goToRegisterScreenContainer}>
              <Text style={styles.dontHaveAccountText}>
                Don't have an account?{" "}
              </Text>
              <Text style={styles.goToRegisterScreen}>Register</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  loginPage: {
    flex: 1,
    backgroundColor: "#000000",
  },
  topImageContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: Dimensions.get("window").height * 0.4,
    zIndex: 0,
  },
  topImage: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "50%",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  headingText: {
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: 2,
    color: "#ffffffff",
    marginBottom: 30,
  },
  inputContainer: {
    gap: 30,
    padding: 20,
    borderRadius: 15,
  },
  input: {
    minWidth: 300,
    height: 50,
    padding: 10,
    color: "#ffffff",
    borderWidth: 1,
    borderColor: "#ffffff",
    borderRadius: 15,
  },
  loginButton: {
    marginTop: 30,
    paddingVertical: 15,
    width: 340,
    backgroundColor: "#ffffff",
    borderRadius: 15,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#000000",
    fontWeight: "600",
    fontSize: 18,
  },
  goToRegisterScreenContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  dontHaveAccountText: {
    color: "#ffffffff",
    fontWeight: "400",
    fontSize: 14,
    textAlign: "center",
  },
  goToRegisterScreen: {
    color: "#ff0000ff",
    fontWeight: "400",
    fontSize: 14,
    textAlign: "center",
  },
});

export default Login;
