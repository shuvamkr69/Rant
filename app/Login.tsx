import { useAuth } from "@/components/contexts/authContext";
import { api } from "@/components/utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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
  const [formData, setFormData] = useState({
    mobileNumber: "",
  });

  const handleClearToken = async () => {
    try {
      const oldToken = await AsyncStorage.getItem("accessToken");
      console.log(
        "🗑️ Clearing token:",
        oldToken ? oldToken.substring(0, 20) + "..." : "none"
      );
      await AsyncStorage.removeItem("accessToken");
      await AsyncStorage.removeItem("isSignedIn");
      console.log("✅ Token AND isSignedIn cleared successfully");
      alert("Token cleared! Please restart the app or login fresh.");
    } catch (error) {
      console.error("❌ Error clearing token:", error);
      alert("Failed to clear token");
    }
  };

  const handleLogin = async () => {
    try {
      // Log old token before clearing
      const oldToken = await AsyncStorage.getItem("accessToken");
      console.log(
        "🔓 Old token before login:",
        oldToken ? oldToken.substring(0, 20) + "..." : "none"
      );

      const response = await api.post("/api/v1/users/login", {
        mobileNumber: formData.mobileNumber,
      });
      console.log("📱 Login response:", response.data);

      if (response.status === 200) {
        // Clear old token first
        await AsyncStorage.removeItem("accessToken");
        await AsyncStorage.removeItem("isSignedIn");
        console.log("🗑️ Old credentials cleared");

        // Save new token
        const newToken = response.data.accessToken;
        console.log(
          "🔐 New token (first 20 chars):",
          newToken.substring(0, 20) + "..."
        );
        await AsyncStorage.setItem("accessToken", newToken);

        await signIn(); // This will set isSignedIn to true and store it
        console.log("✅ Login complete, navigating to tabs");
        navigation.replace("/(tabs)");
      }
    } catch (error) {
      console.log("The login has failed ", error);
    }
  };
  return (
    <SafeAreaProvider>
      <View style={styles.loginPage}>
        <Text style={styles.headingText}>Login</Text>
        <View style={styles.inputContainer}>
          <View>
            <TextInput
              style={styles.input}
              placeholder="Your Mobile Number"
              placeholderTextColor={"#adadadff"}
              onChangeText={(value) =>
                setFormData({ ...formData, mobileNumber: value })
              }
            ></TextInput>
          </View>
        </View>
        <View>
          <TouchableOpacity
            style={styles.loginButton}
            activeOpacity={0.9}
            onPress={handleLogin}
          >
            <Text style={{ color: "black", fontWeight: "bold", fontSize: 20 }}>
              Login
            </Text>
          </TouchableOpacity>
        </View>

        {/* Clear Token Button */}
        <View>
          <TouchableOpacity
            style={styles.clearTokenButton}
            activeOpacity={0.9}
            onPress={handleClearToken}
          >
            <Text style={styles.clearTokenText}>🗑️ Clear Cached Token</Text>
          </TouchableOpacity>
        </View>

        <View>
          <TouchableOpacity onPress={() => navigation.replace("/Register")}>
            <Text style={styles.registerText}>Register page</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  loginPage: {
    flex: 1,
    alignItems: "center",
  },
  headingText: {
    color: "white",
    fontSize: 30,
    fontWeight: "bold",
    marginTop: 100,
  },
  inputContainer: {
    borderWidth: 2,
    borderRadius: 15,
    borderColor: "white",
    padding: 20,
    marginTop: 50,
    gap: 30,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    borderColor: "white",
    height: 50,
    width: 300,
    paddingLeft: 10,
    color: "white",
  },
  loginButton: {
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 10,
    marginTop: 30,
  },
  clearTokenButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#ff6b6b",
    padding: 12,
    borderRadius: 10,
    marginTop: 15,
    minWidth: 200,
    alignItems: "center",
  },
  clearTokenText: {
    color: "#ff6b6b",
    fontWeight: "600",
    fontSize: 14,
  },
  registerText: {
    color: "white",
    fontSize: 14,
    marginTop: 15,
  },
});

export default Login;
