import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FlatList, StyleSheet, Dimensions, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VideoItem from './VideoItem';
import FloatingPill from './FloatingPill';
import * as FileSystem from 'expo-file-system';

const { height } = Dimensions.get('window');
const LAST_VIDEO_ID_KEY = '@offreel_last_video_id';

export default function VideoFeed({ videos, defaultFit }) {
  const flatListRef = useRef(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [feedHeight, setFeedHeight] = useState(height);
  const [favorites, setFavorites] = useState(new Set());

  // These refs guard the one-time resume scroll.
  // Refs (not state) because they must never trigger re-renders.
  const resumeIndexRef = useRef(-1);   // The target index to scroll to (-1 = not yet resolved)
  const hasScrolledRef = useRef(false); // True once the scroll fires — never fire again
  const videosRef = useRef(videos);     // Stable ref to latest videos for async closures

  // Keep videosRef in sync without triggering effects
  useEffect(() => {
    videosRef.current = videos;
  }, [videos]);

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

  // STEP 1: Resolve the target resume index once (when videos first populate)
  useEffect(() => {
    if (videos.length === 0 || resumeIndexRef.current !== -1) return;

    const resolveResumeTarget = async () => {
      try {
        const savedId = await AsyncStorage.getItem(LAST_VIDEO_ID_KEY);
        if (!savedId) {
          resumeIndexRef.current = 0;
          return;
        }

        const idx = videosRef.current.findIndex(v => v.id === savedId);
        if (idx === -1) {
          resumeIndexRef.current = 0;
          return;
        }

        // Pre-flight: verify file exists
        const fileInfo = await FileSystem.getInfoAsync(videosRef.current[idx].uri);
        if (fileInfo.exists) {
          resumeIndexRef.current = idx;
          setActiveVideoIndex(idx); // Immediately mark conceptually active (before scroll)
        } else {
          // Ghost file: bump to next neighbor
          console.warn('Ghost File Detected. Bumping to adjacent video.');
          await AsyncStorage.removeItem(LAST_VIDEO_ID_KEY);
          const fallback = (idx + 1 < videosRef.current.length) ? idx + 1 : Math.max(0, idx - 1);
          resumeIndexRef.current = fallback;
          setActiveVideoIndex(fallback);
        }
      } catch (e) {
        console.error('Resume resolution failed:', e);
        resumeIndexRef.current = 0;
      }
    };

    resolveResumeTarget();
  }, [videos]);

  // STEP 2: Execute the scroll ONLY after the FlatList is mounted and measured (onLayout)
  const onFeedLayout = useCallback((e) => {
    const measuredHeight = e.nativeEvent.layout.height;
    setFeedHeight(measuredHeight);

    // Attempt scroll only if we haven't done it yet and the target is resolved
    if (!hasScrolledRef.current && resumeIndexRef.current > 0 && flatListRef.current) {
      hasScrolledRef.current = true;
      // Small delay ensures FlatList cells are laid out with the measured height
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: resumeIndexRef.current,
          animated: false,
        });
      }, 80);
    }
  }, []);

  // STEP 3: Save current position to AsyncStorage on scroll
  useEffect(() => {
    const saveCurrentPos = async () => {
      if (videos.length > 0 && videos[activeVideoIndex]) {
        const currentId = videos[activeVideoIndex].id;
        const savedId = await AsyncStorage.getItem(LAST_VIDEO_ID_KEY);
        if (currentId !== savedId) {
          await AsyncStorage.setItem(LAST_VIDEO_ID_KEY, currentId);
        }
      }
    };
    saveCurrentPos().catch(console.error);
  }, [activeVideoIndex, videos]);

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveVideoIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
  }).current;

  const getItemLayout = useCallback((data, index) => ({
    length: feedHeight,
    offset: feedHeight * index,
    index,
  }), [feedHeight]);

  const renderItem = useCallback(({ item, index }) => {
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
  }, [activeVideoIndex, feedHeight, defaultFit, favorites, toggleFavorite]);

  // FlatList renders immediately — no isReady gate — FloatingPill always visible
  return (
    <View style={styles.container} onLayout={onFeedLayout}>
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
        windowSize={2}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={50}
        getItemLayout={getItemLayout}
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
