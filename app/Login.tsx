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
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleLogin = async () => {
    try {
      const response = await api.post("/api/v1/users/login", {
        email: formData.email,
        password: formData.password,
      });
      console.log(response.data);
      if (response.status === 200) {
        AsyncStorage.setItem("isSignedIn", "true");
        AsyncStorage.setItem("accessToken", response.data.accessToken);
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
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={"#adadadff"}
            onChangeText={(value) => setFormData({ ...formData, email: value })}
          ></TextInput>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={"#adadadff"}
            secureTextEntry={true}
            onChangeText={(value) =>
              setFormData({ ...formData, password: value })
            }
          ></TextInput>
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
