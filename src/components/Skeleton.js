import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// Shared pulsing animation hook
function usePulseAnimation() {
  const pulseValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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

  return pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });
}

export function ChipSkeleton() {
  const opacity = usePulseAnimation();
  return <Animated.View style={[styles.chip, { opacity }]} />;
}

export function CardSkeleton({ widthPct = 0.9, height = 80 }) {
  const opacity = usePulseAnimation();
  return <Animated.View style={[styles.card, { width: width * widthPct, height, opacity }]} />;
}

export function LineSkeleton({ widthPct = 0.6, height = 12 }) {
  const opacity = usePulseAnimation();
  return <Animated.View style={[styles.line, { width: width * widthPct, height, opacity }]} />;
}

const styles = StyleSheet.create({
  chip: {
    width: 80,
    height: 28,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginRight: 8,
  },
  card: {
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: 12,
  },
  line: {
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: 6,
  },
});
