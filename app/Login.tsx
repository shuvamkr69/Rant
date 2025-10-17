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

  const handleLogin = async () => {
    try {
      const response = await api.post("/api/v1/users/login", {
        mobileNumber: formData.mobileNumber,
      });
      console.log(response.data);
      if (response.status === 200) {
        await AsyncStorage.setItem("accessToken", response.data.accessToken);
        await signIn(); // This will set isSignedIn to true and store it
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
        <View>
          <TouchableOpacity onPress={() => navigation.replace("/Register")}>
            <Text>Register page</Text>
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
});

export default Login;
