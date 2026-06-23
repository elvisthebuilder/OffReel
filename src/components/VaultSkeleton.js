import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

/**
 * OffReel Premium Skeleton Loader
 * Custom built to perfectly mirror the layout of the VideoFeed and FloatingPill components.
 */
export default function VaultSkeleton() {
  const pulseValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseValue]);

  const opacity = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.container}>
      {/* Background representing the full-screen VideoItem */}
      <View style={styles.videoPlaceholder} />

      {/* Pulsing overlay to give the video area life */}
      <Animated.View style={[styles.pulseOverlay, { opacity }]} />

      {/* Floating Pill Skeleton perfectly aligned with the actual FloatingPill component */}
      <View style={styles.pillContainer}>
        <Animated.View
          style={[
            styles.pill,
            {
              opacity: pulseValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1],
              }),
            },
          ]}>
          {/* Skeleton for Heart Icon */}
          <View style={styles.iconSkeleton} />
          {/* Skeleton for Share Icon */}
          <View style={styles.iconSkeleton} />
          {/* Skeleton for Options Icon */}
          <View style={styles.iconSkeleton} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  videoPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#050505',
  },
  pulseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  pillContainer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 30, // mimics the gap between icons in FloatingPill
    height: 50, // rough height of the actual pill
  },
  iconSkeleton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});
