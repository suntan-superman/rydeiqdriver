import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectHasOnboarded } from '@/store/slices/authSlice';
import { useAuth } from '@/contexts/AuthContext';
import { COLORS, TYPOGRAPHY, DIMENSIONS } from '@/constants';

// Import new screens
import RydeAnimation from '@/screens/startup/RydeAnimation';
import LoginScreen from '@/screens/auth/LoginScreen';

const Stack = createNativeStackNavigator();

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

const HomeScreen = () => (
  <View style={styles.screenContainer}>
    <Text style={styles.screenTitle}>RydeIQ Driver Dashboard</Text>
    <Text style={styles.screenText}>Main driver dashboard will be implemented here</Text>
    <Text style={styles.screenSubtext}>
      🚗 Ready to start earning?{'\n'}
      📱 Your bidding system awaits{'\n'}
      📍 Location services active{'\n'}
      💰 Track your earnings in real-time
    </Text>
  </View>
);

const AppNavigator = () => {
  const reduxIsAuthenticated = useSelector(selectIsAuthenticated);
  const hasOnboarded = useSelector(selectHasOnboarded);
  const { user: authUser, loading: authLoading } = useAuth();

  // Combine Firebase auth with Redux state
  const isAuthenticated = authUser && reduxIsAuthenticated;

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
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  screenSubtext: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.lineHeights.relaxed * TYPOGRAPHY.fontSizes.sm,
  },
});

export default AppNavigator; 