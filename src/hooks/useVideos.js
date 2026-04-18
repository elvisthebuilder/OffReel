import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';

export const useVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const pickVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsMultipleSelection: true,
        selectionLimit: 20, // Lowering to 20 to prevent enormous arrays at once
        quality: 1,
      });

      if (!result.canceled && result.assets) {
        // Map the image picker assets to what expo-video expects
        const pickedAssets = result.assets.map((asset, index) => ({
          id: asset.assetId || `video-${index}-${Date.now()}`,
          uri: asset.uri,
          filename: asset.fileName || `Selected Video ${index + 1}`,
        }));
        
        // Append or replace? Let's replace for a fresh feed
        setVideos(pickedAssets);
      }
    } catch (err) {
      console.error('Error picking videos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { videos, loading, error, pickVideos };
};
