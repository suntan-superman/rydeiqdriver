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
import { COLORS } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { playSuccessSound, playErrorSound } from '@/utils/soundEffects';
import * as LocalAuthentication from 'expo-local-authentication';
import { useSelector } from 'react-redux';
// Removed CheckBox import - using custom checkbox instead

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const { signIn, loadSavedCredentials, saveCredentials, clearSavedCredentials } = useAuth();

  const biometricEnabled = useSelector(state => state.app.settings.biometricAuth !== false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [credentialsStored, setCredentialsStored] = useState(false);

  // Load saved credentials when component mounts
  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const result = await loadSavedCredentials();
        if (result.success && result.credentials) {
          setEmail(result.credentials.email);
          setPassword(result.credentials.password);
          setRememberMe(true);
        } else {
          setRememberMe(false);
        }
      } catch (error) {
        setRememberMe(false);
      }
    };
    
    loadCredentials();
  }, [loadSavedCredentials]);

  useEffect(() => {
    const checkBiometrics = async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricSupported(compatible && enrolled);
    };
    checkBiometrics();
  }, []);

  useEffect(() => {
    const checkCredentials = async () => {
      const result = await loadSavedCredentials();
      setCredentialsStored(result.success && !!result.credentials?.email && !!result.credentials?.password);
    };
    checkCredentials();
  }, [loadSavedCredentials]);

  const handleLogin = async () => {
    if (!email || !password) {
      playErrorSound();
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      playErrorSound();
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn(email, password);
      if (result.success) {
        // Save or clear credentials based on Remember Me
        if (rememberMe) {
          await saveCredentials(email, password);
        } else {
          await clearSavedCredentials();
        }
        // Play success sound
        playSuccessSound();
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      } else {
        playErrorSound();
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

  const handleBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login with Biometrics',
        fallbackLabel: 'Enter Password',
      });
      if (result.success) {
        // Use stored credentials to login
        const creds = await loadSavedCredentials();
        if (creds.success && creds.credentials) {
          setEmail(creds.credentials.email);
          setPassword(creds.credentials.password);
          handleLogin();
        }
      } else {
        playErrorSound();
        Alert.alert('Authentication Failed', 'Biometric authentication was not successful.');
      }
    } catch (error) {
      playErrorSound();
      Alert.alert('Error', 'Biometric authentication failed.');
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
            <Text style={styles.rydeText}>ANY</Text>
            <Text style={styles.iqText}>RYDE</Text>
          </Text>
          <Text style={styles.driverText}>DRIVER</Text>
          <Text style={styles.taglineText}>Drive. Earn. Succeed.</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <MaterialIcons
              name="email"
              size={20}
              color={COLORS.gray500}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Driver Email"
              placeholderTextColor={COLORS.gray400}
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
              color={COLORS.gray500}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Password"
              placeholderTextColor={COLORS.gray400}
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
                color={COLORS.gray500}
              />
            </TouchableOpacity>
          </View>

          {/* Remember Me and Forgot Password Row */}
          <View style={styles.rememberForgotRow}>
            <View style={styles.rememberMeRow}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[
                  styles.checkbox,
                  rememberMe && styles.checkboxChecked
                ]}>
                  {rememberMe && (
                    <Ionicons name="checkmark" size={16} color={COLORS.white} />
                  )}
                </View>
              </TouchableOpacity>
              <Text style={styles.rememberMeText}>Remember Me</Text>
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
        </View>

        {/* Biometric Login Button */}
        {biometricEnabled && biometricSupported && credentialsStored && (
          <TouchableOpacity style={styles.biometricButton} onPress={handleBiometricLogin}>
            <Ionicons name="finger-print" size={24} color={COLORS.primary[500]} />
            <Text style={styles.biometricButtonText}>Login with Biometrics</Text>
          </TouchableOpacity>
        )}

        

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
              <Ionicons name="arrow-forward" size={20} color={COLORS.gray900} />
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <TouchableOpacity 
            style={styles.signUpLink}
            onPress={handleSignUpNavigation}
            disabled={isLoading}
          >
            <Text style={styles.signUpText}>
              New driver? <Text style={styles.signUpTextBold}>Join AnyRyde</Text>
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

        {/* Spacer to push footer to bottom */}
        <View style={styles.spacer} />

        {/* Footer */}
        <View style={styles.footerContainer}>
          {/* Debug: Clear Credentials Button */}
          {/* {__DEV__ && (
            <TouchableOpacity 
              style={styles.debugButton}
              onPress={handleClearCredentials}
              disabled={isLoading}
            >
              <Text style={styles.debugButtonText}>🧹 Clear Saved Credentials</Text>
            </TouchableOpacity>
          )} */}
          
          <Text style={styles.termsText}>
            By signing in, you agree to our{' '}
            <Text style={styles.linkText}>Terms of Service</Text> and{' '}
            <Text style={styles.linkText}>Privacy Policy</Text>
          </Text>
          <Text style={styles.copyrightText}>
            AnyRyde Driver © 2025
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
    color: COLORS.gray900,
  },
  driverText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray600,
    letterSpacing: 2,
    marginBottom: 8,
  },
  taglineText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray700,
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.gray200,
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
    color: COLORS.textPrimary,
    paddingVertical: 16,
  },
  eyeIcon: {
    padding: 4,
  },
  rememberForgotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  forgotPasswordLink: {
    paddingVertical: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: COLORS.primary[500],
    fontWeight: '500',
  },
  actionContainer: {
    alignItems: 'center',
    marginBottom: 6,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary[500],
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.gray900,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
    marginBottom: 6,
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
    color: COLORS.gray600,
    textAlign: 'center',
  },
  signUpTextBold: {
    fontWeight: 'bold',
    color: COLORS.primary[500],
  },
  featuresContainer: {
    backgroundColor: COLORS.gray100,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  spacer: {
    flex: 1,
    minHeight: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 12,
    fontWeight: '500',
  },
  footerContainer: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  debugButton: {
    backgroundColor: COLORS.gray200,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  debugButtonText: {
    fontSize: 12,
    color: COLORS.gray600,
    fontWeight: '500',
  },
  termsText: {
    fontSize: 12,
    color: COLORS.gray500,
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
    color: COLORS.gray400,
    fontWeight: '400',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary[100],
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary[200],
    minWidth: 200,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  biometricButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary[700],
    marginLeft: 10,
  },
  rememberMeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxContainer: {
    marginRight: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.gray400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary[500],
    borderColor: COLORS.primary[500],
  },
  rememberMeText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },

});

export default LoginScreen; 