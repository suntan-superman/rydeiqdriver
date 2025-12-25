// Query Configuration
export { queryConfig } from './queryConfig';

// Driver Hooks
export {
  useDriverProfile,
  useDriverStatus,
  useUpdateDriverProfile,
  useUpdateDriverStatus,
  useUpdateDriverLocation,
} from './useDriver';

// Rides Hooks
export {
  useAvailableRides,
  useRideDetails,
  useDriverRides,
  useAcceptRide,
  useDeclineRide,
  useCompleteRide,
} from './useRides';

// Bidding Hooks
export {
  useBiddingOpportunities,
  useBidHistory,
  useBidDetails,
  usePlaceBid,
  useWithdrawBid,
  useActiveBids,
} from './useBidding';

// Earnings Hooks
export {
  useEarnings,
  useEarningsHistory,
  usePayouts,
  usePayoutDetails,
  useRequestPayout,
  useTotalEarnings,
  useEarningsStats,
} from './useEarnings';

// Notifications Hooks
export {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from './useNotifications';

// Payment Hooks
export {
  usePaymentMethods,
  useAddPaymentMethod,
  useRemovePaymentMethod,
  useSetDefaultPaymentMethod,
} from './usePayment';

// Safety Hooks
export {
  useSafetyFeatures,
  useEmergencyContacts,
  useAddEmergencyContact,
  useUpdateEmergencyContact,
  useRemoveEmergencyContact,
  useUpdateSafetyFeatures,
} from './useSafety';

// Vehicle Hooks
export {
  useVehicleInfo,
  useVehicleDocuments,
  useUpdateVehicleInfo,
  useUploadVehicleDocument,
  useDeleteVehicleDocument,
} from './useVehicle';

// Analytics Hooks
export {
  useAnalyticsDashboard,
  usePerformanceMetrics,
  useTrendData,
} from './useAnalytics';

// Communication Hooks
export {
  useConversations,
  useChatMessages,
  useSendMessage,
  useMarkConversationRead,
} from './useCommunication';

// Accessibility Hooks
export {
  useAccessibilitySettings,
  useUpdateAccessibilitySettings,
} from './useAccessibility';

// Dynamic Pricing Hooks
export {
  usePricingRules,
  useCurrentRates,
  useUpdatePricingRules,
} from './useDynamicPricing';

// Gamification Hooks
export {
  useLeaderboard,
  useAchievements,
  useRewards,
  useClaimReward,
} from './useGamification';

// Driver Tools Hooks
export {
  useToolsList,
  useToolDetails,
  useActivateTool,
} from './useDriverTools';

// Community Hooks
export {
  useCommunityEvents,
  useGroupChats,
  useJoinCommunityEvent,
  useJoinGroupChat,
} from './useCommunity';

// Sustainability Hooks
export {
  useEcoScores,
  useGreenStats,
} from './useSustainability';

// Wellness Hooks
export {
  useWellnessData,
  useWellnessTips,
  useLogBreak,
  useUpdateWellnessPreferences,
} from './useWellness';
