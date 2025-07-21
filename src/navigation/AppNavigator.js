import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectHasOnboarded } from '@/store/slices/authSlice';
import { useAuth } from '@/contexts/AuthContext';
import { COLORS, TYPOGRAPHY, DIMENSIONS } from '@/constants';

// Import new screens - RESTORED
import RydeAnimation from '@/screens/startup/RydeAnimation';
import LoginScreen from '@/screens/auth/LoginScreen';
import SignUpScreen from '@/screens/auth/SignUpScreen';
import ForgotPasswordScreen from '@/screens/auth/ForgotPasswordScreen';
import OnboardingScreen from '@/screens/auth/OnboardingScreen';
import HomeScreen from '@/screens/dashboard/HomeScreen';
import ActiveRideScreen from '@/screens/ride/ActiveRideScreen';
import NavigationScreen from '@/screens/navigation/NavigationScreen';
import SettingsScreen from '@/screens/settings/SettingsScreen';
import ProfileScreen from '@/screens/profile/ProfileScreen';
import EarningsScreen from '@/screens/earnings/EarningsScreen';
import TripHistoryScreen from '@/screens/trips/TripHistoryScreen';
import SupportScreen from '@/screens/support/SupportScreen';
import EmergencyContactScreen from '@/screens/profile/EmergencyContactScreen';

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
      <Stack.Screen
        name="Banking"
        component={require('@/screens/settings/BankingScreen').default}
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