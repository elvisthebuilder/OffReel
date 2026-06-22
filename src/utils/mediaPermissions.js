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

    if (native.status === 'granted') {
      await cachePermission('granted');
      return 'granted';
    }

    // If permission was explicitly denied and we can't ask again, return 'denied'
    if (native.status === 'denied' || (!native.canAskAgain && native.status === 'denied')) {
      await cachePermission('denied');
      return 'denied';
    }

    // If never asked before (undetermined) or canAskAgain, prompt for permission
    if (native.canAskAgain || native.status === 'undetermined') {
      try {
        const requested = await MediaLibrary.requestPermissionsAsync();
        const final = requested.status || 'denied';
        await cachePermission(final);
        return final;
      } catch (e) {
        console.warn('Failed to request media permission:', e);
        await cachePermission('denied');
        return 'denied';
      }
    }
    
    // User previously denied (canAskAgain is false) - return 'denied'
    await cachePermission('denied');
    return 'denied';
  } catch (e) {
    console.warn('ensureMediaPermission failed:', e);
    return 'denied';
  }
}
