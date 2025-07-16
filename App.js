import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, Animated, Easing } from 'react-native';

// Step 1: Test constants import
import { COLORS } from '@/constants';

// Step 2: Test Redux store setup
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/store';

// Step 3: Test Firebase config with lazy initialization
import '@/services/firebase/config';

// Step 4: Test AuthContext with lazy Firebase imports
import { AuthProvider } from '@/contexts/AuthContext';

// Simple loading component for PersistGate
function SimpleLoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary[500] }}>
      <Text style={{ color: 'white', fontSize: 18 }}>Get Ready...</Text>
    </View>
  );
}

function AppContent() {
  const [animationComplete, setAnimationComplete] = useState(false);
  const [showNavigation, setShowNavigation] = useState(false);
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.bounce,
        useNativeDriver: true,
      }),
    ]);

    animation.start(() => {
      setTimeout(() => {
        setAnimationComplete(true);
        
        // Show navigation after animation
        setTimeout(() => {
          setShowNavigation(true);
        }, 1000);
      }, 1000);
    });
  }, []);

  if (!animationComplete) {
    return (
      <View style={styles.splashContainer}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Image
            source={require('./assets/splash-icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>RydeIQ Driver</Text>
          <Text style={styles.tagline}>Your rides. Your rates. Your rules.</Text>
        </Animated.View>
      </View>
    );
  }

  if (!showNavigation) {
    return <SimpleLoadingScreen />;
  }

  // Load navigation
  try {
    const NavigationLibrary = require('@react-navigation/native');
    const { NavigationContainer } = NavigationLibrary;
    const AppNavigatorModule = require('@/navigation/AppNavigator');
    const AppNavigator = AppNavigatorModule.default;
    
    return (
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    );
    
  } catch (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>❌ Navigation Error</Text>
        <Text style={styles.debugText}>Please restart the app</Text>
      </View>
    );
  }
}

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={<SimpleLoadingScreen />} persistor={persistor}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </PersistGate>
    </Provider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
        padding: 20,
  },
  errorText: {
    fontSize: 20,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  debugText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 10,
  },
});
