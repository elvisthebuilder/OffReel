import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { FlatList, StyleSheet, Dimensions, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VideoItem from './VideoItem';
import FloatingPill from './FloatingPill';

const { height } = Dimensions.get('window');
const LAST_VIDEO_ID_KEY = '@offreel_last_video_id';

export default function VideoFeed({ videos, defaultFit, initialVideoId }) {
  const flatListRef = useRef(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [feedHeight, setFeedHeight] = useState(height);
  const [favorites, setFavorites] = useState(new Set());
  
  // Track if we've stabilized at our starting position
  const [isReadyForSaving, setIsReadyForSaving] = useState(false);

  // PRE-CALCULATE STARTING INDEX: This is the most robust way to resume.
  // We determine the index BEFORE the FlatList mounts.
  const startingIndex = useMemo(() => {
    if (!initialVideoId || videos.length === 0) return 0;
    const idx = videos.findIndex(v => v.id === initialVideoId);
    return idx >= 0 ? idx : 0;
  }, [videos, initialVideoId]);

  // Synchronize the active index state with our calculated starting index on mount
  useEffect(() => {
    if (activeVideoIndex === 0 && startingIndex > 0) {
      setActiveVideoIndex(startingIndex);
    }
    
    // Give the UI a moment to breathe before we start recording new positions
    const timer = setTimeout(() => {
      setIsReadyForSaving(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, [startingIndex]);

  const toggleFavorite = useCallback((assetId) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(assetId)) next.delete(assetId);
      else next.add(assetId);
      return next;
    });
  }, []);

  // SAVE POSITION: Only trigger after the initial resume window is closed
  useEffect(() => {
    if (!isReadyForSaving) return;

    const saveCurrentPos = async () => {
      if (videos[activeVideoIndex]) {
        const currentId = videos[activeVideoIndex].id;
        await AsyncStorage.setItem(LAST_VIDEO_ID_KEY, currentId);
      }
    };
    saveCurrentPos().catch(console.error);
  }, [activeVideoIndex, isReadyForSaving, videos]);

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

  const onFeedLayout = useCallback((e) => {
    const measuredHeight = e.nativeEvent.layout.height;
    if (measuredHeight > 0) {
      setFeedHeight(measuredHeight);
    }
  }, []);

  // Return null or skeleton if we have no videos yet
  if (videos.length === 0) return null;

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
        
        // NATIVE RESUME: This is the secret sauce. 
        // It skips the 'Index 0' flash and starts exactly where we need to be.
        initialScrollIndex={startingIndex}
        onScrollToIndexFailed={info => {
            // Fallback if the list isn't ready for this index yet
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
            }, 100);
        }}
      />

      <FloatingPill
        activeAsset={videos[activeVideoIndex]}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
