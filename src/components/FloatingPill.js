import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, Modal, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';

export default function FloatingPill({ activeAsset }) {
  const [favorites, setFavorites] = useState(new Set());
  const [modalVisible, setModalVisible] = useState(false);

  const isFavorited = activeAsset ? favorites.has(activeAsset.id) : false;

  const handleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!activeAsset) return;

    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(activeAsset.id)) {
        next.delete(activeAsset.id);
      } else {
        next.add(activeAsset.id);
      }
      return next;
    });
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!activeAsset || !activeAsset.uri) return;
    
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(activeAsset.uri, {
          dialogTitle: "Share from OffReel Vault",
        });
      } else {
        Alert.alert("Sharing not available", "Your device does not support native sharing.");
      }
    } catch (err) {
      Alert.alert("Share Error", err.message);
    }
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
              name={isFavorited ? "heart" : "heart-outline"} 
              size={26} 
              color={isFavorited ? "#ff2a5f" : "#fff"} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.iconButton} onPress={handleShare} activeOpacity={0.6}>
            <Ionicons name="paper-plane-outline" size={24} color="#fff" style={{ marginLeft: -2 }} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={handleOptions} activeOpacity={0.6}>
            <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Custom Video Details Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setModalVisible(false)}
        >
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Vault Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#aaa" />
              </TouchableOpacity>
            </View>

            <View style={styles.metadataRow}>
              <Ionicons name="document-text-outline" size={20} color="#888" style={styles.metaIcon} />
              <View style={styles.metaTextContainer}>
                <Text style={styles.metaLabel}>Filename</Text>
                <Text style={styles.metaValue} numberOfLines={2}>
                  {activeAsset ? activeAsset.filename : 'Unknown'}
                </Text>
              </View>
            </View>

            <View style={styles.metadataRow}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#888" style={styles.metaIcon} />
              <View style={styles.metaTextContainer}>
                <Text style={styles.metaLabel}>Status</Text>
                <Text style={[styles.metaValue, { color: '#4caf50' }]}>Safely stored offline</Text>
              </View>
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
  }
});
