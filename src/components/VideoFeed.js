import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FlatList, StyleSheet, Dimensions, View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VideoItem from './VideoItem';
import FloatingPill from './FloatingPill';
import VaultSkeleton from './VaultSkeleton';
import * as FileSystem from 'expo-file-system';

const { height } = Dimensions.get('window');
const LAST_VIDEO_ID_KEY = '@offreel_last_video_id';

export default function VideoFeed({ videos, defaultFit }) {
  const flatListRef = useRef(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [feedHeight, setFeedHeight] = useState(height);
  const [isReady, setIsReady] = useState(false);
  const [favorites, setFavorites] = useState(new Set());

  const toggleFavorite = useCallback((assetId) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(assetId)) {
        next.delete(assetId);
      } else {
        next.add(assetId);
      }
      return next;
    });
  }, []);

  // Load physical ID dynamically against shifting indexes natively
  useEffect(() => {
    const loadSavedVideo = async () => {
      try {
        const savedVideoId = await AsyncStorage.getItem(LAST_VIDEO_ID_KEY);
        if (savedVideoId !== null) {
          // Mathematically derive exact array index placement if array sequence changed natively
          const calculatedIndex = videos.findIndex(v => v.id === savedVideoId);
          if (calculatedIndex > -1) {
            
            // ULTRA-FAST PRE-FLIGHT CHECK: Verify the physical file still exists on the device (takes ~2ms)
            const videoUri = videos[calculatedIndex].uri;
            const fileInfo = await FileSystem.getInfoAsync(videoUri);
            
            if (fileInfo.exists) {
              setActiveVideoIndex(calculatedIndex);
              
              // PRECISE SCROLL: Wait for layout to be measured then snap to exact target
              if (feedHeight > 0 && flatListRef.current) {
                setTimeout(() => {
                  flatListRef.current?.scrollToIndex({
                    index: calculatedIndex,
                    animated: false
                  });
                }, 100);
              }
            } else {
               // The file was deleted while the app was closed. Fall back safely.
               console.warn("Ghost File Detected: Last viewed video was deleted natively.");
               await AsyncStorage.removeItem(LAST_VIDEO_ID_KEY);
            }
          }
        }
      } catch (e) {
        console.error("Failed to load last ID securely", e);
      } finally {
        setIsReady(true);
      }
    };
    
    if (videos.length > 0) {
      loadSavedVideo();
    } else {
      setIsReady(true);
    }
  }, [videos, feedHeight]); // Re-run if layout changes to ensure math is perfect

  // Safely index currently viewing Video ID — STRICT REPLACEMENT ONLY
  useEffect(() => {
    const saveCurrentPos = async () => {
        if (isReady && videos.length > 0 && videos[activeVideoIndex]) {
            const currentId = videos[activeVideoIndex].id;
            const savedId = await AsyncStorage.getItem(LAST_VIDEO_ID_KEY);
            
            // Only write to disk if the ID has actually changed (saves battery/wear)
            if (currentId !== savedId) {
                await AsyncStorage.setItem(LAST_VIDEO_ID_KEY, currentId);
            }
        }
    };
    saveCurrentPos().catch(console.error);
  }, [activeVideoIndex, isReady, videos]);

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveVideoIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80, // Tighten threshold to ensure strictly focused player triggering
  }).current;

  const getItemLayout = (data, index) => ({
    length: feedHeight,
    offset: feedHeight * index,
    index,
  });

  const renderItem = ({ item, index }) => {
    const isVisible = Math.abs(index - activeVideoIndex) <= 1;

    return (
      <VideoItem
        asset={item}
        isActive={index === activeVideoIndex}
        isVisible={isVisible}
        feedHeight={feedHeight}
        defaultFit={defaultFit}
        isLiked={favorites.has(item.id)}
        onDoubleTapLike={() => toggleFavorite(item.id)}
      />
    );
  };

  if (!isReady) {
    return (
      <View style={styles.container}>
        <VaultSkeleton />
      </View>
    );
  }

  return (
    <View 
      style={styles.container} 
      onLayout={(e) => setFeedHeight(e.nativeEvent.layout.height)}
    >
      <FlatList
        ref={flatListRef}
        data={videos}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={feedHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        windowSize={2} // Reduced to current + 1 neighbor to minimize memory pressure
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={50} // Hardened throttle to prevent decoder contention
        getItemLayout={getItemLayout}
        // Removing initialScrollIndex in favor of the more reliable Precise Scroll Engine
      />
      
      {videos.length > 0 && (
        <FloatingPill
          activeAsset={videos[activeVideoIndex]}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
