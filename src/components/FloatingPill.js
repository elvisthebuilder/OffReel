import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, Modal, Text, Pressable } from 'react-native';

export default function FloatingPill({ activeAsset, favorites, onToggleFavorite, onDeleteVideo }) {
  const [modalVisible, setModalVisible] = useState(false);

  const isFavorited = activeAsset ? favorites.has(activeAsset.id) : false;

  const handleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!activeAsset) return;
    onToggleFavorite(activeAsset.id);
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!activeAsset || !activeAsset.uri) return;

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        let fileUri = activeAsset.uri;
        if (!fileUri.startsWith('file://')) {
          const assetInfo = await MediaLibrary.getAssetInfoAsync(activeAsset.id);
          fileUri = assetInfo.localUri || assetInfo.uri;
        }
        await Sharing.shareAsync(fileUri, {
          dialogTitle: 'Share from OffReel Vault',
        });
      } else {
        Alert.alert('Sharing not available', 'Your device does not support native sharing.');
      }
    } catch (err) {
      Alert.alert('Share Error', err.message);
    }
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!activeAsset) return;

    Alert.alert('Delete Video?', `Are you sure you want to delete "${activeAsset.filename}"?`, [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            setModalVisible(false);
            await MediaLibrary.deleteAssetsAsync([activeAsset.id]);
            onDeleteVideo?.(activeAsset.id);
          } catch (err) {
            Alert.alert('Delete Error', err.message);
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const handleOptions = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!activeAsset) return;
    setModalVisible(true);
  };

  return (
    <>
      <View style={styles.pillContainer}>
        <View style={styles.pill}>
          <TouchableOpacity style={styles.iconButton} onPress={handleFavorite} activeOpacity={0.6}>
            <Ionicons
              name={isFavorited ? 'heart' : 'heart-outline'}
              size={26}
              color={isFavorited ? '#ff2a5f' : '#fff'}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={handleShare} activeOpacity={0.6}>
            <Ionicons
              name="paper-plane-outline"
              size={24}
              color="#fff"
              style={{ marginLeft: -2 }}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={handleOptions} activeOpacity={0.6}>
            <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Custom Video Details Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Video Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#aaa" />
              </TouchableOpacity>
            </View>

            {/* Filename as prominent heading */}
            <View style={styles.filenameSection}>
              <Text style={styles.filename} numberOfLines={3}>
                {activeAsset ? activeAsset.filename : 'Unknown'}
              </Text>
            </View>

            {/* Metadata rows */}
            <View style={styles.metadataRow}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="#4caf50"
                style={styles.metaIcon}
              />
              <View style={styles.metaTextContainer}>
                <Text style={styles.metaLabel}>Status</Text>
                <Text style={[styles.metaValue, { color: '#4caf50' }]}>Safely stored offline</Text>
              </View>
            </View>

            {/* Action buttons */}
            <View style={styles.actionsSection}>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonDelete]}
                onPress={handleDelete}
                activeOpacity={0.7}>
                <Ionicons name="trash-outline" size={20} color="#ff3b30" />
                <Text style={styles.actionButtonText}>Delete Video</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pillContainer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    paddingVertical: 8,
    paddingHorizontal: 25,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 25,
  },
  iconButton: {
    padding: 2,
    minWidth: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Custom Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '85%',
    backgroundColor: '#1c1c1e',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 15,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  metaIcon: {
    marginTop: 2,
    marginRight: 15,
  },
  metaTextContainer: {
    flex: 1,
  },
  metaLabel: {
    color: '#777',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    fontWeight: '600',
  },
  metaValue: {
    color: '#ddd',
    fontSize: 16,
    lineHeight: 22,
  },
  filenameSection: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  filename: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  actionsSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonDelete: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  actionButtonText: {
    color: '#ff3b30',
    fontSize: 16,
    fontWeight: '600',
  },
});
