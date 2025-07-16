import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { MaterialIcons, AntDesign, Ionicons } from '@expo/vector-icons';
// import { COLORS } from '@/constants';

// Temporary constants
const COLORS = {
  primary: {
    50: '#ECFDF5',
    200: '#A7F3D0',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857'
  },
  secondary: {
    200: '#E5E7EB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    900: '#111827'
  },
  background: {
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6'
  },
  text: {
    primary: '#111827',
    secondary: '#6B7280'
  },
  white: '#FFFFFF',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  error: '#EF4444',
  surface: '#FFFFFF'
};
import { useAuth } from '@/contexts/AuthContext';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { signIn, loadSavedCredentials, saveCredentials, clearSavedCredentials } = useAuth();

  // Load saved credentials when component mounts
  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const result = await loadSavedCredentials();
        if (result.success && result.credentials) {
          setEmail(result.credentials.email);
          setPassword(result.credentials.password);
        }
      } catch (error) {
        // No saved credentials found
      }
    };
    
    loadCredentials();
  }, [loadSavedCredentials]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn(email, password);
      if (result.success) {
        // Save credentials for next time
        await saveCredentials(email, password);
        
        // Navigation will be handled by AuthContext state change
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      } else {
        Alert.alert(
          'Login Failed', 
          result.error?.message || 'Invalid email or password. Please try again.'
        );
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpNavigation = () => {
    navigation.navigate('SignUp');
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleClearCredentials = async () => {
    try {
      const result = await clearSavedCredentials();
      if (result.success) {
        setEmail('');
        setPassword('');
        Alert.alert('Success', 'Saved credentials cleared successfully!');
      } else {
        Alert.alert('Error', 'Failed to clear credentials');
      }
    } catch (error) {
      console.error('Error clearing credentials:', error);
      Alert.alert('Error', 'Error clearing credentials');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="car-sport" size={32} color={COLORS.white} />
            </View>
          </View>
          <Text style={styles.logoText}>
            <Text style={styles.rydeText}>RYDE</Text>
            <Text style={styles.iqText}>IQ</Text>
          </Text>
          <Text style={styles.driverText}>DRIVER</Text>
          <Text style={styles.taglineText}>Drive. Earn. Succeed.</Text>
        </View>

        {/* Auto-fill Notice */}
        {email && password && (
          <View style={styles.autoFillNotice}>
            <MaterialIcons name="check-circle" size={16} color={COLORS.primary[600]} />
            <Text style={styles.autoFillText}>Credentials auto-filled</Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <MaterialIcons
              name="email"
              size={20}
              color={COLORS.secondary[500]}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Driver Email"
              placeholderTextColor={COLORS.secondary[400]}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              accessibilityLabel="Email input"
              accessibilityHint="Enter your registered driver email address"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <AntDesign
              name="lock1"
              size={20}
              color={COLORS.secondary[500]}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Password"
              placeholderTextColor={COLORS.secondary[400]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              accessibilityLabel="Password input"
              accessibilityHint="Enter your account password"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
              accessibilityLabel={showPassword ? "Hide password" : "Show password"}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color={COLORS.secondary[500]}
              />
            </TouchableOpacity>
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity 
            style={styles.forgotPasswordLink}
            onPress={handleForgotPassword}
            disabled={isLoading}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            accessibilityLabel="Login button"
            accessibilityHint="Tap to sign in to your driver account"
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Text>
            {!isLoading && (
              <Ionicons name="arrow-forward" size={20} color={COLORS.secondary[900]} />
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <TouchableOpacity 
            style={styles.signUpLink}
            onPress={handleSignUpNavigation}
            disabled={isLoading}
          >
            <Text style={styles.signUpText}>
              New driver? <Text style={styles.signUpTextBold}>Join RydeIQ</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Features Info */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Ionicons name="cash" size={20} color={COLORS.primary[500]} />
            <Text style={styles.featureText}>Set Your Own Rates</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="time" size={20} color={COLORS.primary[500]} />
            <Text style={styles.featureText}>Flexible Schedule</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="trending-up" size={20} color={COLORS.primary[500]} />
            <Text style={styles.featureText}>Higher Earnings</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footerContainer}>
          {/* Debug: Clear Credentials Button */}
          {__DEV__ && (
            <TouchableOpacity 
              style={styles.debugButton}
              onPress={handleClearCredentials}
              disabled={isLoading}
            >
              <Text style={styles.debugButtonText}>🧹 Clear Saved Credentials</Text>
            </TouchableOpacity>
          )}
          
          <Text style={styles.termsText}>
            By signing in, you agree to our{' '}
            <Text style={styles.linkText}>Terms of Service</Text> and{' '}
            <Text style={styles.linkText}>Privacy Policy</Text>
          </Text>
          <Text style={styles.copyrightText}>
            RydeIQ Driver © 2025
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  rydeText: {
    color: COLORS.primary[500],
  },
  iqText: {
    color: COLORS.secondary[900],
  },
  driverText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary[600],
    letterSpacing: 2,
    marginBottom: 8,
  },
  taglineText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.secondary[700],
    textAlign: 'center',
  },
  autoFillNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary[50],
    borderColor: COLORS.primary[200],
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
  },
  autoFillText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary[700],
    marginLeft: 8,
  },
  formContainer: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.secondary[200],
    marginBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: COLORS.text.primary,
    paddingVertical: 16,
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: COLORS.primary[500],
    fontWeight: '500',
  },
  actionContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary[500],
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.secondary[900],
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
    marginBottom: 20,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.secondary[900],
    marginRight: 8,
  },
  signUpLink: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  signUpText: {
    fontSize: 16,
    color: COLORS.secondary[600],
    textAlign: 'center',
  },
  signUpTextBold: {
    fontWeight: 'bold',
    color: COLORS.primary[500],
  },
  featuresContainer: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: 12,
    fontWeight: '500',
  },
  footerContainer: {
    alignItems: 'center',
  },
  debugButton: {
    backgroundColor: COLORS.background.tertiary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  debugButtonText: {
    fontSize: 12,
    color: COLORS.secondary[600],
    fontWeight: '500',
  },
  termsText: {
    fontSize: 12,
    color: COLORS.secondary[500],
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  linkText: {
    color: COLORS.primary[500],
    fontWeight: '500',
  },
  copyrightText: {
    fontSize: 12,
    color: COLORS.secondary[400],
    fontWeight: '400',
  },
});

export default LoginScreen; 