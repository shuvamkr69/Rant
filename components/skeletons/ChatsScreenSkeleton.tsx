import { useTheme } from '@/components/contexts/ThemeContext';
import { Colors } from '@/constants/theme';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

const ChatsScreenSkeleton = () => {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const skeletonColor = colorScheme === 'dark' ? '#2a2a2a' : '#e0e0e0';
  const cardColor = colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5';

  const ChatItemSkeleton = ({ delay = 0 }: { delay?: number }) => {
    const slideAnim = useRef(new Animated.Value(-20)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          delay,
          useNativeDriver: true,
          speed: 14,
          bounciness: 8,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          delay,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    return (
      <Animated.View
        style={[
          styles.chatItem,
          {
            backgroundColor: cardColor,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Avatar */}
        <Animated.View
          style={[
            styles.avatar,
            { backgroundColor: skeletonColor, opacity },
          ]}
        />

        {/* Chat Info */}
        <View style={styles.chatInfo}>
          <Animated.View
            style={[
              styles.nameBar,
              { backgroundColor: skeletonColor, opacity },
            ]}
          />
          <Animated.View
            style={[
              styles.messageBar,
              { backgroundColor: skeletonColor, opacity },
            ]}
          />
        </View>

        {/* Time/Badge */}
        <Animated.View
          style={[
            styles.timeBadge,
            { backgroundColor: skeletonColor, opacity },
          ]}
        />
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar Skeleton */}
      <Animated.View
        style={[
          styles.topBar,
          { backgroundColor: skeletonColor, opacity },
        ]}
      />

      {/* Header Text */}
      <View style={styles.header}>
        <Animated.View
          style={[
            styles.headerText,
            { backgroundColor: skeletonColor, opacity },
          ]}
        />
      </View>

      {/* Chat Items */}
      <View style={styles.chatsList}>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <ChatItemSkeleton key={index} delay={index * 80} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    width: '100%',
    height: 60,
    marginTop: 10,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerText: {
    width: 80,
    height: 28,
    borderRadius: 6,
  },
  chatsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  chatInfo: {
    flex: 1,
    gap: 8,
  },
  nameBar: {
    width: '60%',
    height: 18,
    borderRadius: 4,
  },
  messageBar: {
    width: '80%',
    height: 14,
    borderRadius: 4,
  },
  timeBadge: {
    width: 40,
    height: 16,
    borderRadius: 4,
  },
});

export default ChatsScreenSkeleton;
