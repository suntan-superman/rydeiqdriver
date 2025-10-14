import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectHasOnboarded } from '@/store/slices/authSlice';
import { useAuth } from '@/contexts/AuthContext';

// Safe constants import
let COLORS, TYPOGRAPHY, DIMENSIONS;
try {
  const constants = require('@/constants');
  COLORS = constants.COLORS || {};
  TYPOGRAPHY = constants.TYPOGRAPHY || {};
  DIMENSIONS = constants.DIMENSIONS || {};
} catch (error) {
  console.warn('Constants import failed in AppNavigator');
  COLORS = { primary: '#10B981', white: '#FFFFFF' };
  TYPOGRAPHY = {};
  DIMENSIONS = {};
}

// Fallback component for missing screens
const FallbackScreen = ({ route }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
    <Text style={{ fontSize: 18, marginBottom: 10 }}>Screen Not Available</Text>
    <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
      {route?.name || 'Unknown'} screen is temporarily unavailable
    </Text>
  </View>
);

// Safe imports with validation
let HomeScreen, LoginScreen;

try {
  const HomeScreenModule = require('@/screens/dashboard/HomeScreen');
  HomeScreen = HomeScreenModule.default || HomeScreenModule;
  if (!HomeScreen) {
    console.error('HomeScreen import failed - no default export found');
    HomeScreen = FallbackScreen;
  }
} catch (error) {
  console.error('HomeScreen import error:', error);
  HomeScreen = FallbackScreen;
}

try {
  const LoginScreenModule = require('@/screens/auth/LoginScreen');
  LoginScreen = LoginScreenModule.default || LoginScreenModule;
  if (!LoginScreen) {
    console.error('LoginScreen import failed - no default export found');
    LoginScreen = FallbackScreen;
  }
} catch (error) {
  console.error('LoginScreen import error:', error);
  LoginScreen = FallbackScreen;
}
// Import other required screens safely
let SignUpScreen, ForgotPasswordScreen, OnboardingScreen, ActiveRideScreen;
let NavigationScreen, SettingsScreen, ProfileScreen, EarningsScreen;
let TripHistoryScreen, SupportScreen, EmergencyContactScreen, BankingScreen;

try { SignUpScreen = require('@/screens/auth/SignUpScreen').default || FallbackScreen; } catch (e) { SignUpScreen = FallbackScreen; }
try { ForgotPasswordScreen = require('@/screens/auth/ForgotPasswordScreen').default || FallbackScreen; } catch (e) { ForgotPasswordScreen = FallbackScreen; }
try { OnboardingScreen = require('@/screens/auth/OnboardingScreen').default || FallbackScreen; } catch (e) { OnboardingScreen = FallbackScreen; }
try { ActiveRideScreen = require('@/screens/ride/ActiveRideScreen').default || FallbackScreen; } catch (e) { ActiveRideScreen = FallbackScreen; }
try { NavigationScreen = require('@/screens/navigation/NavigationScreen').default || FallbackScreen; } catch (e) { NavigationScreen = FallbackScreen; }
try { 
  SettingsScreen = require('@/screens/settings/SettingsScreen').default || FallbackScreen; 
} catch (e) { 
  console.error('❌ SettingsScreen import error:', e);
  console.error('❌ Error message:', e.message);
  console.error('❌ Error stack:', e.stack);
  SettingsScreen = FallbackScreen; 
}
try { ProfileScreen = require('@/screens/profile/ProfileScreen').default || FallbackScreen; } catch (e) { ProfileScreen = FallbackScreen; }
try { EarningsScreen = require('@/screens/earnings/EarningsScreen').default || FallbackScreen; } catch (e) { EarningsScreen = FallbackScreen; }
try { TripHistoryScreen = require('@/screens/trips/TripHistoryScreen').default || FallbackScreen; } catch (e) { TripHistoryScreen = FallbackScreen; }
try { SupportScreen = require('@/screens/support/SupportScreen').default || FallbackScreen; } catch (e) { SupportScreen = FallbackScreen; }
try { EmergencyContactScreen = require('@/screens/profile/EmergencyContactScreen').default || FallbackScreen; } catch (e) { EmergencyContactScreen = FallbackScreen; }
try { BankingScreen = require('@/screens/settings/BankingScreen').default || FallbackScreen; } catch (e) { BankingScreen = FallbackScreen; }

