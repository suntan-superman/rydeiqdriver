import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
// import { COLORS, TYPOGRAPHY, DIMENSIONS } from '@/constants';

// Temporary constants
const COLORS = {
  primary: { 500: '#10B981' },
  white: '#FFFFFF',
  textPrimary: '#111827'
};

const TYPOGRAPHY = {
  fontSizes: {
    base: 16
  }
};

const DIMENSIONS = {
  paddingL: 24
};

const LoadingScreen = ({ message = 'Loading...', showMessage = true }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator 
          size="large" 
          color={COLORS.primary[500]} 
          style={styles.spinner}
        />
        {showMessage && (
          <Text style={styles.message}>{message}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  spinner: {
    marginBottom: DIMENSIONS.paddingL,
  },
  message: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default LoadingScreen; 