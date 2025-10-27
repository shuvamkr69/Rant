import { useAuth } from "@/components/contexts/authContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  BackHandler,
  Dimensions,
  Image,
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
    age: 0,
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
      await AsyncStorage.setItem("userType", formData.userType);
      await AsyncStorage.setItem("name", formData.name);
      await AsyncStorage.setItem("mobileNumber", formData.mobileNumber);

      if(userType === "User") {
        navigation.push("/UserDetailScreen");
      } else {
        navigation.push("/ListenerDetailScreen");
      }
    } catch (error) {
      console.log("Error saving registration data:", error);
      return;
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.registerPage}>
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

        {/* Content */}
        <View style={styles.contentContainer}>
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
              onChangeText={(value) =>
                setFormData({ ...formData, name: value })
              }
            ></TextInput>

            <TextInput
              style={styles.input}
              placeholder="Enter Your Age"
              placeholderTextColor={"#adadadff"}
              onChangeText={(value) =>
                setFormData({ ...formData, age: value } as any)
              }
            ></TextInput>
            <View>
              <TextInput
                style={styles.input}
                placeholder="Enter Your Mobile Number"
                keyboardType="numeric"
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
            activeOpacity={0.9}
            onPress={() => navigation.push("/Login")}
          >
            <View style={styles.goToLoginScreenContainer}>
              <Text style={styles.alreadyHaveAccountText}>
                Already have an account?{" "}
              </Text>
              <Text style={styles.goToLoginScreen}>Login in</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  registerPage: {
    flex: 1,
    backgroundColor: "#000000",
  },
  topImageContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: Dimensions.get("window").height * 0.4, // 40% of screen height
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
    gap: 30,
    padding: 20,
    borderRadius: 15,
  },
  input: {
    minWidth: "100%",
    height: 50,
    padding: 10,
    color: "#ffffff",
    borderWidth: 1,
    borderColor: "#ffffff",
    borderRadius: 15,
  },
  registerButton: {
    marginTop: 30,
    paddingVertical: 15,
    width: "90%",
    backgroundColor: "#ffffff",
    borderRadius: 15,
  },
  registerButtonText: {
    color: "#000000",
    fontWeight: "600",
    fontSize: 18,
    textAlign: "center",
  },
  goToLoginScreenContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  alreadyHaveAccountText: {
    color: "#ffffffff",
    fontWeight: "400",
    fontSize: 14,
    textAlign: "center",
  },
  goToLoginScreen: {
    color: "#ff0000ff",
    fontWeight: "400",
    fontSize: 14,
    textAlign: "center",
  },
});

export default Register;
