import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useVideos } from '../hooks/useVideos';
import VideoFeed from '../components/VideoFeed';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { videos, loading, error, pickVideos } = useVideos();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={[styles.text, {marginTop: 15, fontSize: 16}]}>Opening Vault...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>Error: {error}</Text>
        <TouchableOpacity style={[styles.button, {marginTop: 20}]} onPress={pickVideos}>
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (videos.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>Your Vault is Empty</Text>
        <Text style={styles.subtext}>Select videos from your device to populate your temporary feed and test the UI.</Text>
        <TouchableOpacity style={styles.button} onPress={pickVideos}>
          <Text style={styles.buttonText}>Select Videos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <VideoFeed videos={videos} />
      
      {/* Title */}
      <SafeAreaView style={styles.header} edges={['top']} pointerEvents="none">
        <Text style={styles.headerText}>OffReel</Text>
      </SafeAreaView>
      
      {/* Add More Button Overlay */}
      <SafeAreaView style={styles.addMoreContainer} edges={['top']}>
        <TouchableOpacity style={styles.addMoreButton} onPress={pickVideos}>
          <Text style={styles.addMoreText}>+</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    position: 'absolute',
    top: 0,
    width: '100%',
    alignItems: 'center',
    paddingTop: 10,
    zIndex: 10,
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
    opacity: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  addMoreContainer: {
    position: 'absolute',
    top: 0,
    right: 20,
    paddingTop: 5,
    zIndex: 11,
  },
  addMoreButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMoreText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '300',
    marginTop: -3,
  },
  text: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtext: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    fontSize: 15,
    marginBottom: 30,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  buttonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  }
});
