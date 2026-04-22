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
              // Direct ID parity check: if it's a native asset, it's already "synced"
              // We only verify existence for items that have a specific system ID
              if (video.id && !video.id.startsWith('video-')) {
                 // We don't need getAssetInfoAsync for every boot unless we need new metadata
                 // Just being in the parsed list is enough if it's a native ID
                 return video;
              }
              return video;
            } catch (e) {
              return null;
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

  const fetchAllGalleryVideos = async () => {
    // Stage 1: Get current permission state without triggering a prompt
    let { status, canAskAgain } = await MediaLibrary.getPermissionsAsync();
    
    // Stage 2: Only prompt if we lack access but are permitted to ask
    if (status !== 'granted' && canAskAgain) {
      try {
        const request = await MediaLibrary.requestPermissionsAsync();
        status = request.status;
      } catch (err) {
        console.warn("Native permission request failed:", err);
      }
    }
    
    // Stage 3: Final validation before accessing the bridge
    if (status !== 'granted') {
      throw new Error("OffReel needs gallery access to populate your Vault.");
    }

    let allAssets = [];
    let hasNextPage = true;
    let endCursor = undefined;

    while (hasNextPage) {
      const result = await MediaLibrary.getAssetsAsync({
        mediaType: 'video',
        first: 50, // Small batches for bridge stability
        after: endCursor,
        sortBy: ['creationTime'],
      });
      
      allAssets = [...allAssets, ...result.assets];
      hasNextPage = result.hasNextPage;
      endCursor = result.endCursor;
    }

    return allAssets.map((asset, index) => ({
      id: asset.id,
      uri: asset.uri,
      filename: asset.filename || `Scanned Video ${index + 1}`,
    }));
  };

  const silentAutoScanGallery = async () => {
    try {
      const allVideos = await fetchAllGalleryVideos();
      if (allVideos.length === 0) throw new Error("Vault is physically empty.");
      setVideos(allVideos);
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

  const getManualSelectionPool = async () => {
    try {
      setLoading(true);
      const pool = await fetchAllGalleryVideos();
      setLoading(false);
      return pool;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return [];
    }
  };

  const addManualVideos = async (newAssets) => {
    setVideos(prev => {
      const existingIds = new Set(prev.map(v => v.id));
      const newUnique = newAssets.filter(v => !existingIds.has(v.id));
      return [...prev, ...newUnique];
    });
    if (appMode !== 'manual') {
      await enableMode('manual');
    }
  };

  const changeDefaultFit = async (fitString) => {
    await AsyncStorage.setItem(DEFAULT_FIT_KEY, fitString);
    setDefaultFit(fitString);
  };

  return { 
    videos, 
    loading, 
    error, 
    appMode, 
    defaultFit, 
    changeDefaultFit, 
    getManualSelectionPool, 
    addManualVideos, 
    autoScanGallery, 
    resetVault 
  };
};
