import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectHasOnboarded } from '@/store/slices/authSlice';
import { useAuth } from '@/contexts/AuthContext';
// import { COLORS, TYPOGRAPHY, DIMENSIONS } from '@/constants';

// Temporary constants
const COLORS = {
  primary: '#10B981',
  white: '#FFFFFF',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  error: '#EF4444',
  surface: '#FFFFFF'
};

const TYPOGRAPHY = {
  fontSizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36
  },
  fontWeights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  },
  lineHeights: {
    relaxed: 1.625
  }
};

const DIMENSIONS = {
  paddingS: 8,
  paddingM: 16,
  paddingL: 24,
  paddingXL: 32,
  radiusM: 8
};

// Import new screens - RESTORED
import RydeAnimation from '@/screens/startup/RydeAnimation';
import LoginScreen from '@/screens/auth/LoginScreen';
import HomeScreen from '@/screens/dashboard/HomeScreen';
import ActiveRideScreen from '@/screens/ride/ActiveRideScreen';
import NavigationScreen from '@/screens/navigation/NavigationScreen';
import SettingsScreen from '@/screens/settings/SettingsScreen';
import ProfileScreen from '@/screens/profile/ProfileScreen';
import EarningsScreen from '@/screens/earnings/EarningsScreen';
import TripHistoryScreen from '@/screens/trips/TripHistoryScreen';
import SupportScreen from '@/screens/support/SupportScreen';

const Stack = createNativeStackNavigator();

// All screens now imported from real files

// Placeholder screens - these will be replaced with full implementations
const OnboardingScreen = () => (
  <View style={styles.screenContainer}>
    <Text style={styles.screenTitle}>Welcome to RydeIQ Driver</Text>
    <Text style={styles.screenText}>Onboarding screen will be implemented here</Text>
  </View>
);

// Placeholder screens for development
const SignUpScreen = () => (
  <View style={styles.screenContainer}>
    <Text style={styles.screenTitle}>Join RydeIQ</Text>
    <Text style={styles.screenText}>Driver registration will be implemented here</Text>
  </View>
);

const ForgotPasswordScreen = () => (
  <View style={styles.screenContainer}>
    <Text style={styles.screenTitle}>Reset Password</Text>
    <Text style={styles.screenText}>Password recovery will be implemented here</Text>
  </View>
);



const AppNavigator = () => {
  const reduxIsAuthenticated = useSelector(selectIsAuthenticated);
  const hasOnboarded = useSelector(selectHasOnboarded);
  const { user: authUser, loading: authLoading } = useAuth();

  // Use Firebase auth as primary authentication source
  // Redux state will be synced later in the app lifecycle
  const isAuthenticated = !!authUser;

  // Show startup animation while loading
  if (authLoading) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="RydeAnimation" component={RydeAnimation} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={!hasOnboarded ? "RydeAnimation" : isAuthenticated ? "Home" : "Login"}
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: 'slide_from_right',
      }}
    >
      {/* Startup Animation */}
      <Stack.Screen 
        name="RydeAnimation" 
        component={RydeAnimation}
        options={{
          gestureEnabled: false,
        }}
      />
      
      {/* Onboarding */}
      <Stack.Screen 
        name="Onboarding" 
        component={OnboardingScreen}
        options={{
          gestureEnabled: false,
        }}
      />
      
      {/* Authentication Stack */}
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
      />
      <Stack.Screen 
        name="SignUp" 
        component={SignUpScreen}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen}
      />
      
      {/* Main App */}
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          gestureEnabled: false,
        }}
      />
      
      {/* Ride Screens */}
      <Stack.Screen 
        name="ActiveRide" 
        component={ActiveRideScreen}
      />
      <Stack.Screen 
        name="Navigation" 
        component={NavigationScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      
      {/* Settings Screen */}
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      
      {/* Profile Screen */}
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      
      {/* Earnings Screen */}
      <Stack.Screen 
        name="Earnings" 
        component={EarningsScreen}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      
      {/* Trip History Screen */}
      <Stack.Screen 
        name="TripHistory" 
        component={TripHistoryScreen}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      
      {/* Support Screen */}
      <Stack.Screen 
        name="Support" 
        component={SupportScreen}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DIMENSIONS.paddingL,
  },
  screenTitle: {
    fontSize: TYPOGRAPHY.fontSizes['2xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.primary,
    marginBottom: DIMENSIONS.paddingM,
    textAlign: 'center',
  },
  screenText: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: DIMENSIONS.paddingL,
  },

});

export default AppNavigator; 