import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Pressable, Text, TouchableOpacity, Animated } from 'react-native';
import AlbumChips from './AlbumChips';

function ActiveVideoItem({ asset, isActive, defaultFit, isLiked, onDoubleTapLike, onReady, onAlbumSelect, selectedAlbumId }) {
  const [contentFit, setContentFit] = useState(defaultFit);
  const [isPausedByUser, setIsPausedByUser] = useState(false);
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoOpacity = useRef(new Animated.Value(0)).current;
  const progressInterval = useRef(null);

  const player = useVideoPlayer(asset.uri, (p) => {
    p.loop = true;
    p.play();

    // Turbo Buffer: Minimize start-up latency for raw files
    p.bufferOptions = {
      preferredForwardBufferDuration: 1, // Look ahead only 1s
      minBufferForPlayback: 0.5, // Start after only 0.5s of data
      prioritizeTimeOverSizeThreshold: true, // Prioritize start speed
    };

    // Add listener to detect when hardware decoder is 100% ready to render
    const subscription = p.addListener('statusChange', (payload) => {
      if (payload.status === 'readyToPlay') {
        // DISSOLVE IN: Fade the video layer in over the thumbnail for instant feel
        Animated.timing(videoOpacity, {
          toValue: 1,
          duration: 150, // Ultra-fast snap
          useNativeDriver: true,
        }).start();
        onReady?.();
      }
      if (payload.status === 'readyToPlay' || payload.status === 'playing') {
        setDuration(p.duration || 0);
      }
    });

    return () => subscription.remove();
  });
  const [heartPos, setHeartPos] = useState({ x: 0, y: 0 });

  // Animated values for the double-tap heart burst
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;
  const lastTap = useRef(null);
  const longPressTimer = useRef(null);
  const DOUBLE_TAP_DELAY = 300;
  const LONG_PRESS_DURATION = 500;

  useEffect(() => {
    if (isActive && !isPausedByUser) {
      progressInterval.current = setInterval(() => {
        if (player) {
          setCurrentTime(player.currentTime || 0);
        }
      }, 100);
      return () => {
        if (progressInterval.current) clearInterval(progressInterval.current);
      };
    }
  }, [isActive, isPausedByUser, player]);

  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);

  const handlePressIn = () => {
    longPressTimer.current = setTimeout(() => {
      setIsFullscreenMode(true);
      player.pause();
      setIsPausedByUser(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, LONG_PRESS_DURATION);
  };

  const handlePressOut = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

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
    setContentFit((prev) => (prev === 'cover' ? 'contain' : 'cover'));
  };

  return (
    <View style={styles.videoContainer}>
      {isFullscreenMode ? (
        // Fullscreen clean mode (Instagram Reels style)
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setIsFullscreenMode(false)}
          onLongPress={handlePressIn}
          onPressOut={handlePressOut}>
          <Animated.View style={[styles.video, { opacity: videoOpacity }]}>
            <VideoView
              style={styles.video}
              player={player}
              showsControls={false}
              nativeControls={false}
              contentFit={contentFit}
            />
          </Animated.View>
          <Text style={styles.fullscreenExitHint}>Tap to exit fullscreen</Text>
        </Pressable>
      ) : (
        <>
          <Animated.View style={[styles.video, { opacity: videoOpacity }]}>
            <VideoView
              style={styles.video}
              player={player}
              showsControls={false}
              nativeControls={false}
              contentFit={contentFit}
            />
          </Animated.View>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }]} />
          </View>

          {/* Full-screen tap handler — single = pause, double = like, long press = fullscreen */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleTap}
            onLongPress={handlePressIn}
            onPressOut={handlePressOut}>
            {isPausedByUser && isActive && (
              <View style={styles.pauseOverlay}>
                <Text style={styles.playIcon}>▶</Text>
                <TouchableOpacity style={styles.fitToggle} onPress={toggleFit} activeOpacity={0.7}>
                  <Ionicons
                    name={contentFit === 'cover' ? 'scan-outline' : 'expand-outline'}
                    size={18}
                    color="#fff"
                  />
                </TouchableOpacity>

                {/* Album filter chips appear at the top when paused */}
                <AlbumChips selectedAlbumId={selectedAlbumId} onSelect={onAlbumSelect} />
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
            ]}>
            <Ionicons name="heart" size={90} color="#ff2b54" />
          </Animated.View>
        </>
      )}
    </View>
  );
}

function VideoThumbnail({ asset, contentFit, opacity = 1, pointerEvents = 'auto' }) {
  return (
    <Animated.View
      pointerEvents={pointerEvents}
      style={[
        styles.thumbnailContainer,
        { opacity, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 },
      ]}>
      {/* 
          Using the video URI as an Image source is a high-performance 
          way to show the first frame/poster without starting the decoder.
      */}
      <Animated.Image
        source={{ uri: asset.uri }}
        style={[styles.video]}
        resizeMode={contentFit === 'cover' ? 'cover' : 'contain'}
      />
      <View style={styles.thumbnailOverlay} />
    </Animated.View>
  );
}

export default function VideoItem({
  asset,
  isActive,
  isVisible,
  feedHeight,
  defaultFit,
  isLiked,
  onDoubleTapLike,
  onAlbumSelect,
  selectedAlbumId,
}) {
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const posterOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isPlayerReady) {
      // Hardware is ready — Melt the thumbnail away as the video emerges
      Animated.timing(posterOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      posterOpacity.setValue(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlayerReady]); // posterOpacity is a stable Animated ref

  return (
    <View style={[styles.container, { height: feedHeight }]}>
      {/* 
          STRICT STABILITY FIX:
          We ONLY mount ActiveVideoItem (and its player) if 'isActive' is true.
          This guarantees exactly ONE hardware decoder is active at any time.
      */}
      {isActive ? (
        <View style={styles.videoContainer}>
          {/* The Thumbnail base layer */}
          <VideoThumbnail
            asset={asset}
            contentFit={defaultFit}
            opacity={posterOpacity}
            pointerEvents="none"
          />
          {/* The Player layer */}
          <ActiveVideoItem
            asset={asset}
            isActive={isActive}
            defaultFit={defaultFit}
            isLiked={isLiked}
            onDoubleTapLike={onDoubleTapLike}
            onReady={() => setIsPlayerReady(true)}
            onAlbumSelect={onAlbumSelect}
            selectedAlbumId={selectedAlbumId}
          />
        </View>
      ) : isVisible ? (
        <VideoThumbnail asset={asset} contentFit={defaultFit} />
      ) : (
        <View style={styles.placeholder}>
          {/* Use a card skeleton while offscreen for visual stability */}
          <View style={styles.skelCard} />
        </View>
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
  thumbnailContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
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
    justifyContent: 'center',
  },
  skelCard: {
    width: '90%',
    height: '60%',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
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
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
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
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    zIndex: 150,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#ff3b30',
  },
  fullscreenExitHint: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
});
