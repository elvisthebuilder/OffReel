import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library';

const PERM_KEY = '@offreel_media_permission_status';

// Read cached permission status (if any)
export async function readCachedPermission() {
  try {
    const v = await AsyncStorage.getItem(PERM_KEY);
    if (!v) return null;
    return v; // 'granted' | 'denied' | 'undetermined'
  } catch (e) {
    console.warn('Failed to read cached media permission:', e);
    return null;
  }
}

// Cache permission status string
async function cachePermission(status) {
  try {
    await AsyncStorage.setItem(PERM_KEY, status);
  } catch (e) {
    console.warn('Failed to cache media permission:', e);
  }
}

// Get current permission (from native) without prompting
export async function getNativePermission() {
  try {
    const { status } = await MediaLibrary.getPermissionsAsync();
    return status; // 'granted' | 'denied' | 'undetermined'
  } catch (e) {
    console.warn('Failed to query native media permission:', e);
    return null;
  }
}

// Ensure we have permission; will only prompt when forceRequest === true or when native canAskAgain is true
export async function ensureMediaPermission({ forceRequest = false } = {}) {
  try {
    // Ask native for current state first to check if we've never asked before (undetermined)
    const native = await MediaLibrary.getPermissionsAsync();

    // If never asked before (undetermined) and not forceRequest, we should still prompt
    const shouldForceRequest = native.status === 'undetermined' && !forceRequest;

    if (native.status === 'granted') {
      await cachePermission('granted');
      return 'granted';
    }

    // If we shouldn't prompt, return the current native status
    if (!shouldForceRequest && !native.canAskAgain) {
      // Cache the status for future reads
      await cachePermission(native.status || 'denied');
      return native.status || 'denied';
    }

    // We are allowed to ask — either forceRequest was true, canAskAgain is true, or it's first time (undetermined)
    try {
      const requested = await MediaLibrary.requestPermissionsAsync();
      const final = requested.status || native.status || 'denied';
      await cachePermission(final);
      return final;
    } catch (e) {
      console.warn('Failed to request media permission:', e);
      // fallback to native.status
      await cachePermission(native.status || 'denied');
      return native.status || 'denied';
    }
  } catch (e) {
    console.warn('ensureMediaPermission failed:', e);
    return 'denied';
  }
}
