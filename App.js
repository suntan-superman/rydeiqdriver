// TODO Sign Out functionality

import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, Animated, Easing } from 'react-native';
import { initializeEnvValidation } from '@/utils/validateEnv';

// Validate environment variables at startup
initializeEnvValidation();

// Step 1: Test constants import with safety
let COLORS;
try {
  COLORS = require('@/constants').COLORS || { 
    primary: '#10B981', 
    gray: { 600: '#6B7280' } 
  };
} catch (error) {
  console.warn('Constants import failed, using fallback');
  COLORS = { 
    primary: '#10B981', 
    gray: { 600: '#6B7280' } 
  };
}

// Step 2: Test Redux store setup
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/store';

// Step 3: Test Firebase config with lazy initialization
import '@/services/firebase/config';

// Step 4: Test AuthContext with lazy Firebase imports
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { QueryProvider } from '@/contexts/QueryClientProvider';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import './src/i18n';

// Step 5: Stripe Provider for payment integration (optional for driver app)
let StripeProvider = null;
try {
  StripeProvider = require('@stripe/stripe-react-native').StripeProvider;
} catch (e) {
  console.log('ℹ️ Stripe SDK not installed - using fallback');
  // Fallback component that just renders children
  StripeProvider = ({ children }) => children;
}

// Simple loading component for PersistGate
function SimpleLoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#10B981' }}>
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
          <Text style={styles.appName}>AnyRyde Driver</Text>
          <Text style={styles.tagline}>Your rides. Your rates. Your rules.</Text>
        </Animated.View>
      </View>
    );
  }

  if (!showNavigation) {
    return <SimpleLoadingScreen />;
  }

  // Load navigation safely
  try {
    const { NavigationContainer } = require('@react-navigation/native');
    const AppNavigatorModule = require('@/navigation/AppNavigator');
    const AppNavigator = AppNavigatorModule?.default || AppNavigatorModule;
    
    if (!NavigationContainer) {
      throw new Error('NavigationContainer not available');
    }
    
    if (!AppNavigator) {
      throw new Error('AppNavigator not available - check for import errors in navigation files');
    }
    
    return (
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    );
    
  } catch (error) {
    console.error('Navigation error:', error);
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>❌ Navigation Error</Text>
        <Text style={styles.debugText}>Error: {error?.message || 'Unknown'}</Text>
        <Text style={styles.debugText}>Check console for import errors</Text>
        <Text style={styles.debugText}>Please restart the app</Text>
      </View>
    );
  }
}

export default function App() {
  // Get Stripe publishable key from environment
  const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
  
  return (
    <ErrorBoundary>
      <StripeProvider publishableKey={stripePublishableKey}>
        <Provider store={store}>
          <PersistGate loading={<SimpleLoadingScreen />} persistor={persistor}>
            <ThemeProvider>
              <QueryProvider>
                <AuthProvider>
                  <AppContent />
                </AuthProvider>
              </QueryProvider>
            </ThemeProvider>
          </PersistGate>
        </Provider>
      </StripeProvider>
    </ErrorBoundary>
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
