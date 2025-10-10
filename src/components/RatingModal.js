/**
 * Advanced Rating Modal for Driver App
 * State-of-the-art rating interface with detailed categories and analytics
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, DIMENSIONS as DIMS } from '@/constants';
import { ratingService } from '@/services/ratingService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const RatingModal = ({ 
  visible, 
  onClose, 
  onSubmit, 
  rideData, 
  targetUser, // Rider being rated
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [overallRating, setOverallRating] = useState(0);
  const [categoryRatings, setCategoryRatings] = useState({});
  const [weightedAverage, setWeightedAverage] = useState(0);
  const [quickReviews, setQuickReviews] = useState([]);
  const [writtenReview, setWrittenReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [slideAnim] = useState(new Animated.Value(0));

  const totalSteps = 3;
  const categories = ratingService.getRatingCategories('rider', rideData?.rideType);
  const quickReviewOptions = ratingService.getQuickReviewOptions('rider', overallRating);

  useEffect(() => {
    if (visible) {
      // Reset state when modal opens
      setCurrentStep(1);
      setOverallRating(0);
      setCategoryRatings({});
      setWeightedAverage(0);
      setQuickReviews([]);
      setWrittenReview('');
      setError('');
      slideAnim.setValue(0);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
  }, [visible]);

  const handleOverallRatingChange = (rating) => {
    setOverallRating(rating);
    // Auto-advance to categories if rating is given
    if (rating > 0 && currentStep === 1) {
      setTimeout(() => setCurrentStep(2), 500);
    }
  };

  const handleCategoryRatingChange = (category, rating) => {
    const newRatings = {
      ...categoryRatings,
      [category]: rating
    };
    
    setCategoryRatings(newRatings);
    
    // Calculate weighted average
    const weightedSum = Object.entries(newRatings).reduce((sum, [cat, rating]) => {
      const weight = categories[cat]?.weight || 1;
      return sum + (rating * weight);
    }, 0);
    
    const totalWeight = Object.values(categories).reduce((sum, cat) => sum + (cat.weight || 1), 0);
    const weightedAverage = weightedSum / totalWeight;
    
    setWeightedAverage(weightedAverage);
  };

  const handleQuickReviewToggle = (review) => {
    setQuickReviews(prev => 
      prev.includes(review) 
        ? prev.filter(r => r !== review)
        : [...prev, review]
    );
  };

  const handleSubmit = async () => {
    if (overallRating === 0) {
      setError('Please provide an overall rating');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const ratingData = {
        overall: overallRating,
        categories: categoryRatings,
        weightedAverage: weightedAverage,
        review: writtenReview.trim(),
        quickReviews: quickReviews,
        rideContext: {
          rideType: rideData?.rideType || 'standard',
          duration: rideData?.duration || 0,
          distance: rideData?.distance || 0
        }
      };

      const result = await ratingService.submitRating(
        rideData?.id, 
        'driverToRider', 
        ratingData
      );

      if (result.success) {
        onSubmit?.(result.ratingData);
        onClose();
      } else {
        setError(result.error || 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Rating submission error:', error);
      setError('Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return `How was your experience with ${targetUser?.name || 'this rider'}?`;
      case 2: return 'Rate specific aspects';
      case 3: return 'Share more details (optional)';
      default: return 'Rate your experience';
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return overallRating > 0;
      case 2: return Object.keys(categoryRatings).length > 0;
      case 3: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const StarRating = ({ rating, onRatingChange, size = 30, interactive = true }) => {
    return (
      <View className="flex-row items-center space-x-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => interactive && onRatingChange(star)}
            disabled={!interactive}
            className="p-1"
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={size}
              color={star <= rating ? COLORS.warning : COLORS.gray[300]}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const CategoryRating = ({ category, label, icon, weight, onRatingChange }) => {
    const currentRating = categoryRatings[category] || 0;
    
    return (
      <View className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center space-x-3">
            <Text className="text-2xl">{icon}</Text>
            <View>
              <Text className="font-medium text-gray-900">{label}</Text>
              {weight > 1 && (
                <Text className="text-xs text-gray-500">Weighted {weight}x</Text>
              )}
            </View>
          </View>
          
          {currentRating > 0 && (
            <Text className="text-lg font-semibold text-blue-600">
              {currentRating.toFixed(1)}
            </Text>
          )}
        </View>
        
        <StarRating
          rating={currentRating}
          onRatingChange={(rating) => onRatingChange(category, rating)}
          size={24}
          interactive={true}
        />
        
        {currentRating > 0 && (
          <View className="mt-3 pt-3 border-t border-gray-200">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-600">Performance</Text>
              <View className="flex-row items-center space-x-2">
                <View className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <View 
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(currentRating / 5) * 100}%` }}
                  />
                </View>
                <Text className="text-sm font-medium text-blue-600">
                  {currentRating >= 4.5 ? 'Excellent' :
                   currentRating >= 3.5 ? 'Good' :
                   currentRating >= 2.5 ? 'Fair' : 'Poor'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black bg-opacity-50 justify-center items-center p-4">
        <Animated.View 
          style={{
            transform: [{
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0]
              })
            }],
            opacity: slideAnim
          }}
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90%] overflow-hidden"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between p-6 border-b border-gray-200">
            <View>
              <Text className="text-2xl font-bold text-gray-900">Rate Your Experience</Text>
              <Text className="text-gray-600 mt-1">Help improve the service</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="p-2 rounded-full"
            >
              <Ionicons name="close" size={24} color={COLORS.gray[500]} />
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View className="px-6 py-4 bg-gray-50">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-medium text-gray-700">
                Step {currentStep} of {totalSteps}
              </Text>
              <Text className="text-sm text-gray-500">
                {Math.round((currentStep / totalSteps) * 100)}% Complete
              </Text>
            </View>
            <View className="w-full bg-gray-200 rounded-full h-2">
              <View 
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </View>
          </View>

          {/* Content */}
          <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
            <View className="items-center mb-8">
              <Text className="text-xl font-semibold text-gray-900 mb-2 text-center">
                {getStepTitle()}
              </Text>
            </View>

            {/* Step 1: Overall Rating */}
            {currentStep === 1 && (
              <View className="items-center space-y-6">
                <View className="items-center">
                  <View className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 items-center justify-center">
                    {targetUser?.photo ? (
                      <Image
                        source={{ uri: targetUser.photo }}
                        className="w-20 h-20 rounded-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 items-center justify-center">
                        <Text className="text-white text-2xl font-bold">
                          {targetUser?.name?.charAt(0) || '?'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-lg font-medium text-gray-900">{targetUser?.name}</Text>
                  <Text className="text-gray-600">Rider</Text>
                </View>

                <StarRating
                  rating={overallRating}
                  onRatingChange={handleOverallRatingChange}
                  size={40}
                  interactive={true}
                />

                {overallRating > 0 && (
                  <View className="items-center">
                    <Text className="text-lg font-medium text-gray-900">
                      {overallRating >= 4.5 ? 'Excellent!' :
                       overallRating >= 3.5 ? 'Good!' :
                       overallRating >= 2.5 ? 'Fair' : 'Poor'}
                    </Text>
                    <Text className="text-gray-600 text-center">
                      {overallRating >= 4.5 ? 'Thank you for the great experience!' :
                       overallRating >= 3.5 ? 'We appreciate your feedback!' :
                       overallRating >= 2.5 ? 'We\'ll work to improve!' : 'We apologize for the poor experience.'}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Step 2: Category Ratings */}
            {currentStep === 2 && (
              <View>
                {Object.entries(categories).map(([categoryKey, category]) => (
                  <CategoryRating
                    key={categoryKey}
                    category={categoryKey}
                    label={category.label}
                    icon={category.icon}
                    weight={category.weight}
                    onRatingChange={handleCategoryRatingChange}
                  />
                ))}
              </View>
            )}

            {/* Step 3: Additional Details */}
            {currentStep === 3 && (
              <View className="space-y-6">
                {/* Quick Reviews */}
                {overallRating >= 3 && (
                  <View>
                    <Text className="text-lg font-medium text-gray-900 mb-3">
                      What went well? (Optional)
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {quickReviewOptions.map((option) => (
                        <TouchableOpacity
                          key={option}
                          onPress={() => handleQuickReviewToggle(option)}
                          className={`px-4 py-2 rounded-full border ${
                            quickReviews.includes(option)
                              ? 'bg-blue-100 border-blue-300'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          <Text className={`text-sm ${
                            quickReviews.includes(option)
                              ? 'text-blue-700'
                              : 'text-gray-700'
                          }`}>
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Written Review */}
                <View>
                  <Text className="text-lg font-medium text-gray-900 mb-3">
                    Additional Comments (Optional)
                  </Text>
                  <TextInput
                    value={writtenReview}
                    onChangeText={setWrittenReview}
                    multiline
                    numberOfLines={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
                    placeholder="Share more details about your experience..."
                    maxLength={500}
                    textAlignVertical="top"
                  />
                  <Text className="text-right text-sm text-gray-500 mt-1">
                    {writtenReview.length}/500 characters
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            {error ? (
              <View className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                <Text className="text-sm text-red-700">{error}</Text>
              </View>
            ) : null}

            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={currentStep === 1 ? onClose : handlePrevious}
                disabled={submitting}
                className="px-6 py-3 border border-gray-300 rounded-lg"
              >
                <Text className="text-gray-700 font-medium">
                  {currentStep === 1 ? 'Cancel' : 'Back'}
                </Text>
              </TouchableOpacity>

              <View className="flex-row space-x-3">
                {currentStep < totalSteps ? (
                  <TouchableOpacity
                    onPress={handleNext}
                    disabled={!canProceed()}
                    className={`px-6 py-3 rounded-lg ${
                      canProceed() ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <Text className="text-white font-medium">Next</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={!canProceed() || submitting}
                    className={`px-6 py-3 rounded-lg flex-row items-center ${
                      canProceed() && !submitting ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    {submitting && (
                      <ActivityIndicator size="small" color="white" className="mr-2" />
                    )}
                    <Text className="text-white font-medium">
                      {submitting ? 'Submitting...' : 'Submit Rating'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default RatingModal;
