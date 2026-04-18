import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';

export const useVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

      setVideos(formattedAssets);
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
        selectionLimit: 20,
        quality: 1,
      });

      if (!result.canceled && result.assets) {
        const pickedAssets = result.assets.map((asset, index) => ({
          id: asset.assetId || `video-${index}-${Date.now()}`,
          uri: asset.uri,
          filename: asset.fileName || `Selected Video ${index + 1}`,
        }));
        setVideos(pickedAssets);
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
