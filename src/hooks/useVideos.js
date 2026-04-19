import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VAULT_STORAGE_KEY = '@offreel_vault_videos';
const APP_MODE_KEY = '@offreel_app_mode';
const DEFAULT_FIT_KEY = '@offreel_default_fit';

export const useVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appMode, setAppMode] = useState(null);
  const [defaultFit, setDefaultFit] = useState("cover");

  useEffect(() => {
    const bootApp = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(APP_MODE_KEY);
        setAppMode(savedMode);
        
        const savedFit = await AsyncStorage.getItem(DEFAULT_FIT_KEY);
        if (savedFit) {
          setDefaultFit(savedFit);
        }
        
        if (savedMode === 'auto') {
          await silentAutoScanGallery();
        } else if (savedMode === 'manual') {
          await loadManualVault();
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to parse boot states:', err);
        setLoading(false);
      }
    };
    bootApp();
  }, []);

  const loadManualVault = async () => {
    try {
      const storedVideos = await AsyncStorage.getItem(VAULT_STORAGE_KEY);
      if (storedVideos) {
        const parsed = JSON.parse(storedVideos);
        
        const verifiedVideos = (await Promise.all(
          parsed.map(async (video) => {
            try {
              // Deep Native GC: Cross reference directly against the OS database
              // Bypasses static ImagePicker local Sandbox copy clones perfectly
              if (video.id && !video.id.startsWith('video-')) {
                 const assetInfo = await MediaLibrary.getAssetInfoAsync(video.id);
                 return assetInfo ? video : null;
              }
              return video; // Fallback mapping
            } catch (e) {
              return null; // Cull securely
            }
          })
        )).filter(v => v !== null);

        setVideos(verifiedVideos);
        if (verifiedVideos.length < parsed.length) {
             await AsyncStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(verifiedVideos));
        }
      }
    } catch (err) {
      console.error('Failed to load manual vault:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saveManualState = async () => {
      if (appMode === 'manual' && !loading) {
        await AsyncStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(videos));
      }
    };
    saveManualState();
  }, [videos, appMode, loading]);

  const enableMode = async (mode) => {
    await AsyncStorage.setItem(APP_MODE_KEY, mode);
    setAppMode(mode);
  };

  const resetVault = async () => {
    await AsyncStorage.removeItem(APP_MODE_KEY);
    setAppMode(null);
    setVideos([]);
  };

  const silentAutoScanGallery = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') throw new Error("Permission permanently denied.");

      const media = await MediaLibrary.getAssetsAsync({
        mediaType: 'video',
        first: 100, // Safe default payload batch
        sortBy: ['creationTime'],
      });

      if (!media.assets || media.assets.length === 0) throw new Error("Vault is physically empty.");

      setVideos(media.assets.map((asset, index) => ({
        id: asset.id,
        uri: asset.uri,
        filename: asset.filename || `Scanned Video ${index + 1}`,
      })));
    } catch (err) {
      console.error('Background auto-scan silently failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const autoScanGallery = async () => {
    try {
      setLoading(true);
      setError(null);
      await enableMode('auto');
      await silentAutoScanGallery();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const pickVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      await enableMode('manual');
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsMultipleSelection: true,
        selectionLimit: 0,
        quality: 1,
      });

      if (!result.canceled && result.assets) {
        const pickedAssets = result.assets.map((asset, index) => ({
          id: asset.assetId || `video-${index}-${Date.now()}`,
          uri: asset.uri,
          filename: asset.fileName || `Selected Video ${index + 1}`,
        }));
        
        setVideos(prev => {
          const existingIds = new Set(prev.map(v => v.id));
          const newUnique = pickedAssets.filter(v => !existingIds.has(v.id));
          return [...prev, ...newUnique];
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const changeDefaultFit = async (fitString) => {
    await AsyncStorage.setItem(DEFAULT_FIT_KEY, fitString);
    setDefaultFit(fitString);
  };

  return { videos, loading, error, appMode, defaultFit, changeDefaultFit, pickVideos, autoScanGallery, resetVault };
};
