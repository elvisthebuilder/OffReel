import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { ensureMediaPermission } from '../utils/mediaPermissions';
import { ChipSkeleton } from './Skeleton';

export default function AlbumChips({ selectedAlbumId, onSelect }) {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);

        const perm = await ensureMediaPermission({ forceRequest: false });
        if (perm !== 'granted') {
          setAlbums([]);
          return;
        }

        const fetched = await MediaLibrary.getAlbumsAsync();

        // Only keep albums that have at least one video
        const checks = fetched.map(async (alb) => {
          try {
            const assets = await MediaLibrary.getAssetsAsync({
              album: alb.id,
              mediaType: MediaLibrary.MediaType.video,
              first: 1,
            });
            const hasVideos = assets.assets && assets.assets.length > 0;
            return hasVideos ? { id: alb.id, title: alb.title } : null;
          } catch (e) {
            return null;
          }
        });

        const resolved = await Promise.all(checks);
        if (!mounted) return;
        setAlbums(resolved.filter(Boolean));
      } catch (err) {
        console.error('Failed to load album chips:', err);
        setAlbums([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading)
    return (
      <View style={styles.loaderRow}>
        <ScrollView horizontal contentContainerStyle={{ paddingHorizontal: 12 }} showsHorizontalScrollIndicator={false}>
          <ChipSkeleton />
          <ChipSkeleton />
          <ChipSkeleton />
        </ScrollView>
      </View>
    );

  if (!albums || albums.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <TouchableOpacity
          style={[styles.chip, !selectedAlbumId && styles.chipActive]}
          onPress={() => onSelect(null)}
          activeOpacity={0.7}>
          <Text style={[styles.text, !selectedAlbumId && styles.textActive]}>All</Text>
        </TouchableOpacity>

        {albums.map((a) => (
          <TouchableOpacity
            key={a.id}
            style={[styles.chip, selectedAlbumId === a.id && styles.chipActive]}
            onPress={() => onSelect(a.id)}
            activeOpacity={0.7}>
            <Text style={[styles.text, selectedAlbumId === a.id && styles.textActive]}>{a.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    zIndex: 300,
    paddingHorizontal: 12,
  },
  row: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  chipActive: {
    backgroundColor: '#fff',
    borderColor: 'rgba(0,0,0,0.08)',
  },
  text: { color: '#ddd', fontSize: 13, fontWeight: '600' },
  textActive: { color: '#000' },
  loaderRow: { position: 'absolute', top: 40, left: 0, right: 0, alignItems: 'center' },
});