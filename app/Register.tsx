import { useAuth } from "@/components/contexts/authContext";
import { api } from "@/components/utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  BackHandler,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

const Register = () => {
  const navigation = useRouter();
  const { signIn } = useAuth();
  const [userType, setUserType] = useState<"User" | "Listener">("User");
  const [formData, setFormData] = useState({
    userType: userType,
    name: "",
    mobileNumber: "",
  });

  useEffect(() => {
    if (Platform.OS === "android") {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          BackHandler.exitApp();
          return true;
        }
      );

      return () => backHandler.remove();
    }
  }, []);

  const slideAnimation = useSharedValue(0);

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: slideAnimation.value }],
    };
  });

  const handleUserTypeSelection = (type: "User" | "Listener") => {
    setUserType(type);
    slideAnimation.value = withSpring(type === "User" ? 0 : 150, {
      damping: 100,
      stiffness: 1500,
    });
  };

  const handleRegister = async () => {
    try {
      const response = await api.post("/api/v1/users/register", {
        name: formData.name,
        mobileNumber: formData.mobileNumber,
        userType: userType,
      });
      console.log(response.data);
      if (response.status === 201) {
        await AsyncStorage.setItem("accessToken", response.data.accessToken);
        await signIn();
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

        <View style={styles.userTypeContainer}>
          <View style={styles.userTypeSelector}>
            <Animated.View
              style={[styles.selectionIndicator, animatedIndicatorStyle]}
            />

            <TouchableOpacity
              style={styles.userTypeOption}
              onPress={() => handleUserTypeSelection("User")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.userTypeText,
                  userType === "User" && styles.userTypeTextActive,
                ]}
              >
                User
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.userTypeOption}
              onPress={() => handleUserTypeSelection("Listener")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.userTypeText,
                  userType === "Listener" && styles.userTypeTextActive,
                ]}
              >
                Listener
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter Your Full Name"
            placeholderTextColor={"#adadadff"}
            onChangeText={(value) => setFormData({ ...formData, name: value })}
          ></TextInput>
          <View>
            <TextInput
              style={styles.input}
              placeholder="Enter Your Mobile Number"
              placeholderTextColor={"#adadadff"}
              onChangeText={(value) =>
                setFormData({ ...formData, mobileNumber: value })
              }
            />
          </View>
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
    marginBottom: 30,
  },
  userTypeContainer: {
    marginBottom: 40,
    width: 300,
  },
  userTypeSelector: {
    flexDirection: "row",
    backgroundColor: "#333333",
    borderRadius: 25,
    padding: 4,
    position: "relative",
    height: 50,
  },
  selectionIndicator: {
    position: "absolute",
    width: 150,
    height: 42,
    backgroundColor: "#ffffff",
    borderRadius: 21,
    top: 4,
    left: 4,
  },
  userTypeOption: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  userTypeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#999999",
  },
  userTypeTextActive: {
    color: "#000000",
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
