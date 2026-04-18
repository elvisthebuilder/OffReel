import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VAULT_STORAGE_KEY = '@offreel_vault_videos';

export const useVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Execute once on load to fetch historically preserved user vault config
  useEffect(() => {
    const loadVault = async () => {
      try {
        const storedVideos = await AsyncStorage.getItem(VAULT_STORAGE_KEY);
        if (storedVideos) {
          setVideos(JSON.parse(storedVideos));
        }
      } catch (err) {
        console.error('Failed to load vault from storage:', err);
      } finally {
        setLoading(false);
      }
    };
    loadVault();
  }, []);

  // Sync to database natively asynchronously when the state changes safely
  useEffect(() => {
    const saveVault = async () => {
      try {
        if (!loading) {
          await AsyncStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(videos));
        }
      } catch (err) {
        console.error('Failed to save vault to storage:', err);
      }
    };
    saveVault();
  }, [videos, loading]);

  const autoScanGallery = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error("Gallery permission denied. Please use 'Select Manually' instead.");
      }

      const media = await MediaLibrary.getAssetsAsync({
        mediaType: 'video',
        first: 50,
        sortBy: ['creationTime'],
      });

      if (!media.assets || media.assets.length === 0) {
        throw new Error("Auto-scan blocked by OS or Vault is empty. Please try the 'Select Manually' fallback.");
      }

      const formattedAssets = media.assets.map((asset, index) => ({
        id: asset.id || `video-${index}-${Date.now()}`,
        uri: asset.uri,
        filename: asset.filename || `Scanned Video ${index + 1}`,
      }));

      // Append instead of brutally overriding
      setVideos(prev => {
        const existingIds = new Set(prev.map(v => v.id));
        const newUnique = formattedAssets.filter(v => !existingIds.has(v.id));
        return [...prev, ...newUnique];
      });
    } catch (err) {
      console.error('Error auto-scanning videos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const pickVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsMultipleSelection: true,
        selectionLimit: 0, // 0 = unlimited globally securely
        quality: 1,
      });

      if (!result.canceled && result.assets) {
        const pickedAssets = result.assets.map((asset, index) => ({
          id: asset.assetId || `video-${index}-${Date.now()}`,
          uri: asset.uri,
          filename: asset.fileName || `Selected Video ${index + 1}`,
        }));
        
        // Append accurately instead of brutally replacing existing vault
        setVideos(prev => {
          const existingIds = new Set(prev.map(v => v.id));
          const newUnique = pickedAssets.filter(v => !existingIds.has(v.id));
          return [...prev, ...newUnique];
        });
      }
    } catch (err) {
      console.error('Error picking videos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { videos, loading, error, pickVideos, autoScanGallery };
};
