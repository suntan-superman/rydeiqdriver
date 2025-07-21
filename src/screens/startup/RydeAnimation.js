import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
  Text,
  Pressable,
  BackHandler,
  AccessibilityInfo,
  Animated,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';

// Get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Animation Configuration
const ANIMATION_CONFIG = {
  LETTER_DELAY: 100,
  LETTER_DURATION: 300,
  LOGO_DURATION: 800,
  FADE_DURATION: 600,
  PROGRESS_DURATION: 3000,
  AUTO_NAVIGATE_DELAY: 5000,
  PHASE_DURATION: 750,
};

// Brand Configuration
const BRAND_CONFIG = {
  PRIMARY_WORD: "RYDEIQ",
  SECONDARY_WORD: "WORKSIDE SOFTWARE",
  TAGLINE: "Your rides. Your rates. Your rules.",
  PRIMARY_COLOR: COLORS.primary[500], // Enhanced green
  SECONDARY_COLOR: COLORS.white,
  ACCENT_COLOR: COLORS.primary[400],
  BACKGROUND_GRADIENT: {
    start: COLORS.secondary[800],
    end: COLORS.secondary[900],
  },
};

// Loading States
const LOADING_PHASES = [
  { id: 1, text: "Initializing...", duration: 800 },
  { id: 2, text: "Loading Resources...", duration: 1000 },
  { id: 3, text: "Setting Up Interface...", duration: 800 },
  { id: 4, text: "Almost Ready...", duration: 600 },
];

/**
 * Enhanced letter animation component with native animations
 */
const LetterAnimation = React.memo(({
  letter,
  index,
  color,
  fontSize,
  startDelay,
  onAnimationComplete
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const animationDelay = startDelay + (index * ANIMATION_CONFIG.LETTER_DELAY);

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: ANIMATION_CONFIG.LETTER_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(translateAnim, {
          toValue: 0,
          duration: ANIMATION_CONFIG.LETTER_DURATION,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: ANIMATION_CONFIG.LETTER_DURATION / 2,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: ANIMATION_CONFIG.LETTER_DURATION / 2,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Notify completion for the last letter
      if (onAnimationComplete && index === 0) {
        setTimeout(() => {
          onAnimationComplete();
        }, ANIMATION_CONFIG.LETTER_DURATION);
      }
    }, animationDelay);

    return () => clearTimeout(timer);
  }, [index, startDelay, onAnimationComplete]);

  return (
    <Animated.Text
      style={[
        styles.letter,
        {
          color,
          fontSize,
          opacity: fadeAnim,
          transform: [
            { translateY: translateAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
      accessibilityLabel={letter === ' ' ? 'space' : letter}
    >
      {letter}
    </Animated.Text>
  );
});

/**
 * Animated word component with enhanced effects
 */
const WordAnimation = React.memo(({
  word,
  color,
  fontSize,
  startDelay,
  onComplete
}) => {
  return (
    <View style={styles.wordContainer}>
      {word.split("").map((letter, index) => (
        <LetterAnimation
          key={`${word}-${index}`}
          letter={letter}
          index={word.length - 1 - index} // Reverse order for right-to-left effect
          color={color}
          fontSize={fontSize}
          startDelay={startDelay}
          onAnimationComplete={index === word.length - 1 ? onComplete : null}
        />
      ))}
    </View>
  );
});

/**
 * Animated logo reveal component
 */
const LogoReveal = React.memo(({ visible, onComplete }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(-180)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: ANIMATION_CONFIG.LOGO_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: ANIMATION_CONFIG.FADE_DURATION,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        onComplete?.();
      }, ANIMATION_CONFIG.LOGO_DURATION);
    }
  }, [visible, onComplete]);

  if (!visible) return null;

  const rotate = rotateAnim.interpolate({
    inputRange: [-180, 0],
    outputRange: ['-180deg', '0deg'],
  });

  return (
    <Animated.View
      style={[
        styles.logoContainer,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { rotate },
          ],
        },
      ]}
    >
      <View style={styles.logoCircle}>
        <Ionicons 
          name="car-sport" 
          size={40} 
          color={BRAND_CONFIG.SECONDARY_COLOR} 
        />
      </View>
    </Animated.View>
  );
});

