import { useTheme } from '@/components/contexts/ThemeContext';
import { Colors } from '@/constants/theme';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const HomeScreenSkeleton = () => {
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar Skeleton */}
      <Animated.View
        style={[
          styles.topBar,
          { backgroundColor: skeletonColor, opacity },
        ]}
      />

      {/* Main Card Skeleton */}
      <View style={styles.cardContainer}>
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: skeletonColor, opacity },
          ]}
        >
          {/* Profile Image */}
          <Animated.View
            style={[
              styles.profileImage,
              { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5', opacity },
            ]}
          />

          {/* Name and Bio */}
          <View style={styles.infoContainer}>
            <Animated.View
              style={[
                styles.nameSkeleton,
                { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5', opacity },
              ]}
            />
            <Animated.View
              style={[
                styles.bioSkeleton,
                { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5', opacity },
              ]}
            />
            <Animated.View
              style={[
                styles.bioSkeleton,
                { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5', opacity, width: '70%' },
              ]}
            />
          </View>
        </Animated.View>
      </View>

      {/* Action Buttons Skeleton */}
      <View style={styles.buttonsContainer}>
        <Animated.View
          style={[
            styles.actionButton,
            { backgroundColor: skeletonColor, opacity },
          ]}
        />
        <Animated.View
          style={[
            styles.actionButton,
            { backgroundColor: skeletonColor, opacity },
          ]}
        />
        <Animated.View
          style={[
            styles.actionButton,
            { backgroundColor: skeletonColor, opacity },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  topBar: {
    width: '100%',
    height: 60,
    marginTop: 10,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  card: {
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_HEIGHT * 0.65,
    borderRadius: 20,
    padding: 20,
  },
  profileImage: {
    width: '100%',
    height: '70%',
    borderRadius: 15,
    marginBottom: 20,
  },
  infoContainer: {
    gap: 10,
  },
  nameSkeleton: {
    width: '60%',
    height: 30,
    borderRadius: 6,
  },
  bioSkeleton: {
    width: '100%',
    height: 16,
    borderRadius: 4,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 40,
    paddingBottom: 40,
    gap: 20,
  },
  actionButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
});

export default HomeScreenSkeleton;
