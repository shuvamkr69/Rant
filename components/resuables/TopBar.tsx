import { useTheme } from "@/components/contexts/ThemeContext";
import { Colors } from "@/constants/theme";
import { RootStackParamList } from "@/types/navigation";
import Ionicons from "@expo/vector-icons/Ionicons";
import { NavigationProp } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Platform,
} from "react-native";
import LottieView from "lottie-react-native";

const TopBar = () => {
  const navigate = useNavigation<NavigationProp<RootStackParamList>>();
  const { colorScheme } = useTheme();
  const colors = Colors;

  const navigateToSettings = () => {
    navigate.navigate("Settings");
  };

  // Animated flowing gradient animation
  const windowWidth = Dimensions.get("window").width;
  const flowAnim = useRef(new Animated.Value(0)).current;

  // Easter egg: Chest animation state
  const [clickCount, setClickCount] = useState(0);
  const [showGorilla, setShowGorilla] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const lottieRef = useRef<LottieView>(null);
  const flashAnim = useRef(new Animated.Value(0)).current;
  const imageScaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(flowAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      }),
      { iterations: -1 },
    );
    loop.start();
    return () => loop.stop();
  }, [flowAnim]);

  const handleChestClick = () => {
    // Play the Lottie animation
    lottieRef.current?.play();

    // Scale animation
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.3,
        useNativeDriver: true,
        damping: 10,
        stiffness: 300,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 10,
        stiffness: 300,
      }),
    ]).start();

    // Increment click count
    const newCount = clickCount + 1;
    setClickCount(newCount);

    // Show gorilla after 3 clicks
    if (newCount >= 3) {
      setTimeout(() => {
        setShowGorilla(true);
        setClickCount(0); // Reset counter
        
        // White flash animation
        Animated.sequence([
          Animated.timing(flashAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(flashAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
        
        // Image scale animation
        Animated.spring(imageScaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 15,
          stiffness: 150,
        }).start();
      }, 500);
    }
  };

  const closeGorillaModal = () => {
    setShowGorilla(false);
    // Reset image scale for next time
    imageScaleAnim.setValue(0.5);
  };

  const translateX = flowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -windowWidth],
  });

  return (
    <>
      <View style={{ position: "relative" }}>
        <View style={[styles.TopBar, { backgroundColor: "#000000" }]}>
          <View style={styles.sideIconContainer}>
            <TouchableOpacity onPress={navigateToSettings}>
              <Ionicons name="cog-outline" size={26} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/images/icons/logo.png")}
              style={{ width: 50, height: 50 }}
            />
            <Text style={[styles.logoText, { color: colors.text }]}>Rant</Text>
          </View>
          {/* Easter egg: Chest animation */}
          <Animated.View style={[styles.chestContainer, { transform: [{ scale: scaleAnim }] }]}>
            <TouchableOpacity onPress={handleChestClick} activeOpacity={0.7}>
              {Platform.OS === 'web' ? (
                // Fallback icon for Expo Go / Web
                <Ionicons name="gift" size={30} color="#a855f7" />
              ) : (
                <LottieView
                  ref={lottieRef}
                  source={require("../../assets/animations/openingChestAnimation.json")}
                  autoPlay={false}
                  loop={false}
                  style={{ width: 40, height: 40 }}
                />
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
        {/* Animated flowing gradient bottom border */}
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 1,
            overflow: "hidden",
            zIndex: 1000,
          }}
          pointerEvents="none"
        >
          <Animated.View style={{ flex: 1, transform: [{ translateX }] }}>
            <LinearGradient
              colors={[
                "#a855f7",
                "#7c3aed",
                "#c084fc",
                "#9333ea",
                "#a855f7",
                "#7c3aed",
              ]}
              locations={[0, 0.2, 0.4, 0.6, 0.8, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ width: windowWidth * 2, height: 3 }}
            />
          </Animated.View>
        </View>
      </View>

      {/* Gorilla Modal */}
      <Modal
        visible={showGorilla}
        transparent={true}
        animationType="none"
        onRequestClose={closeGorillaModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeGorillaModal}
        >
          {/* White Flash Overlay */}
          <Animated.View
            style={[
              styles.flashOverlay,
              {
                opacity: flashAnim,
              },
            ]}
          />
          
          <Animated.View style={[styles.modalContent, { transform: [{ scale: imageScaleAnim }] }]}>
            <Image
              source={require("../../assets/images/gorillaMiddleFinger.png")}
              style={styles.gorillaImage}
              resizeMode="contain"
            />
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  TopBar: {
    flexDirection: "row",
    width: "100%",
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 15,
    zIndex: 100,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoText: {
    fontSize: 25,
    fontWeight: "bold",
  },
  sideIconContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    left: 20,
  },
  chestContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    right: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  flashOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    zIndex: 1,
  },
  modalContent: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  gorillaImage: {
    width: 400,
    height: 400,
  },
});

export default TopBar;
