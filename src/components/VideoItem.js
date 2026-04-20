import { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Dimensions, Pressable, Text, TouchableOpacity, Animated } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { height, width } = Dimensions.get('window');

function ActiveVideoItem({ asset, isActive, defaultFit, isLiked, onDoubleTapLike }) {
  const [isPausedByUser, setIsPausedByUser] = useState(false);
  const [contentFit, setContentFit] = useState(defaultFit);
  const [heartPos, setHeartPos] = useState({ x: 0, y: 0 });

  // Animated values for the double-tap heart burst
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;
  const lastTap = useRef(null);
  const DOUBLE_TAP_DELAY = 300;

  useEffect(() => {
    setContentFit(defaultFit);
  }, [defaultFit]);

  const player = useVideoPlayer(asset.uri, player => {
    player.loop = true;
    player.muted = false;
  });

  useEffect(() => {
    if (isActive) {
      if (!isPausedByUser) {
        player.play();
      }
    } else {
      player.pause();
      player.currentTime = 0;
      setIsPausedByUser(false);
    }
  }, [isActive, isPausedByUser, player]);

  const burstHeart = (x, y) => {
    setHeartPos({ x, y });
    heartScale.setValue(0);
    heartOpacity.setValue(1);
    Animated.parallel([
      Animated.spring(heartScale, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(heartOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const handleTap = (e) => {
    const now = Date.now();
    const { locationX, locationY } = e.nativeEvent;

    if (lastTap.current && now - lastTap.current < DOUBLE_TAP_DELAY) {
      // Double tap — like it!
      lastTap.current = null;
      onDoubleTapLike(); // Lifts state up to VideoFeed → FloatingPill
      burstHeart(locationX, locationY);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      // Single tap — pause/play (with small delay to wait for potential second tap)
      lastTap.current = now;
      setTimeout(() => {
        if (lastTap.current === now) {
          // No second tap came — treat as single tap
          if (player.playing) {
            player.pause();
            setIsPausedByUser(true);
          } else {
            player.play();
            setIsPausedByUser(false);
          }
        }
      }, DOUBLE_TAP_DELAY);
    }
  };

  const toggleFit = (e) => {
    e.stopPropagation();
    setContentFit(prev => prev === 'cover' ? 'contain' : 'cover');
  };

  return (
    <View style={styles.videoContainer}>
      <VideoView
        style={styles.video}
        player={player}
        showsControls={false}
        nativeControls={false}
        contentFit={contentFit}
      />

      {/* Full-screen tap handler — single = pause, double = like */}
      <Pressable style={StyleSheet.absoluteFill} onPress={handleTap}>
        {isPausedByUser && isActive && (
          <View style={styles.pauseOverlay}>
            <Text style={styles.playIcon}>▶</Text>
            <TouchableOpacity
              style={styles.fitToggle}
              onPress={toggleFit}
              activeOpacity={0.7}
            >
              <Ionicons
                name={contentFit === 'cover' ? 'scan-outline' : 'expand-outline'}
                size={18}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
        )}
      </Pressable>

      {/* Floating heart burst on double-tap */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.heartBurst,
          {
            left: heartPos.x - 45,
            top: heartPos.y - 45,
            opacity: heartOpacity,
            transform: [{ scale: heartScale }],
          },
        ]}
      >
        <Ionicons name="heart" size={90} color="#ff2b54" />
      </Animated.View>
    </View>
  );
}

export default function VideoItem({ asset, isActive, isVisible, feedHeight, defaultFit, isLiked, onDoubleTapLike }) {
  return (
    <View style={[styles.container, { height: feedHeight }]}>
      {isVisible ? (
        <ActiveVideoItem
          asset={asset}
          isActive={isActive}
          defaultFit={defaultFit}
          isLiked={isLiked}
          onDoubleTapLike={onDoubleTapLike}
        />
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#050505',
    alignItems: 'center',
    justifyContent: 'center'
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  playIcon: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 70,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 10
  },
  fitToggle: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 100,
  },
  heartBurst: {
    position: 'absolute',
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    pointerEvents: 'none',
  },
  likedBadge: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
