import React, { useState, useRef, useCallback } from 'react';
import { FlatList, StyleSheet, Dimensions, View } from 'react-native';
import VideoItem from './VideoItem';
import FloatingPill from './FloatingPill';

const { height } = Dimensions.get('window');

export default function VideoFeed({ videos }) {
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [feedHeight, setFeedHeight] = useState(height); // Fallback until measured

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveVideoIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderItem = ({ item, index }) => {
    const isVisible = Math.abs(index - activeVideoIndex) <= 1;

    return (
      <VideoItem 
        asset={item} 
        isActive={index === activeVideoIndex} 
        isVisible={isVisible}
        feedHeight={feedHeight}
      />
    );
  };

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
      />
      
      {videos.length > 0 && <FloatingPill activeAsset={videos[activeVideoIndex]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
