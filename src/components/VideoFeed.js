import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FlatList, StyleSheet, Dimensions, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VideoItem from './VideoItem';
import FloatingPill from './FloatingPill';
import * as FileSystem from 'expo-file-system';

const { height } = Dimensions.get('window');
const LAST_VIDEO_ID_KEY = '@offreel_last_video_id';

export default function VideoFeed({ videos, defaultFit, initialVideoId }) {
  const flatListRef = useRef(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [feedHeight, setFeedHeight] = useState(height);
  const [favorites, setFavorites] = useState(new Set());
  const [isScrolledToInitial, setIsScrolledToInitial] = useState(false);

  // Guard refs to prevent re-triggering during background updates
  const hasAttemptedInitialScroll = useRef(false);
  const isLayoutReady = useRef(false);

  const toggleFavorite = useCallback((assetId) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(assetId)) next.delete(assetId);
      else next.add(assetId);
      return next;
    });
  }, []);

  // MASTER SCROLLER: Triggered whenever videos, height, or the target ID changes
  useEffect(() => {
    const triggerInitialScroll = async () => {
      // Requirements for a successful scroll:
      if (!flatListRef.current) return;
      if (!isLayoutReady.current) return;
      if (hasAttemptedInitialScroll.current) return;
      if (videos.length === 0) return;
      if (!initialVideoId) {
        hasAttemptedInitialScroll.current = true;
        setIsScrolledToInitial(true);
        return;
      }

      const targetIndex = videos.findIndex(v => v.id === initialVideoId);
      if (targetIndex === -1) {
        hasAttemptedInitialScroll.current = true;
        setIsScrolledToInitial(true);
        return;
      }

      // Mark as done immediately to prevent re-entry
      hasAttemptedInitialScroll.current = true;

      // Verify the file still exists physically on disk
      try {
        const fileInfo = await FileSystem.getInfoAsync(videos[targetIndex].uri);
        const finalIndex = fileInfo.exists ? targetIndex : 0;
        
        // konceptually setActive first so the FloatingPill shows the right content
        setActiveVideoIndex(finalIndex);

        // Execute the physical snap
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: finalIndex,
            animated: false,
          });
          setIsScrolledToInitial(true);
        }, 50); // Minimal shift delay for FlatList internal layout stability

      } catch (e) {
        console.warn("Resume scan check failed, defaulting to 0:", e);
        setIsScrolledToInitial(true);
      }
    };

    triggerInitialScroll();
  }, [videos, initialVideoId]);

  const onFeedLayout = useCallback((e) => {
    isLayoutReady.current = true;
    const measuredHeight = e.nativeEvent.layout.height;
    setFeedHeight(measuredHeight);
  }, []);

  // TRACK POSITION: Save current video ID to storage as user scrolls
  useEffect(() => {
    const saveCurrentPos = async () => {
      // Only start saving AFTER we have successfully resumed our old position
      if (isScrolledToInitial && videos.length > 0 && videos[activeVideoIndex]) {
        const currentId = videos[activeVideoIndex].id;
        await AsyncStorage.setItem(LAST_VIDEO_ID_KEY, currentId);
      }
    };
    saveCurrentPos().catch(console.error);
  }, [activeVideoIndex, isScrolledToInitial, videos]);

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

      {videos.length > 0 && isScrolledToInitial && (
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
