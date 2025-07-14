import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSelector } from 'react-redux';
import { selectIsConnected } from '@/store/slices/appSlice';
import { COLORS, TYPOGRAPHY, DIMENSIONS } from '@/constants';

const NetworkStatus = () => {
  const isConnected = useSelector(selectIsConnected);
  const [animatedValue] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (!isConnected) {
      // Show the offline banner
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Hide the offline banner
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isConnected, animatedValue]);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 0],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  if (isConnected) {
    return null;
  }

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        }
      ]}
    >
      <Text style={styles.text}>No Internet Connection</Text>
      <Text style={styles.subtext}>Please check your connection and try again</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.error,
    paddingTop: 40, // Account for status bar
    paddingBottom: DIMENSIONS.paddingS,
    paddingHorizontal: DIMENSIONS.paddingM,
    zIndex: 1000,
    elevation: 1000,
  },
  text: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    textAlign: 'center',
  },
  subtext: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSizes.xs,
    textAlign: 'center',
    marginTop: 2,
    opacity: 0.9,
  },
});

export default NetworkStatus; 