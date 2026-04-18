import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useVideos } from '../hooks/useVideos';
import VideoFeed from '../components/VideoFeed';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const { videos, loading, error, appMode, pickVideos, autoScanGallery, resetVault } = useVideos();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={[styles.text, {marginTop: 15, fontSize: 16}]}>Synchronizing Vault...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>System Notice</Text>
        <Text style={styles.subtext}>{error}</Text>
        <TouchableOpacity style={[styles.buttonMain, {marginTop: 10}]} onPress={pickVideos}>
          <Text style={styles.buttonMainText}>Select Manually</Text>
        </TouchableOpacity>
        
        {/* Failsafe to break out of error loops into raw mode securely */}
        <TouchableOpacity style={[styles.buttonOutline, {marginTop: 10, borderWidth: 0}]} onPress={resetVault}>
          <Text style={[styles.buttonOutlineText, {color: 'rgba(255,255,255,0.4)', fontSize: 14}]}>Reset Mode</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Raw routing page safely awaiting routing protocol instructions natively
  if (appMode === null || (appMode === 'manual' && videos.length === 0)) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>Your Vault is Empty</Text>
        <Text style={styles.subtext}>Choose how you want to natively sync your local gallery to OffReel.</Text>
        
        <TouchableOpacity style={styles.buttonMain} onPress={autoScanGallery}>
          <Text style={styles.buttonMainText}>Live Auto-Sync OS Gallery</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.buttonOutline} onPress={pickVideos}>
          <Text style={styles.buttonOutlineText}>Custom Select Manually</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Active Feed Layering
  return (
    <View style={styles.container}>
      <VideoFeed videos={videos} />
      
      <SafeAreaView style={styles.header} edges={['top']} pointerEvents="none">
        <Text style={styles.headerText}>OffReel</Text>
      </SafeAreaView>
      
      <SafeAreaView style={styles.addMoreContainer} edges={['top']}>
        {/* Only enable + appending organically firmly within Custom Manual Modes */}
        {appMode === 'manual' && (
          <TouchableOpacity style={styles.addMoreButton} onPress={pickVideos}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        )}
        
        {/* Master System Reset Toggle rendering safely top right to clear out explicit database pointers */}
        <TouchableOpacity style={[styles.addMoreButton, { marginTop: appMode === 'manual' ? 15 : 0 }]} onPress={resetVault}>
          <Ionicons name="settings-outline" size={20} color="rgba(255,255,255,0.7)" />
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
    alignItems: 'center'
  },
  addMoreButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
  buttonMain: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginBottom: 15,
    width: '80%',
    alignItems: 'center',
  },
  buttonMainText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
  buttonOutline: {
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    width: '80%',
    alignItems: 'center',
  },
  buttonOutlineText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  }
});
