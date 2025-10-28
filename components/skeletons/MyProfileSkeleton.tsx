import { useTheme } from '@/components/contexts/ThemeContext';
import { Colors } from '@/constants/theme';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, View } from 'react-native';

const MyProfileSkeleton = () => {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const shimmerAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(0)).current;

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

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 0,
          duration: 1200,
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

  const scale = pulseAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.0],
  });

  const skeletonColor = colorScheme === 'dark' ? '#2a2a2a' : '#e0e0e0';
  const cardColor = colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5';

  const CircularStatSkeleton = ({ delay = 0 }: { delay?: number }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        delay,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View
        style={[styles.circularStat, { opacity: fadeAnim, transform: [{ scale }] }]}
      >
        <Animated.View
          style={[
            styles.circle,
            { backgroundColor: skeletonColor, opacity },
          ]}
        />
        <Animated.View
          style={[
            styles.statLabel,
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

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Animated.View
            style={[
              styles.profileImage,
              { backgroundColor: skeletonColor, opacity, transform: [{ scale }] },
            ]}
          />
          <Animated.View
            style={[
              styles.nameText,
              { backgroundColor: skeletonColor, opacity },
            ]}
          />
          <Animated.View
            style={[
              styles.bioText,
              { backgroundColor: skeletonColor, opacity },
            ]}
          />
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Animated.View
            style={[
              styles.sectionTitle,
              { backgroundColor: skeletonColor, opacity },
            ]}
          />
          <View style={styles.statsGrid}>
            <CircularStatSkeleton delay={0} />
            <CircularStatSkeleton delay={100} />
            <CircularStatSkeleton delay={200} />
          </View>
        </View>

        {/* Info Cards */}
        <View style={styles.infoSection}>
          {[0, 1, 2, 3].map((index) => (
            <Animated.View
              key={index}
              style={[
                styles.infoCard,
                {
                  backgroundColor: cardColor,
                  opacity,
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.infoIcon,
                  { backgroundColor: skeletonColor, opacity },
                ]}
              />
              <View style={styles.infoContent}>
                <Animated.View
                  style={[
                    styles.infoTitle,
                    { backgroundColor: skeletonColor, opacity },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.infoValue,
                    { backgroundColor: skeletonColor, opacity },
                  ]}
                />
              </View>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
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
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  nameText: {
    width: 150,
    height: 28,
    borderRadius: 6,
    marginTop: 8,
  },
  bioText: {
    width: 200,
    height: 16,
    borderRadius: 4,
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    width: 100,
    height: 24,
    borderRadius: 6,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 16,
  },
  circularStat: {
    alignItems: 'center',
    gap: 8,
  },
  circle: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  statLabel: {
    width: 80,
    height: 16,
    borderRadius: 4,
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  infoContent: {
    flex: 1,
    gap: 8,
  },
  infoTitle: {
    width: '40%',
    height: 16,
    borderRadius: 4,
  },
  infoValue: {
    width: '60%',
    height: 20,
    borderRadius: 4,
  },
});

export default MyProfileSkeleton;
