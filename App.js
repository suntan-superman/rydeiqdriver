import React, { useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { LogBox, AppState, Platform } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { useFonts } from 'expo-font';
import * as KeepAwake from 'expo-keep-awake';

// Redux Store
import { store, persistor } from '@/store';

// Services
import '@/services/firebase/config';
import { initializeNotifications } from '@/services/notifications';
import { initializeLocationServices } from '@/services/location';

// Contexts
import { AuthProvider } from '@/contexts/AuthContext';

// Navigation
import AppNavigator from '@/navigation/AppNavigator';

// Components
import ErrorBoundary from '@/components/common/ErrorBoundary';
import LoadingScreen from '@/components/common/LoadingScreen';
import NetworkStatus from '@/components/common/NetworkStatus';

// Hooks
import { useAppState } from '@/hooks/useAppState';
import { useNetworkState } from '@/hooks/useNetworkState';

// Constants
import { COLORS } from '@/constants';

// Ignore specific warnings for cleaner development
LogBox.ignoreLogs([
  'Warning: AsyncStorage has been extracted from react-native',
  'Setting a timer for a long period',
  'VirtualizedLists should never be nested',
  'Require cycle:'
]);

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  // Load custom fonts
  const [fontsLoaded] = useFonts({
    'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('./assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('./assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
  });

  // App initialization
  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      try {
        // Initialize core services
        await initializeNotifications();
        await initializeLocationServices();
        
        // Keep screen awake during rides (this will be controlled by app state)
        if (__DEV__) {
          KeepAwake.activateKeepAwake();
        }
        
        // Hide splash screen
        await SplashScreen.hideAsync();
      } catch (error) {
        console.error('App initialization error:', error);
        await SplashScreen.hideAsync();
      }
    }
  }, [fontsLoaded]);

  // Don't render anything until fonts are loaded
  if (!fontsLoaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <Provider store={store}>
            <PersistGate loading={<LoadingScreen />} persistor={persistor}>
              <AuthProvider>
                <AppContent onReady={onLayoutRootView} />
              </AuthProvider>
            </PersistGate>
          </Provider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

// Main app content component
function AppContent({ onReady }) {
  // Custom hooks for app state management
  useAppState();
  useNetworkState();

  return (
    <NavigationContainer onReady={onReady}>
      <StatusBar 
        style="auto" 
        backgroundColor={COLORS.primary}
        translucent={Platform.OS === 'android'}
      />
      <NetworkStatus />
      <AppNavigator />
    </NavigationContainer>
  );
}