// Optional imports with fallbacks (these may not exist)
let RydeAnimation, AnalyticsDashboard, DriverToolsDashboard, SustainabilityDashboard;
let CommunityDashboard, SafetyDashboard, CommunicationDashboard, VehicleDashboard;
let PaymentDashboard, DynamicPricingDashboard, GamificationDashboard;
let AccessibilityDashboard, WellnessDashboard, ScheduledRideDashboard;

try {
  RydeAnimation = require('@/screens/startup/RydeAnimation').default;
} catch (e) { RydeAnimation = FallbackScreen; }

try {
  AnalyticsDashboard = require('@/screens/dashboard/AnalyticsDashboard').default;
} catch (e) { AnalyticsDashboard = FallbackScreen; }

try {
  DriverToolsDashboard = require('@/screens/dashboard/DriverToolsDashboard').default;
} catch (e) { DriverToolsDashboard = FallbackScreen; }

try {
  SustainabilityDashboard = require('@/screens/dashboard/SustainabilityDashboard').default;
} catch (e) { SustainabilityDashboard = FallbackScreen; }

try {
  CommunityDashboard = require('@/screens/dashboard/CommunityDashboard').default;
} catch (e) { CommunityDashboard = FallbackScreen; }

try {
  SafetyDashboard = require('@/screens/dashboard/SafetyDashboard').default;
} catch (e) { SafetyDashboard = FallbackScreen; }

try {
  CommunicationDashboard = require('@/screens/dashboard/CommunicationDashboard').default;
} catch (e) { CommunicationDashboard = FallbackScreen; }

try {
  VehicleDashboard = require('@/screens/dashboard/VehicleDashboard').default;
} catch (e) { VehicleDashboard = FallbackScreen; }

try {
  PaymentDashboard = require('@/screens/dashboard/PaymentDashboard').default;
} catch (e) { PaymentDashboard = FallbackScreen; }

try {
  DynamicPricingDashboard = require('@/screens/dashboard/DynamicPricingDashboard').default;
} catch (e) { DynamicPricingDashboard = FallbackScreen; }

try {
  GamificationDashboard = require('@/screens/dashboard/GamificationDashboard').default;
} catch (e) { GamificationDashboard = FallbackScreen; }

try {
  AccessibilityDashboard = require('@/screens/dashboard/AccessibilityDashboard').default;
} catch (e) { AccessibilityDashboard = FallbackScreen; }

try {
  WellnessDashboard = require('@/screens/dashboard/WellnessDashboard').default;
} catch (e) { WellnessDashboard = FallbackScreen; }

try {
  ScheduledRideDashboard = require('@/screens/dashboard/ScheduledRideDashboard').default;
} catch (e) { ScheduledRideDashboard = FallbackScreen; }

const Stack = createNativeStackNavigator();

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
      initialRouteName={isAuthenticated ? "Home" : "Onboarding"}
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
        name="NextSteps"
        component={require('@/screens/auth/NextStepsScreen').default}
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
      <Stack.Screen 
        name="AnalyticsDashboard" 
        component={AnalyticsDashboard}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="DriverToolsDashboard" 
        component={DriverToolsDashboard}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="SustainabilityDashboard" 
        component={SustainabilityDashboard}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="CommunityDashboard" 
        component={CommunityDashboard}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="SafetyDashboard" 
        component={SafetyDashboard}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="CommunicationDashboard" 
        component={CommunicationDashboard}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="VehicleDashboard" 
        component={VehicleDashboard}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="PaymentDashboard" 
        component={PaymentDashboard}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="DynamicPricingDashboard" 
        component={DynamicPricingDashboard}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="GamificationDashboard" 
        component={GamificationDashboard}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="AccessibilityDashboard" 
        component={AccessibilityDashboard}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="WellnessDashboard" 
        component={WellnessDashboard}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="ScheduledRideDashboard" 
        component={ScheduledRideDashboard}
        options={{
          headerShown: false,
          gestureEnabled: true,
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

      
      {/* Emergency Contact Screen */}
      <Stack.Screen 
        name="EmergencyContact" 
        component={EmergencyContactScreen}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />

      {/* Banking Screen */}
      <Stack.Screen 
        name="Banking" 
        component={BankingScreen}
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