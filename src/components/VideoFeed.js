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
  
  // States to coordinate the resume scroll
  const [layoutMeasured, setLayoutMeasured] = useState(false);
  const [isScrolledToInitial, setIsScrolledToInitial] = useState(false);
  const hasAttemptedInitialScroll = useRef(false);

  const toggleFavorite = useCallback((assetId) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(assetId)) next.delete(assetId);
      else next.add(assetId);
      return next;
    });
  }, []);

  // SCROLL ENGINE: Listens for both layout measurement AND video data
  useEffect(() => {
    if (!layoutMeasured || videos.length === 0 || hasAttemptedInitialScroll.current) return;

    const performResume = async () => {
      hasAttemptedInitialScroll.current = true; // Lock immediately

      if (!initialVideoId) {
        setIsScrolledToInitial(true);
        return;
      }

      const targetIndex = videos.findIndex(v => v.id === initialVideoId);
      if (targetIndex <= 0) { // 0 is default anyway
        setIsScrolledToInitial(true);
        return;
      }

      try {
        // Double-check file existence
        const fileInfo = await FileSystem.getInfoAsync(videos[targetIndex].uri);
        const finalIndex = fileInfo.exists ? targetIndex : 0;
        
        setActiveVideoIndex(finalIndex);

        // Snap the list to the index
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: finalIndex,
            animated: false,
          });
          // Small delay before allowing position saving to prevent index-0 overwrite
          setTimeout(() => setIsScrolledToInitial(true), 100);
        }, 32); 
      } catch (e) {
        setIsScrolledToInitial(true);
      }
    };

    performResume();
  }, [layoutMeasured, videos, initialVideoId]);

  const onFeedLayout = useCallback((e) => {
    const measuredHeight = e.nativeEvent.layout.height;
    setFeedHeight(measuredHeight);
    setLayoutMeasured(true);
  }, []);

  // SAVE POSITION: Only writes to storage AFTER the initial resume is complete
  useEffect(() => {
    if (!isScrolledToInitial) return;

    const saveCurrentPos = async () => {
      if (videos[activeVideoIndex]) {
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

      {/* Dock (FloatingPill) now visible immediately for better UX */}
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
