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

const Register = () => {
  const navigation = useRouter();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleRegister = async () => {
    try {
      const response = await api.post("/api/v1/users/register", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      console.log(response.data);
      if (response.status === 201) {
        AsyncStorage.setItem("isSignedIn", "true");
        setIsSignedIn(true);
        AsyncStorage.setItem("accessToken", response.data.accessToken);
      }
      if (isSignedIn) {
        navigation.replace("/(tabs)");
      }
    } catch (error) {
      console.log("The registeration has failed ", error);
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.registerPage}>
        <Text style={styles.headingText}>Register</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter Your Name"
            placeholderTextColor={"#adadadff"}
            onChangeText={(value) => setFormData({ ...formData, name: value })}
          ></TextInput>
          <TextInput
            style={styles.input}
            placeholder="Enter Your Email"
            placeholderTextColor={"#adadadff"}
            onChangeText={(value) => setFormData({ ...formData, email: value })}
          ></TextInput>
          <TextInput
            style={styles.input}
            placeholder="Enter Your Password"
            placeholderTextColor={"#adadadff"}
            onChangeText={(value) =>
              setFormData({ ...formData, password: value })
            }
          ></TextInput>
          <TextInput
            style={styles.input}
            placeholder="Confirm Your Password"
            placeholderTextColor={"#adadadff"}
            onChangeText={(value) =>
              setFormData({ ...formData, confirmPassword: value })
            }
          ></TextInput>
        </View>
        <TouchableOpacity
          style={styles.registerButton}
          activeOpacity={0.9}
          onPress={handleRegister}
        >
          <Text style={styles.registerButtonText}>Register</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.registerButton}
          activeOpacity={0.9}
          onPress={() => navigation.navigate("/Login")}
        >
          <Text style={styles.registerButtonText}>Login Screen</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  registerPage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headingText: {
    fontSize: 30,
    fontWeight: "600",
    color: "#ffffffff",
    marginBottom: 50,
  },
  inputContainer: {
    borderWidth: 2,
    borderColor: "#ffffff",
    gap: 30,
    padding: 20,
    borderRadius: 15,
  },
  input: {
    width: 300,
    height: 50,
    padding: 10,
    color: "#ffffff",
    borderWidth: 1,
    borderColor: "#ffffff",
    borderRadius: 15,
  },
  registerButton: {
    marginTop: 30,
    padding: 15,
    backgroundColor: "#ffffff",
    borderRadius: 15,
  },
  registerButtonText: {
    color: "#000000",
    fontWeight: "600",
    fontSize: 18,
  },
});

export default Register;