/**
 * Progress indicator component with percentage
 */
const ProgressIndicator = React.memo(({ visible, onComplete }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [currentPhase, setCurrentPhase] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!visible) return;

    // Fade in the progress container
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: ANIMATION_CONFIG.FADE_DURATION,
      useNativeDriver: true,
    }).start();

    // Animate through all phases
    const animatePhases = async () => {
      for (let i = 0; i < LOADING_PHASES.length; i++) {
        setCurrentPhase(i);

        // Animate progress bar for this phase
        const targetProgress = ((i + 1) / LOADING_PHASES.length) * 100;

        Animated.timing(progressAnim, {
          toValue: targetProgress,
          duration: LOADING_PHASES[i].duration,
          useNativeDriver: false,
        }).start();

        // Update progress text
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            const newProgress = Math.min(prev + 2, targetProgress);
            if (newProgress >= targetProgress) {
              clearInterval(progressInterval);
            }
            return newProgress;
          });
        }, LOADING_PHASES[i].duration / 50);

        // Wait for phase duration
        await new Promise(resolve => setTimeout(resolve, LOADING_PHASES[i].duration));
      }

      setTimeout(() => {
        onComplete?.();
      }, 500);
    };

    animatePhases();
  }, [visible, onComplete]);

  if (!visible) return null;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[styles.progressContainer, { opacity: fadeAnim }]}>
      <Text style={styles.progressText}>
        {LOADING_PHASES[currentPhase]?.text || 'Loading...'}
      </Text>
      
      <View style={styles.progressBar}>
        <Animated.View 
          style={[
            styles.progressFill,
            {
              width: progressWidth,
            }
          ]} 
        />
      </View>
      
      <Text style={styles.progressPercentage}>
        {Math.round(progress)}%
      </Text>
    </Animated.View>
  );
});

