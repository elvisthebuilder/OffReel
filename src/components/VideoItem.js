import { useEffect, useState } from 'react';
import { StyleSheet, View, Dimensions, Pressable, Text, TouchableOpacity } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';

const { height, width } = Dimensions.get('window');

function ActiveVideoItem({ asset, isActive }) {
  const [isPausedByUser, setIsPausedByUser] = useState(false);
  const [contentFit, setContentFit] = useState("cover");

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
      player.currentTime = 0; // Reset
      setIsPausedByUser(false); // Reset user pause state when swiped away
    }
  }, [isActive, isPausedByUser, player]);

  const togglePause = () => {
    if (player.playing) {
      player.pause();
      setIsPausedByUser(true);
    } else {
      player.play();
      setIsPausedByUser(false);
    }
  };

  const toggleFit = (e) => {
    // Prevent the press from bubbling up to the Pressable and unpausing the video
    e.stopPropagation();
    setContentFit(prev => prev === "cover" ? "contain" : "cover");
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
      
      {/* Massive invisible button overlaying the entire screen perfectly */}
      <Pressable style={StyleSheet.absoluteFill} onPress={togglePause}>
        {isPausedByUser && isActive && (
          <View style={styles.pauseOverlay}>
            <Text style={styles.playIcon}>▶</Text>
            
            <TouchableOpacity 
              style={styles.fitToggle} 
              onPress={toggleFit} 
              activeOpacity={0.7}
            >
              <Ionicons 
                name={contentFit === "cover" ? "scan-outline" : "expand-outline"} 
                size={18} 
                color="#fff" 
              />
            </TouchableOpacity>
          </View>
        )}
      </Pressable>
    </View>
  );
}

export default function VideoItem({ asset, isActive, isVisible, feedHeight }) {
  return (
    <View style={[styles.container, { height: feedHeight }]}>
      {isVisible ? (
        <ActiveVideoItem asset={asset} isActive={isActive} />
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
  }
});
