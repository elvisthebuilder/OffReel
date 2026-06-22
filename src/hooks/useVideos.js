import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library';
import { useState, useEffect } from 'react';
import { AppState } from 'react-native';

const VAULT_STORAGE_KEY = '@offreel_vault_videos';
const APP_MODE_KEY = '@offreel_app_mode';
const DEFAULT_FIT_KEY = '@offreel_default_fit';
const LAST_VIDEO_ID_KEY = '@offreel_last_video_id';

export const useVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appMode, setAppMode] = useState(null);
  const [defaultFit, setDefaultFit] = useState('cover');
  const [initialVideoId, setInitialVideoId] = useState(null);

  useEffect(() => {
    const bootApp = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(APP_MODE_KEY);
        setAppMode(savedMode);

        const savedFit = await AsyncStorage.getItem(DEFAULT_FIT_KEY);
        if (savedFit) {
          setDefaultFit(savedFit);
        }

        const lastId = await AsyncStorage.getItem(LAST_VIDEO_ID_KEY);
        setInitialVideoId(lastId);

        if (savedMode === 'auto') {
          // INSTANT RESUME: Load the cached gallery map first to get the UI ready immediately
          const cachedVault = await AsyncStorage.getItem(VAULT_STORAGE_KEY);
          if (cachedVault) {
            setVideos(JSON.parse(cachedVault));
            setLoading(false);
            // Non-blocking background sync to catch new device videos
            silentAutoScanGallery(false);
          } else {
            // First time ever: full scan required
            await silentAutoScanGallery(true);
          }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // silentAutoScanGallery & loadManualVault are stable inner functions

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        if (appMode === 'auto') {
          silentAutoScanGallery(false);
        } else if (appMode === 'manual') {
          loadManualVault();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appMode]); // silentAutoScanGallery & loadManualVault are stable inner functions

  const loadManualVault = async () => {
    try {
      const storedVideos = await AsyncStorage.getItem(VAULT_STORAGE_KEY);
      if (storedVideos) {
        const parsed = JSON.parse(storedVideos);

        // Fetch physically present gallery assets to filter out manually selected videos that have been deleted
        let freshIds = new Set();
        try {
          const freshAssets = await fetchAllGalleryVideos();
          freshIds = new Set(freshAssets.map((v) => v.id));
        } catch (e) {
          console.warn('Could not fetch gallery assets for validation:', e);
        }

        const verifiedVideos = parsed.filter((video) => {
          // If it's a native asset (i.e. not a custom video- uri), verify it still exists physically
          if (video.id && !video.id.startsWith('video-')) {
            return freshIds.has(video.id);
          }
          return true;
        });

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
    // Ensure media permission; prefer cached/native state and only prompt when allowed
    const perm = await require('../utils/mediaPermissions').ensureMediaPermission({ forceRequest: false });
    if (perm !== 'granted') {
      throw new Error('OffReel needs gallery access to populate your Vault.');
    }

    let allAssets = [];
    let hasNextPage = true;
    let endCursor = undefined;

    while (hasNextPage) {
      const result = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.video,
        first: 500, // Balanced size for bridge efficiency and fast scans
        after: endCursor,
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
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

  const silentAutoScanGallery = async (shouldSetLoading = false) => {
    try {
      if (shouldSetLoading) setLoading(true);
      const freshVideos = await fetchAllGalleryVideos();

      // If gallery is empty on device, clear videos and save
      if (freshVideos.length === 0) {
        setVideos([]);
        await AsyncStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify([]));
        return;
      }

      const freshIds = new Set(freshVideos.map((v) => v.id));

      setVideos((prev) => {
        // Filter out cached videos that no longer exist in the physical gallery
        const filteredPrev = prev.filter((v) => freshIds.has(v.id));

        const existingIds = new Set(filteredPrev.map((v) => v.id));
        const newOnes = freshVideos.filter((v) => !existingIds.has(v.id));

        // If nothing was added AND nothing was deleted, preserve reference
        if (newOnes.length === 0 && filteredPrev.length === prev.length) {
          return prev;
        }

        const merged = [...filteredPrev, ...newOnes];

        // Persist the synced result
        AsyncStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(merged)).catch(console.error);

        return merged;
      });
    } catch (err) {
      console.error('Background auto-scan silently failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const autoScanGallery = async () => {
    try {
      setError(null);
      await enableMode('auto');
      await silentAutoScanGallery(true);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const getManualSelectionPool = async (first = 100, after = undefined) => {
    try {
      const perm = await require('../utils/mediaPermissions').ensureMediaPermission({ forceRequest: false });
      if (perm !== 'granted') {
        throw new Error('OffReel needs gallery access.');
      }

      const result = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.video,
        first,
        after,
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      });

      const formatted = result.assets.map((asset, index) => ({
        id: asset.id,
        uri: asset.uri,
        filename: asset.filename || `Scanned Video`,
      }));

      return {
        assets: formatted,
        hasNextPage: result.hasNextPage,
        endCursor: result.endCursor,
      };
    } catch (err) {
      console.error('Failed to load paginated gallery pool:', err);
      return { assets: [], hasNextPage: false, endCursor: undefined };
    }
  };

  const addManualVideos = async (newAssets) => {
    setVideos((prev) => {
      const existingIds = new Set(prev.map((v) => v.id));
      const newUnique = newAssets.filter((v) => !existingIds.has(v.id));
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
    initialVideoId,
    changeDefaultFit,
    getManualSelectionPool,
    addManualVideos,
    autoScanGallery,
    resetVault,
  };
};