const RydeAnimation = () => {
  const navigation = useNavigation();
  const { user, loading } = useAuth() || { user: null, loading: false };
  
  // Animation phase states
  const [showPrimaryWord, setShowPrimaryWord] = useState(false);
  const [showSecondaryWord, setShowSecondaryWord] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [showTagline, setShowTagline] = useState(false);
  const [canSkip, setCanSkip] = useState(false);

  // Auto-navigation timer
  const navigationTimer = useRef(null);
  const skipTimer = useRef(null);

  /**
   * Handle navigation to next screen
   */
  const handleNavigation = useCallback(() => {
    if (navigationTimer.current) {
      clearTimeout(navigationTimer.current);
      navigationTimer.current = null;
    }

    // Navigate based on authentication status
    if (loading) {
      // Still checking auth status, wait a bit more
      navigationTimer.current = setTimeout(handleNavigation, 1000);
      return;
    }

    if (user) {
      // User is authenticated, go to main app
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } else {
      // User not authenticated, go to login
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  }, [navigation, user, loading]);

  /**
   * Handle skip functionality
   */
  const handleSkip = useCallback(() => {
    if (canSkip) {
      handleNavigation();
    }
  }, [canSkip, handleNavigation]);

  /**
   * Initialize animation sequence
   */
  useEffect(() => {
    // Hide splash screen and start animation
    StatusBar.setHidden(true);
    
    // Enable skip after delay
    skipTimer.current = setTimeout(() => {
      setCanSkip(true);
    }, 2000);

    // Start animation sequence
    const startSequence = setTimeout(() => {
      setShowPrimaryWord(true);
    }, 500);

    // Cleanup function
    return () => {
      clearTimeout(startSequence);
      if (navigationTimer.current) {
        clearTimeout(navigationTimer.current);
      }
      if (skipTimer.current) {
        clearTimeout(skipTimer.current);
      }
      StatusBar.setHidden(false);
    };
  }, []);

  /**
   * Handle hardware back button
   */
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (canSkip) {
          handleSkip();
          return true;
        }
        return false;
      }
    );

    return () => backHandler.remove();
  }, [canSkip, handleSkip]);

  /**
   * Animation sequence callbacks
   */
  const onPrimaryWordComplete = useCallback(() => {
    setTimeout(() => setShowSecondaryWord(true), 200);
  }, []);

  const onSecondaryWordComplete = useCallback(() => {
    setTimeout(() => setShowLogo(true), 300);
  }, []);

  const onLogoComplete = useCallback(() => {
    setTimeout(() => {
      setShowTagline(true);
      setTimeout(() => setShowProgress(true), 500);
    }, 200);
  }, []);

  const onProgressComplete = useCallback(() => {
    navigationTimer.current = setTimeout(handleNavigation, 1000);
  }, [handleNavigation]);

  return (
    <Pressable 
      style={styles.container}
      onPress={handleSkip}
      accessibilityRole="button"
      accessibilityLabel="Tap to skip animation"
      accessibilityHint="Skip the loading animation and go to the main app"
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={BRAND_CONFIG.BACKGROUND_GRADIENT.start}
        hidden={true}
      />

      {/* Background Gradient */}
      <View style={styles.backgroundGradient} />

      {/* Skip Button */}
      {canSkip && (
        <Pressable 
          style={styles.skipButton}
          onPress={handleSkip}
          accessibilityRole="button"
          accessibilityLabel="Skip"
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      )}

      {/* Main Content */}
      <View style={styles.content}>
        {/* Primary Brand Word */}
        <View style={styles.brandContainer}>
          {showPrimaryWord && (
            <WordAnimation
              word={BRAND_CONFIG.PRIMARY_WORD}
              color={BRAND_CONFIG.PRIMARY_COLOR}
              fontSize={48}
              startDelay={0}
              onComplete={onPrimaryWordComplete}
            />
          )}
        </View>

        {/* Secondary Word */}
        <View style={styles.secondaryContainer}>
          {showSecondaryWord && (
            <WordAnimation
              word={BRAND_CONFIG.SECONDARY_WORD}
              color={BRAND_CONFIG.SECONDARY_COLOR}
              fontSize={24}
              startDelay={0}
              onComplete={onSecondaryWordComplete}
            />
          )}
        </View>

        {/* Logo */}
        <LogoReveal
          visible={showLogo}
          onComplete={onLogoComplete}
        />

        {/* Tagline */}
        {showTagline && (
          <Animated.Text 
            style={styles.tagline}
            accessibilityLabel={BRAND_CONFIG.TAGLINE}
          >
            {BRAND_CONFIG.TAGLINE}
          </Animated.Text>
        )}
      </View>

      {/* Progress Indicator */}
      <ProgressIndicator
        visible={showProgress}
        onComplete={onProgressComplete}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_CONFIG.BACKGROUND_GRADIENT.start,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: BRAND_CONFIG.BACKGROUND_GRADIENT.end,
    opacity: 0.8,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  skipText: {
    color: BRAND_CONFIG.SECONDARY_COLOR,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  brandContainer: {
    marginBottom: 20,
  },
  secondaryContainer: {
    marginBottom: 40,
  },
  wordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  letter: {
    fontWeight: 'bold',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  logoContainer: {
    marginVertical: 30,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BRAND_CONFIG.PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  tagline: {
    fontSize: 18,
    color: BRAND_CONFIG.SECONDARY_COLOR,
    textAlign: 'center',
    marginTop: 20,
    opacity: 0.9,
    fontWeight: '300',
    letterSpacing: 1,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 100,
    left: 40,
    right: 40,
    alignItems: 'center',
  },
  progressText: {
    color: BRAND_CONFIG.SECONDARY_COLOR,
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: BRAND_CONFIG.PRIMARY_COLOR,
    borderRadius: 2,
  },
  progressPercentage: {
    color: BRAND_CONFIG.SECONDARY_COLOR,
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
});

export default RydeAnimation; 