import { useTheme } from "@/components/contexts/ThemeContext";
import TopBar from "@/components/resuables/TopBar";
import { api } from "@/components/utils/api";
import { Colors } from "@/constants/theme";
import { useFocusEffect } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MyWallet = () => {
  const [walletBalance, setWalletBalance] = useState<any>(null);
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  const mockBuyData = [
    { cardNumber: 1, info: 'Buy $10 Credits', amount: 10 },
    { cardNumber: 2, info: 'Buy $20 Credits', amount: 20 },
    { cardNumber: 3, info: 'Buy $30 Credits', amount: 30 },
  ];

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const [activeIndex, setActiveIndex] = useState(0);

  const onScroll = (event: { nativeEvent: { contentOffset: { x: number; }; }; }) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    setActiveIndex(index);
  };

  const fetchBalance = async () => {
    try {
      const response = await api.get("/api/v1/users/getBalance");
      // Now expects walletBalance from stats, not user
      if (response.status === 200) {
        setWalletBalance(response.data.walletBalance);
      }
    } catch (error) {
      setWalletBalance(0); // fallback if error
    }
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar />
      <View style={styles.centeredContainer}>
        <Animated.View style={{ transform: [{ translateY }], alignItems: 'center', justifyContent: 'center', width: '100%', position: 'absolute', top: screenHeight * 0.06, left: 0, right: 0, zIndex: 2 }}>
          <View style={[styles.cardContainer, { width: Math.min(screenWidth * 1.18, 800), height: Math.min(screenHeight * 0.54, 520) }]}> 
            <Image
              source={require('../../assets/images/goldenCreditCard.png')}
              style={styles.cardImage}
              resizeMode="contain"
            />
            <View style={styles.balanceOnCard} pointerEvents="none">
              <Text style={[styles.balanceCardText, { color: '#d1a73cff' }]}> 
                {walletBalance !== null ? `${walletBalance}` : '0'}
              </Text>
            </View>
          </View>
        </Animated.View>
        <View style={[styles.buySection, { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1, marginBottom: 18 }]}> 
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{ alignItems: 'flex-end' }}
            snapToAlignment="center"
            style={styles.cardSwiper}
          >
            {mockBuyData.map((item, idx) => (
              <View key={item.cardNumber} style={[styles.optionCard, { width: Math.min(screenWidth * 0.82, 340) }]}> 
                <Text style={styles.optionCardTitle}>{item.info}</Text>
                <Text style={styles.optionCardAmount}>${item.amount}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={styles.paginationContainer}>
            {mockBuyData.map((_, idx) => (
              <View
                key={idx}
                style={[styles.paginationDot, activeIndex === idx && styles.paginationDotActive]}
              />
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  cardContainer: {
    alignSelf: 'center',
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 32,
    elevation: 24,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  balanceOnCard: {
    position: 'absolute',
    left: '15%',
    bottom: '28%',
    backgroundColor: 'rgba(0,0,0,0.0)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    zIndex: 10,
  },
  balanceCardText: {
    fontSize: 44,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    color: '#ffbf00ff',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  buySection: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  cardSwiper: {
    flexGrow: 0,
  },
  optionCard: {
    backgroundColor: '#222',
    borderRadius: 18,
    marginHorizontal: 30,
    marginVertical: 12,
    padding: 22,
    justifyContent: 'center',
    alignItems: 'center',
    height: 240,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  optionCardTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  optionCardAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffd700',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#888',
    marginHorizontal: 5,
    opacity: 0.4,
  },
  paginationDotActive: {
    backgroundColor: '#ffd700',
    opacity: 1,
  },
});


export default MyWallet;
