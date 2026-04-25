import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import HomeScreen from './src/screens/HomeScreen';

export default function App() {
  // Pre-load the Ionicons font so ALL icons render correctly in production APK
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  // Do not render the UI until fonts are confirmed available
  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="light" />
        <HomeScreen />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
