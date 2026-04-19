import React, { useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import { useVideos } from '../hooks/useVideos';
import VideoFeed from '../components/VideoFeed';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

export default function HomeScreen() {
  const { videos, loading, error, appMode, defaultFit, changeDefaultFit, pickVideos, autoScanGallery } = useVideos();
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);

  // Wrapped sync actions that seamlessly drop the Modal overlay prior to executing
  const handleAutoScan = async () => {
    setIsSettingsVisible(false);
    await autoScanGallery();
  };

  const handleManualPath = async () => {
    setIsSettingsVisible(false);
    await pickVideos();
  };

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
      {/* Passing global settings layout efficiently beneath to structure raw render configs */}
      <VideoFeed videos={videos} defaultFit={defaultFit} />
      
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
        
        {/* Securely triggering transparent structural overlays instead of wiping active array */}
        <TouchableOpacity style={[styles.addMoreButton, { marginTop: appMode === 'manual' ? 15 : 0 }]} onPress={() => setIsSettingsVisible(true)}>
          <Ionicons name="settings-outline" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Settings Modal Framework Overlaid securely on active Z-Axis exclusively */}
      <Modal visible={isSettingsVisible} transparent={true} animationType="slide">
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setIsSettingsVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={{ width: '100%' }} onPress={() => {}}>
            <BlurView intensity={65} tint="dark" style={styles.modalContent}>
            
            <View style={styles.dragHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Vault Settings</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setIsSettingsVisible(false)}>
                <Ionicons name="close" size={20} color="#888" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.sectionLabel}>DISPLAY RATIO</Text>
              <View style={styles.toggleContainer}>
                <TouchableOpacity 
                  style={[styles.toggleButton, defaultFit === 'cover' && styles.toggleButtonActive]} 
                  onPress={() => changeDefaultFit('cover')}
                >
                  <Ionicons name="expand" size={16} color={defaultFit === 'cover' ? '#000' : '#888'} />
                  <Text style={[styles.toggleLabel, defaultFit === 'cover' && styles.toggleLabelActive]}>Fill Frame</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.toggleButton, defaultFit === 'contain' && styles.toggleButtonActive]} 
                  onPress={() => changeDefaultFit('contain')}
                >
                  <Ionicons name="contract" size={16} color={defaultFit === 'contain' ? '#000' : '#888'} />
                  <Text style={[styles.toggleLabel, defaultFit === 'contain' && styles.toggleLabelActive]}>Original View</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.sectionLabel}>SYNC ENGINE</Text>
              
              <TouchableOpacity style={[styles.actionRow, appMode === 'auto' && styles.actionRowActive]} onPress={handleAutoScan}>
                <View style={styles.actionRowLeft}>
                  <View style={[styles.iconCircle, appMode === 'auto' ? {backgroundColor: '#000'} : {backgroundColor: '#262626'}]}>
                     <Ionicons name="sync" size={16} color={appMode === 'auto' ? '#fff' : '#aaa'} />
                  </View>
                  <View>
                    <Text style={[styles.actionTitle, appMode === 'auto' && {color: '#000'}]}>Live OS Gallery</Text>
                    <Text style={[styles.actionSub, appMode === 'auto' && {color: '#444'}]}>Auto-syncs device changes</Text>
                  </View>
                </View>
                {appMode === 'auto' && <Ionicons name="checkmark-circle" size={24} color="#000" />}
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionRow, appMode === 'manual' && styles.actionRowActive, {marginTop: 10}]} onPress={handleManualPath}>
                <View style={styles.actionRowLeft}>
                  <View style={[styles.iconCircle, appMode === 'manual' ? {backgroundColor: '#000'} : {backgroundColor: '#262626'}]}>
                     <Ionicons name="folder-open" size={16} color={appMode === 'manual' ? '#fff' : '#aaa'} />
                  </View>
                  <View>
                    <Text style={[styles.actionTitle, appMode === 'manual' && {color: '#000'}]}>Custom Vault</Text>
                    <Text style={[styles.actionSub, appMode === 'manual' && {color: '#444'}]}>Select videos manually</Text>
                  </View>
                </View>
                {appMode === 'manual' && <Ionicons name="checkmark-circle" size={24} color="#000" />}
              </TouchableOpacity>
            </View>
            
            </BlurView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

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
    width: '100%',
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
    width: '100%',
    alignItems: 'center',
  },
  buttonOutlineText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'rgba(15, 15, 15, 0.85)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 50, // Avoids iOS Home Indicator safely
    width: '100%',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
    marginTop: -10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  closeButton: {
    backgroundColor: '#222',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    color: '#666',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#fff',
  },
  toggleLabel: {
    color: '#888',
    fontWeight: '700',
    fontSize: 14,
  },
  toggleLabelActive: {
    color: '#000',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#262626',
  },
  actionRowActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  actionRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  actionSub: {
    color: '#777',
    fontSize: 12,
    fontWeight: '500',
  }
});
