import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

/**
 * Stripe Connect Onboarding Component for Driver Mobile App
 * Handles driver payout setup and identity verification via Stripe Connect
 * 
 * Usage:
 * <StripeConnectOnboarding
 *   onboardingComplete={() => console.log('Onboarding complete!')}
 * />
 */
const StripeConnectOnboarding = ({ onboardingComplete }) => {
  const [loading, setLoading] = useState(false);
  const [accountStatus, setAccountStatus] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      setCheckingStatus(true);
      
      // In a real app, you'd check the driver's payment status from Firestore
      // For now, we'll assume they need onboarding
      setAccountStatus({
        hasAccount: false,
        paymentStatus: 'not_started',
        payoutsEnabled: false,
      });

    } catch (error) {
      console.error('❌ Error checking status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const startOnboarding = async () => {
    try {
      setLoading(true);

      const functions = getFunctions();
      const createAccountFn = httpsCallable(functions, 'createDriverConnectAccount');

      const result = await createAccountFn({
        refreshUrl: 'anyryde-driver://payment/onboarding/refresh',
        returnUrl: 'anyryde-driver://payment/onboarding/complete',
      });

      if (result.data.success && result.data.onboardingUrl) {
        const url = result.data.onboardingUrl;
        
        // Check if URL can be opened
        const canOpen = await Linking.canOpenURL(url);
        
        if (canOpen) {
          await Linking.openURL(url);
          
          Toast.show({
            type: 'info',
            text1: 'Onboarding Started',
            text2: 'Complete the verification in your browser',
          });
        } else {
          throw new Error('Cannot open onboarding URL');
        }
      } else {
        throw new Error('Failed to create onboarding link');
      }

    } catch (error) {
      console.error('❌ Error starting onboarding:', error);
      Alert.alert(
        'Onboarding Error',
        'Failed to start payment setup. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleContinueOnboarding = () => {
    Alert.alert(
      'Continue Verification',
      'You\'ll need to complete your identity verification with Stripe to receive payments.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: startOnboarding },
      ]
    );
  };

  if (checkingStatus) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Checking payment status...</Text>
        </View>
      </View>
    );
  }

  // If onboarding is complete
  if (accountStatus?.paymentStatus === 'active' && accountStatus?.payoutsEnabled) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color="#10B981" />
          </View>
          <Text style={styles.successTitle}>Payment Setup Complete! 🎉</Text>
          <Text style={styles.successMessage}>
            You're all set to receive payments. Earnings will be automatically transferred to your bank account.
          </Text>
          
          <TouchableOpacity
            style={styles.doneButton}
            onPress={onboardingComplete}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Onboarding needed
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="wallet" size={48} color="#10B981" />
          </View>
          <Text style={styles.title}>Setup Payment Account</Text>
          <Text style={styles.subtitle}>
            Connect your bank account to receive earnings from rides
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <Ionicons name="flash" size={24} color="#10B981" />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Instant Deposits</Text>
              <Text style={styles.featureDescription}>
                Get your earnings deposited automatically
              </Text>
            </View>
          </View>

          <View style={styles.feature}>
            <Ionicons name="shield-checkmark" size={24} color="#10B981" />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Secure Verification</Text>
              <Text style={styles.featureDescription}>
                Bank-level security powered by Stripe
              </Text>
            </View>
          </View>

          <View style={styles.feature}>
            <Ionicons name="card" size={24} color="#10B981" />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Direct Transfers</Text>
              <Text style={styles.featureDescription}>
                Funds go straight to your bank account
              </Text>
            </View>
          </View>

          <View style={styles.feature}>
            <Ionicons name="analytics" size={24} color="#10B981" />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Earnings Dashboard</Text>
              <Text style={styles.featureDescription}>
                Track your earnings in real-time
              </Text>
            </View>
          </View>
        </View>

        {/* What You'll Need */}
        <View style={styles.requirementsContainer}>
          <Text style={styles.requirementsTitle}>What You'll Need:</Text>
          <View style={styles.requirement}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.requirementText}>Social Security Number (SSN)</Text>
          </View>
          <View style={styles.requirement}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.requirementText}>Date of Birth</Text>
          </View>
          <View style={styles.requirement}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.requirementText}>Bank Account Details</Text>
          </View>
          <View style={styles.requirement}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.requirementText}>Valid Government ID</Text>
          </View>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <Text style={styles.infoText}>
            This process takes about 5 minutes. Your information is securely encrypted and never shared.
          </Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.startButton, loading && styles.startButtonDisabled]}
          onPress={startOnboarding}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Text style={styles.startButtonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="#ffffff" />
            </>
          )}
        </TouchableOpacity>

        {/* Skip Option */}
        <TouchableOpacity style={styles.skipButton} onPress={() => {
          Alert.alert(
            'Skip Payment Setup',
            'You won\'t be able to receive payments until you complete this setup. You can always do this later from Settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Skip for Now', onPress: onboardingComplete },
            ]
          );
        }}>
          <Text style={styles.skipButtonText}>Skip for Now</Text>
        </TouchableOpacity>

        {/* Powered by Stripe */}
        <View style={styles.stripeBadge}>
          <Text style={styles.poweredByText}>Powered by</Text>
          <Text style={styles.stripeText}>Stripe</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  doneButton: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    backgroundColor: '#10B981',
    borderRadius: 12,
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureText: {
    flex: 1,
    marginLeft: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  requirementsContainer: {
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  requirementText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#374151',
  },
  infoBanner: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 20,
  },
  startButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    backgroundColor: '#10B981',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  startButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  stripeBadge: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  poweredByText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  stripeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#635bff',
  },
});

export default StripeConnectOnboarding;

