import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as MediaLibrary from 'expo-media-library';
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  FlatList,
  Image,
  Linking,
  ToastAndroid,
  Alert,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AlbumChips from '../components/AlbumChips';
import VaultSkeleton from '../components/VaultSkeleton';
import VideoFeed from '../components/VideoFeed';
import { useVideos } from '../hooks/useVideos';
import { ensureMediaPermission, getNativePermission } from '../utils/mediaPermissions';

export default function HomeScreen() {
  const {
    videos,
    loading,
    error,
    appMode,
    defaultFit,
    initialVideoId,
    playbackSpeed,
    changeDefaultFit,
    changePlaybackSpeed,
    deleteVideo,
    getManualSelectionPool,
    addManualVideos,
    autoScanGallery,
    resetVault,
  } = useVideos();

  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [isFetchingPool, setIsFetchingPool] = useState(false);
  const [galleryPool, setGalleryPool] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState(new Set());
  const [syncStatus, setSyncStatus] = useState('Synchronizing Vault...');
  const [galleryPermissionStatus, setGalleryPermissionStatus] = useState('undetermined');
  const [isLongPressing, setIsLongPressing] = useState(false);

  // Album filtering state hoisted to Home
  const [selectedAlbumId, setSelectedAlbumId] = useState(null);
  const [filteredVideos, setFilteredVideos] = useState(videos);

  useEffect(() => {
    if (!selectedAlbumId) {
      setFilteredVideos(videos);
    } else {
      const vaultIds = new Set(videos.map((v) => v.id));
      setFilteredVideos((prev) => prev.filter((v) => vaultIds.has(v.id)));
    }
  }, [videos, selectedAlbumId]);

  const handleAlbumSelect = async (albumId) => {
    if (!albumId) {
      setSelectedAlbumId(null);
      setFilteredVideos(videos);
      return;
    }
    setSelectedAlbumId(albumId);
    try {
      // Need to import MediaLibrary at top
      const MediaLibrary = require('expo-media-library');
      const res = await MediaLibrary.getAssetsAsync({
        album: albumId,
        mediaType: MediaLibrary.MediaType.video,
        first: 1000,
      });
      const mapped = res.assets.map((a) => ({
        id: a.id,
        uri: a.uri,
        filename: a.filename,
      }));
      const vaultIds = new Set(videos.map((v) => v.id));
      const filtered = mapped.filter((v) => vaultIds.has(v.id));
      setFilteredVideos(filtered);
    } catch (e) {
      console.error('Failed to load assets for album filter:', e);
    }
  };

  useEffect(() => {
    const checkAndPromptPermission = async () => {
      if (appMode === null || videos.length === 0) {
        const current = await getNativePermission();
        if (current === 'granted') {
          setGalleryPermissionStatus('granted');
        } else {
          // Actively prompt instantly so user doesn't get stuck
          const requested = await ensureMediaPermission({ forceRequest: true });
          setGalleryPermissionStatus(requested);
        }
      }
    };
    checkAndPromptPermission();
  }, [appMode, videos.length]);

  // Pagination states for native gallery selection
  const [hasNextPage, setHasNextPage] = useState(false);
  const [endCursor, setEndCursor] = useState(undefined);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

  // Status rotation for better UX perceived speed
  useEffect(() => {
    if (loading && !isPickerVisible) {
      const statuses = [
        'Connecting Media Bridge...',
        'Mapping Chronological Vault...',
        'Calibrating Hardware Decoders...',
        'Securing Private Assets...',
        'Applying Zero-Copy Logic...',
      ];
      let i = 0;
      const interval = setInterval(() => {
        setSyncStatus(statuses[i % statuses.length]);
        i++;
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [loading, isPickerVisible]);

  // Wrapped sync actions that seamlessly drop the Modal overlay prior to executing
  const handleAutoScan = async () => {
    setIsSettingsVisible(false);
    await autoScanGallery();
  };

  const handleManualPath = async () => {
    setIsSettingsVisible(false);
    setIsPickerVisible(true);
    setIsFetchingPool(true);

    const result = await getManualSelectionPool(120, undefined); // Fetch a slightly larger initial screen batch (4 rows of 3 grid items = 12, so 120 is great)
    setGalleryPool(result.assets);
    setHasNextPage(result.hasNextPage);
    setEndCursor(result.endCursor);

    setSelectedVideos(new Set());
    setIsFetchingPool(false);
  };

  const loadNextPage = async () => {
    if (!hasNextPage || isFetchingNextPage) return;

    setIsFetchingNextPage(true);
    const result = await getManualSelectionPool(120, endCursor);
    setGalleryPool((prev) => [...prev, ...result.assets]);
    setHasNextPage(result.hasNextPage);
    setEndCursor(result.endCursor);
    setIsFetchingNextPage(false);
  };

  const handleReset = async () => {
    setIsSettingsVisible(false);
    await resetVault();
  };

  const toggleVideoSelection = (id) => {
    setSelectedVideos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const finalizeManualSelection = async () => {
    const chosen = galleryPool.filter((v) => selectedVideos.has(v.id));
    if (chosen.length > 0) {
      await addManualVideos(chosen);
    }
    setIsPickerVisible(false);
  };

  if (loading && !isPickerVisible) {
    return (
      <View style={[styles.centered, { backgroundColor: '#000' }]}>
        <ActivityIndicator size="large" color="#fff" />
        <Text
          style={[
            styles.text,
            { fontSize: 13, letterSpacing: 3, opacity: 0.7, fontWeight: '600', marginTop: 24 },
          ]}>
          {syncStatus.toUpperCase()}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>System Notice</Text>
        <Text style={styles.subtext}>{error}</Text>
        <TouchableOpacity style={[styles.buttonMain, { marginTop: 10 }]} onPress={handleManualPath}>
          <Text style={styles.buttonMainText}>Select Manually</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Raw routing page safely awaiting routing protocol instructions natively
  if (appMode === null || videos.length === 0) {
    return (
      <View style={styles.centered}>
        <View style={styles.emptyStateIcon}>
          <Ionicons name="lock-open-outline" size={64} color="rgba(255,255,255,0.2)" />
        </View>

        <Text style={styles.text}>Your Vault is Empty</Text>
        <Text style={styles.subtext}>
          Choose how you want to natively sync your local gallery to OffReel.
        </Text>

        {/* Visual step-by-step guide */}
        <View style={styles.stepsContainer}>
          <TouchableOpacity
            style={[styles.step, galleryPermissionStatus === 'granted' && { opacity: 0.5 }]}
            onPress={async () => {
              const perm = await ensureMediaPermission({ forceRequest: true });
              setGalleryPermissionStatus(perm);

              if (perm !== 'granted') {
                const native = await MediaLibrary.getPermissionsAsync();
                // Only show the Settings alert if the OS blocks the native popup (canAskAgain is false)
                if (!native.canAskAgain) {
                  Alert.alert(
                    'Permission Required',
                    'The OS has blocked permission requests. Please allow gallery access in Settings to continue.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Settings', onPress: () => Linking.openSettings() },
                    ]
                  );
                }
              }
            }}>
            <View
              style={[
                styles.stepNumber,
                galleryPermissionStatus === 'granted' && { backgroundColor: '#4cd964' },
              ]}>
              {galleryPermissionStatus === 'granted' ? (
                <Ionicons name="checkmark" size={16} color="#000" />
              ) : (
                <Text style={styles.stepNumberText}>1</Text>
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                galleryPermissionStatus === 'granted' && { color: '#4cd964' },
              ]}>
              Grant Gallery Access
            </Text>
          </TouchableOpacity>

          <View style={[styles.step, { opacity: galleryPermissionStatus === 'granted' ? 1 : 0.4 }]}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepLabel}>Choose Sync Method</Text>
          </View>

          <View style={[styles.step, { opacity: 0.4 }]}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepLabel}>Start Browsing</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.buttonMain, galleryPermissionStatus !== 'granted' && { opacity: 0.5 }]}
          onPress={galleryPermissionStatus === 'granted' ? autoScanGallery : null}>
          <Ionicons name="sync" size={20} color="#000" style={{ marginRight: 8 }} />
          <Text style={styles.buttonMainText}>Live Auto-Sync OS Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.buttonOutline, galleryPermissionStatus !== 'granted' && { opacity: 0.5 }]}
          onPress={galleryPermissionStatus === 'granted' ? handleManualPath : null}>
          <Ionicons name="folder-open-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.buttonOutlineText}>Custom Select Manually</Text>
        </TouchableOpacity>

        {/* Picker Modal positioned for early access */}
        {renderPickerModal()}
      </View>
    );
  }

  function renderPickerModal() {
    return (
      <Modal visible={isPickerVisible} animationType="slide">
        <SafeAreaView style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <TouchableOpacity onPress={() => setIsPickerVisible(false)}>
              <Text style={styles.pickerCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.pickerTitle}>Select Videos</Text>
            <TouchableOpacity onPress={finalizeManualSelection}>
              <Text style={styles.pickerDone}>Add ({selectedVideos.size})</Text>
            </TouchableOpacity>
          </View>

          {isFetchingPool ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={{ color: '#888', marginTop: 15, fontSize: 13, letterSpacing: 1 }}>
                SCANNING LOCAL MEDIA
              </Text>
            </View>
          ) : (
            <FlatList
              data={galleryPool}
              keyExtractor={(item) => item.id}
              numColumns={3}
              onEndReached={loadNextPage}
              onEndReachedThreshold={0.5}
              ListFooterComponent={() =>
                isFetchingNextPage ? (
                  <View style={{ paddingVertical: 20 }}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                ) : null
              }
              renderItem={({ item }) => {
                const isAlreadyInVault = videos.some((v) => v.id === item.id);
                const isSelected = selectedVideos.has(item.id);

                return (
                  <TouchableOpacity
                    style={[styles.pickerItem, isAlreadyInVault && { opacity: 0.3 }]}
                    onPress={() => {
                      if (isAlreadyInVault) {
                        ToastAndroid.show(
                          'This video is already in your Vault',
                          ToastAndroid.SHORT
                        );
                      } else {
                        toggleVideoSelection(item.id);
                      }
                    }}>
                    <Image source={{ uri: item.uri }} style={styles.pickerImage} />

                    {isAlreadyInVault ? (
                      <View style={styles.selectionOverlay}>
                        <Ionicons name="lock-closed" size={24} color="rgba(255,255,255,0.7)" />
                      </View>
                    ) : isSelected ? (
                      <View style={styles.selectionOverlay}>
                        <Ionicons name="checkmark-circle" size={24} color="#fff" />
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </SafeAreaView>
      </Modal>
    );
  }

  // Active Feed Layering
  return (
    <View style={styles.container}>
      {/* Passing global settings layout efficiently beneath to structure raw render configs */}
      <VideoFeed
        videos={filteredVideos}
        defaultFit={defaultFit}
        initialVideoId={initialVideoId}
        playbackSpeed={playbackSpeed}
        onVideoDeleted={deleteVideo}
        onLongPressStateChange={setIsLongPressing}
      />

      {!isLongPressing && (
        <>
          <SafeAreaView style={styles.header} edges={['top']} pointerEvents="none">
            <Text style={styles.headerText}>OffReel</Text>
          </SafeAreaView>

          <View style={{ position: 'absolute', top: 90, zIndex: 10, width: '100%' }}>
            <AlbumChips selectedAlbumId={selectedAlbumId} onSelect={handleAlbumSelect} />
          </View>

          <SafeAreaView style={styles.addMoreContainer} edges={['top']}>
            {appMode === 'manual' && (
              <TouchableOpacity style={styles.addMoreButton} onPress={handleManualPath}>
                <Ionicons name="add" size={24} color="#fff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.addMoreButton, { marginTop: appMode === 'manual' ? 15 : 0 }]}
              onPress={() => setIsSettingsVisible(true)}>
              <Ionicons name="settings-outline" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </SafeAreaView>
        </>
      )}

      {/* Picker Modal Integration */}
      {renderPickerModal()}

      {/* Settings — Full Screen */}
      <Modal visible={isSettingsVisible} transparent={false} animationType="slide">
        <View style={styles.settingsScreen}>
          <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right', 'bottom']}>
            <View style={styles.settingsHeader}>
              <Text style={styles.modalTitle}>Vault Settings</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsSettingsVisible(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 24, paddingTop: 0 }}
              showsVerticalScrollIndicator={false}>
              <View style={styles.modalSection}>
                <Text style={styles.sectionLabel}>DISPLAY RATIO</Text>
                <View style={styles.toggleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      defaultFit === 'cover' && styles.toggleButtonActive,
                    ]}
                    onPress={() => changeDefaultFit('cover')}>
                    <Ionicons
                      name="expand"
                      size={16}
                      color={defaultFit === 'cover' ? '#000' : '#888'}
                    />
                    <Text
                      style={[
                        styles.toggleLabel,
                        defaultFit === 'cover' && styles.toggleLabelActive,
                      ]}>
                      Fill Frame
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      defaultFit === 'contain' && styles.toggleButtonActive,
                    ]}
                    onPress={() => changeDefaultFit('contain')}>
                    <Ionicons
                      name="contract"
                      size={16}
                      color={defaultFit === 'contain' ? '#000' : '#888'}
                    />
                    <Text
                      style={[
                        styles.toggleLabel,
                        defaultFit === 'contain' && styles.toggleLabelActive,
                      ]}>
                      Original View
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.sectionLabel}>PLAYBACK SPEED</Text>
                <View style={styles.toggleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      playbackSpeed === 1.5 && styles.toggleButtonActive,
                    ]}
                    onPress={() => changePlaybackSpeed(1.5)}>
                    <Text
                      style={[
                        styles.toggleLabel,
                        playbackSpeed === 1.5 && styles.toggleLabelActive,
                      ]}>
                      1.5x
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      playbackSpeed === 2.0 && styles.toggleButtonActive,
                    ]}
                    onPress={() => changePlaybackSpeed(2.0)}>
                    <Text
                      style={[
                        styles.toggleLabel,
                        playbackSpeed === 2.0 && styles.toggleLabelActive,
                      ]}>
                      2.0x
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.sectionLabel}>SYNC ENGINE</Text>

                <TouchableOpacity
                  style={[styles.actionRow, appMode === 'auto' && styles.actionRowActive]}
                  onPress={handleAutoScan}>
                  <View style={styles.actionRowLeft}>
                    <View
                      style={[
                        styles.iconCircle,
                        appMode === 'auto'
                          ? { backgroundColor: '#000' }
                          : { backgroundColor: '#262626' },
                      ]}>
                      <Ionicons
                        name="sync"
                        size={16}
                        color={appMode === 'auto' ? '#fff' : '#aaa'}
                      />
                    </View>
                    <View>
                      <Text style={[styles.actionTitle, appMode === 'auto' && { color: '#000' }]}>
                        Live OS Gallery
                      </Text>
                      <Text style={[styles.actionSub, appMode === 'auto' && { color: '#444' }]}>
                        Auto-syncs device changes
                      </Text>
                    </View>
                  </View>
                  {appMode === 'auto' && (
                    <Ionicons name="checkmark-circle" size={24} color="#000" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionRow,
                    appMode === 'manual' && styles.actionRowActive,
                    { marginTop: 10 },
                  ]}
                  onPress={handleManualPath}>
                  <View style={styles.actionRowLeft}>
                    <View
                      style={[
                        styles.iconCircle,
                        appMode === 'manual'
                          ? { backgroundColor: '#000' }
                          : { backgroundColor: '#262626' },
                      ]}>
                      <Ionicons
                        name="folder-open"
                        size={16}
                        color={appMode === 'manual' ? '#fff' : '#aaa'}
                      />
                    </View>
                    <View>
                      <Text style={[styles.actionTitle, appMode === 'manual' && { color: '#000' }]}>
                        Custom Vault
                      </Text>
                      <Text style={[styles.actionSub, appMode === 'manual' && { color: '#444' }]}>
                        Select videos manually
                      </Text>
                    </View>
                  </View>
                  {appMode === 'manual' && (
                    <Ionicons name="checkmark-circle" size={24} color="#000" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionRow,
                    {
                      marginTop: 10,
                      borderColor: 'rgba(255,255,255,0.05)',
                      backgroundColor: 'rgba(255,255,255,0.02)',
                    },
                  ]}
                  onPress={() => {
                    setIsSettingsVisible(false);
                    autoScanGallery(); // Forces a re-bind of all native URIs
                  }}>
                  <View style={styles.actionRowLeft}>
                    <View style={[styles.iconCircle, { backgroundColor: '#333' }]}>
                      <Ionicons name="refresh" size={16} color="#fff" />
                    </View>
                    <View>
                      <Text style={styles.actionTitle}>Refresh Media Bridge</Text>
                      <Text style={styles.actionSub}>Fixes "Blank Screen" if decoder hangs</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.sectionLabel}>COMMUNITY</Text>
                <TouchableOpacity
                  style={[
                    styles.actionRow,
                    { borderStyle: 'dashed', borderColor: 'rgba(88, 101, 242, 0.5)' },
                  ]}
                  onPress={() => Linking.openURL('https://discord.gg/5QYH4xaS')}>
                  <View style={styles.actionRowLeft}>
                    <View style={[styles.iconCircle, { backgroundColor: '#5865F2' }]}>
                      <Ionicons name="logo-discord" size={16} color="#fff" />
                    </View>
                    <View>
                      <Text style={styles.actionTitle}>Join The Vault</Text>
                      <Text style={styles.actionSub}>Official Discord Community</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#5865F2" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.sectionLabel}>DANGER ZONE</Text>
                <TouchableOpacity style={styles.actionRowDanger} onPress={handleReset}>
                  <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,59,48,0.1)' }]}>
                    <Ionicons name="trash-outline" size={20} color="#ff3b30" />
                  </View>
                  <View>
                    <Text style={[styles.actionLabel, { color: '#ff3b30' }]}>Wipe Vault Data</Text>
                    <Text style={styles.actionDesc}>Clear storage & start fresh.</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  syncOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
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
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  addMoreContainer: {
    position: 'absolute',
    top: 0,
    right: 20,
    paddingTop: 5,
    zIndex: 11,
    alignItems: 'center',
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
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 16,
    width: '85%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonMainText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: -0.2,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 16,
    width: '85%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  buttonOutlineText: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: -0.2,
  },
  emptyStateIcon: {
    marginBottom: 20,
    opacity: 0.5,
  },
  stepsContainer: {
    marginVertical: 30,
    marginBottom: 40,
    paddingHorizontal: 20,
    width: '100%',
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  stepNumberText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  stepLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
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
  settingsScreen: {
    flex: 1,
    backgroundColor: '#050505',
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
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
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  resetButtonText: {
    color: '#ff3b30',
    fontWeight: '700',
    fontSize: 14,
  },
  pickerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  pickerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  pickerCancel: {
    color: '#888',
    fontSize: 16,
  },
  pickerDone: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  pickerItem: {
    flex: 1 / 3,
    aspectRatio: 1,
    padding: 1,
  },
  pickerImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#111',
  },
  selectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
