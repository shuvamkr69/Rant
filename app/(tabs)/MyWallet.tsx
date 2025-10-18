import { useTheme } from "@/components/contexts/ThemeContext";
import TopBar from "@/components/resuables/TopBar";
import { api } from "@/components/utils/api";
import { Colors } from "@/constants/theme";
import { useFocusEffect } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MyWallet = () => {
  const [walletBalance, setWalletBalance] = useState<any>(null);
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  const fetchBalance = async () => {
    try {
      const response = await api.get("/api/v1/users/getBalance");
      if (response.status === 200) {
        setWalletBalance(response.data.walletBalance);
      }
    } catch (error) {}
  };

  useFocusEffect(() => {
    fetchBalance();
  });

  const glassBg: [string, string] = colorScheme === 'dark'
    ? ['rgba(20,20,20,0.7)', 'rgba(40,40,40,0.4)']
    : ['rgba(255,255,255,0.7)', 'rgba(240,240,240,0.4)'];

  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30],
  });

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopBar />
      <View style={styles.outerContainer}>
        <Animated.View style={{ transform: [{ translateY }], alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <View style={styles.cardContainer}>
            <Image
              source={require('../../assets/images/goldenCreditCard.png')}
              style={styles.cardImage}
              resizeMode="contain"
            />
            <View style={styles.balanceOnCard} pointerEvents="none">
              <Text style={[styles.balanceCardText, { color: '#fff' }]}> 
                {walletBalance !== null ? `${walletBalance}` : '...'}
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  cardContainer: {
    width: 440,
    height: 300,
    alignSelf: 'center',
    justifyContent: 'flex-end',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  balanceOnCard: {
    position: 'absolute',
    left: 32,
    bottom: 24,
    backgroundColor: 'rgba(0,0,0,0.0)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  balanceCardText: {
    fontSize: 44,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    left: 30,
    bottom: 30,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
  },
});


export default MyWallet;
