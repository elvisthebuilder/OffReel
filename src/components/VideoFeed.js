import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FlatList, StyleSheet, Dimensions, View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VideoItem from './VideoItem';
import FloatingPill from './FloatingPill';

const { height } = Dimensions.get('window');
const LAST_VIDEO_ID_KEY = '@offreel_last_video_id';

export default function VideoFeed({ videos, defaultFit }) {
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
            setActiveVideoIndex(calculatedIndex);
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
  }, [videos]); // Bind firmly to physical array structural shifts

  // Safely index currently viewing Video ID
  useEffect(() => {
    if (isReady && videos.length > 0 && videos[activeVideoIndex]) {
      AsyncStorage.setItem(LAST_VIDEO_ID_KEY, videos[activeVideoIndex].id).catch(console.error);
    }
  }, [activeVideoIndex, isReady, videos]);

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveVideoIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
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
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <View 
      style={styles.container} 
      onLayout={(e) => setFeedHeight(e.nativeEvent.layout.height)}
    >
      <FlatList
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
        windowSize={3}
        removeClippedSubviews={true}
        getItemLayout={getItemLayout}
        initialScrollIndex={activeVideoIndex} // Dynamically scales to mathematically perfect matching state automatically
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
