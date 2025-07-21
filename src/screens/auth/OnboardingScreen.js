import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, DIMENSIONS } from '@/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const OnboardingScreen = ({ navigation }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const slides = [
    {
      id: 1,
      icon: 'cash-outline',
      iconColor: COLORS.primary[500],
      title: 'Maximize Your Earnings',
      subtitle: 'Smart Bidding System',
      description: 'Set your own prices with our revolutionary bidding system. Earn 15-30% more than traditional platforms.',
      features: [
        'Custom bid amounts (+$2, +$5, +$10, or custom)',
        'Real-time profit calculations',
        'AI-powered bid recommendations',
        'Transparent pricing - no surge surprises'
      ]
    },
    {
      id: 2,
      icon: 'speedometer-outline',
      iconColor: COLORS.warning,
      title: 'World-First Fuel Intelligence',
      subtitle: 'Know Your Profit Before You Drive',
      description: 'Our exclusive fuel cost estimation shows your exact profit after expenses - the only platform with this feature.',
      features: [
        'Real-time fuel price integration',
        'AI learning from your driving patterns',
        '50+ vehicle efficiency database',
        'Profit analysis for every ride'
      ]
    },
    {
      id: 3,
      icon: 'trending-up-outline',
      iconColor: COLORS.info,
      title: 'AI-Powered Optimization',
      subtitle: 'Get Smarter Over Time',
      description: 'Our machine learning system learns your driving efficiency and provides personalized recommendations.',
      features: [
        'Personal efficiency tracking',
        'Weather & traffic awareness',
        'Route optimization suggestions',
        'Seasonal efficiency adjustments'
      ]
    },
    {
      id: 4,
      icon: 'shield-checkmark-outline',
      iconColor: COLORS.success,
      title: 'Professional Driver Platform',
      subtitle: 'Built for Serious Drivers',
      description: 'Designed specifically for independent drivers, taxi operators, and fleet professionals.',
      features: [
        'Comprehensive trip analytics',
        'Tax-optimized earnings tracking',
        'Vehicle management tools',
        'Professional support team'
      ]
    }
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      const nextIndex = currentSlide + 1;
      setCurrentSlide(nextIndex);
      scrollViewRef.current?.scrollTo({ x: nextIndex * SCREEN_WIDTH, animated: true });
    } else {
      // Last slide - proceed to sign up
      navigation.navigate('SignUp');
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      const prevIndex = currentSlide - 1;
      setCurrentSlide(prevIndex);
      scrollViewRef.current?.scrollTo({ x: prevIndex * SCREEN_WIDTH, animated: true });
    }
  };

  const skipOnboarding = () => {
    navigation.navigate('Login');
  };

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const slideIndex = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentSlide(slideIndex);
  };

  const SlideContent = ({ slide }) => (
    <View style={styles.slide}>
      <View style={styles.slideContent}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${slide.iconColor}15` }]}>
          <Ionicons name={slide.icon} size={64} color={slide.iconColor} />
        </View>

        {/* Title & Subtitle */}
        <Text style={styles.slideTitle}>{slide.title}</Text>
        <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
        <Text style={styles.slideDescription}>{slide.description}</Text>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          {slide.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={slide.iconColor} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={skipOnboarding} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContainer}
      >
        {slides.map((slide) => (
          <SlideContent key={slide.id} slide={slide} />
        ))}
      </ScrollView>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentSlide ? styles.activeDot : styles.inactiveDot
              ]}
            />
          ))}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          {/* Back Button */}
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.backButton,
              currentSlide === 0 && styles.hiddenButton
            ]}
            onPress={prevSlide}
            disabled={currentSlide === 0}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>

          {/* Next/Get Started Button */}
          <TouchableOpacity style={styles.nextButton} onPress={nextSlide}>
            <Text style={styles.nextButtonText}>
              {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <Ionicons 
              name={currentSlide === slides.length - 1 ? "arrow-forward" : "arrow-forward"} 
              size={20} 
              color={COLORS.white} 
              style={styles.nextButtonIcon}
            />
          </TouchableOpacity>
        </View>

        {/* Sign In Option */}
        <View style={styles.signInPrompt}>
          <Text style={styles.signInText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.signInLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: DIMENSIONS.radiusM,
    backgroundColor: COLORS.gray100,
  },
  skipText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: 20,
  },
  slideContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  slideTitle: {
    fontSize: TYPOGRAPHY.fontSizes['3xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  slideSubtitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.primary[500],
    textAlign: 'center',
    marginBottom: 16,
  },
  slideDescription: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  featuresContainer: {
    width: '100%',
    maxWidth: 300,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  featureText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    marginLeft: 12,
    lineHeight: 20,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    backgroundColor: COLORS.white,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: COLORS.primary[500],
    width: 24,
  },
  inactiveDot: {
    backgroundColor: COLORS.gray300,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: COLORS.gray100,
  },
  hiddenButton: {
    opacity: 0,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary[500],
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: DIMENSIONS.radiusM,
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.white,
  },
  nextButtonIcon: {
    marginLeft: 8,
  },
  signInPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.textSecondary,
  },
  signInLink: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.primary[500],
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
  },
});

export default OnboardingScreen; 