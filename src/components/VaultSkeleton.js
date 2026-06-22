import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

/**
 * OffReel Premium Skeleton Loader
 * Uses a gentle pulsing opacity animation for a premium feel.
 */
export default function VaultSkeleton() {
  const pulseValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Infinite pulsing loop: fade in and out gently
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseValue]);

  const opacity = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <View style={styles.container}>
      {/* Dark Base Layer */}
      <View style={styles.base} />

      {/* Pulsing skeleton blocks */}
      <View style={styles.content}>
        <Animated.View style={[styles.skelBlock, { opacity }]} />
        <Animated.View style={[styles.skelBlock, styles.skelBlockMed, { opacity, marginTop: 20 }]} />
        <Animated.View style={[styles.skelBlock, { opacity, marginTop: 20 }]} />
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
  base: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#050505',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  skelBlock: {
    width: '100%',
    height: 60,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  skelBlockMed: {
    width: '75%',
    height: 48,
  },
});
