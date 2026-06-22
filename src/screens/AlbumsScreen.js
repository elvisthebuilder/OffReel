import * as MediaLibrary from 'expo-media-library';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';

import VaultSkeleton from '../components/VaultSkeleton';

export default function AlbumsScreen() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadAlbums = async () => {
      try {
        setLoading(true);
        const { status, canAskAgain } = await MediaLibrary.getPermissionsAsync();
        let finalStatus = status;
        if (finalStatus !== 'granted' && canAskAgain) {
          const req = await MediaLibrary.requestPermissionsAsync();
          finalStatus = req.status;
        }

        if (finalStatus !== 'granted') {
          throw new Error('Gallery access required to list albums');
        }

        const fetched = await MediaLibrary.getAlbumsAsync();

        // Check each album for presence of at least one video asset.
        const checks = fetched.map(async (alb) => {
          try {
            const assets = await MediaLibrary.getAssetsAsync({
              album: alb.id,
              mediaType: MediaLibrary.MediaType.video,
              first: 1,
            });
            const hasVideos = assets.assets && assets.assets.length > 0;
            const previewUri = hasVideos ? assets.assets[0].uri : null;
            return { ...alb, hasVideos, previewUri };
          } catch (_) {
            return { ...alb, hasVideos: false, previewUri: null };
          }
        });

        const resolved = await Promise.all(checks);
        const nonEmpty = resolved.filter((a) => a.hasVideos);

        if (!mounted) return;
        setAlbums(nonEmpty);
      } catch (err) {
        console.error('Failed to load albums:', err);
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadAlbums();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <VaultSkeleton />;

  if (error)
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Unable to load albums</Text>
        <Text style={styles.sub}>{error}</Text>
      </View>
    );

  if (albums.length === 0)
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>No albums with videos</Text>
        <Text style={styles.sub}>There are no albums containing videos on this device.</Text>
      </View>
    );

  const renderAlbum = ({ item }) => {
    return (
      <View style={styles.card}>
        {item.previewUri ? (
          <Image source={{ uri: item.previewUri }} style={styles.preview} />
        ) : (
          <View style={[styles.preview, styles.previewEmpty]} />
        )}

        <View style={styles.meta}>
          <Text style={styles.albumTitle} numberOfLines={1}>
            {item.title}
          </Text>

          {/* Sorting chips: only render for albums with videos (we filtered empties) */}
          <View style={styles.chipsRow}>
            <TouchableOpacity style={styles.chip} activeOpacity={0.7}>
              <Text style={styles.chipText}>Newest</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chip} activeOpacity={0.7}>
              <Text style={styles.chipText}>Oldest</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chip} activeOpacity={0.7}>
              <Text style={styles.chipText}>Largest</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={albums}
        keyExtractor={(a) => a.id}
        renderItem={renderAlbum}
        contentContainerStyle={{ padding: 12 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  sub: { color: '#999', textAlign: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#0b0b0b',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  preview: { width: 110, height: 80, backgroundColor: '#111' },
  previewEmpty: { alignItems: 'center', justifyContent: 'center' },
  meta: { flex: 1, padding: 12 },
  albumTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  chipsRow: { flexDirection: 'row', gap: 8 },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  chipText: { color: '#ddd', fontSize: 12, fontWeight: '600' },
});
