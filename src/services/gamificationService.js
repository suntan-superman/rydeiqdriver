import { db } from './firebase/config';
import { collection, query, where, orderBy, getDoc, getDocs, doc, addDoc, updateDoc, deleteDoc, limit, onSnapshot } from 'firebase/firestore';

function getTimeRangeFilter(timeRange = '30d') {
  const now = new Date();
  switch (timeRange) {
    case '1h':
      return new Date(now.getTime() - 60 * 60 * 1000);
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

class GamificationService {
  async getGamificationDashboard(userId = null, timeRange = '30d') {
    // Achievement system
    const achievementSystem = await this.getAchievementSystem(userId, timeRange);
    // Leaderboards
    const leaderboards = await this.getLeaderboards(userId, timeRange);
    // Rewards program
    const rewardsProgram = await this.getRewardsProgram(userId, timeRange);
    // Challenges
    const challenges = await this.getChallenges(userId, timeRange);
    // Social features
    const socialFeatures = await this.getSocialFeatures(userId, timeRange);
    // Loyalty program
    const loyaltyProgram = await this.getLoyaltyProgram(userId, timeRange);
    // Progress tracking
    const progressTracking = await this.getProgressTracking(userId, timeRange);
    // Gamification analytics
    const gamificationAnalytics = await this.getGamificationAnalytics(userId, timeRange);
    
    return {
      achievementSystem,
      leaderboards,
      rewardsProgram,
      challenges,
      socialFeatures,
      loyaltyProgram,
      progressTracking,
      gamificationAnalytics,
      timestamp: Date.now()
    };
  }

  async getAchievementSystem(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const achievementsRef = collection(db, 'achievements');
    let achievementsQuery;
    
    if (userId) {
      achievementsQuery = query(
        achievementsRef,
        where('driverId', '==', userId),
        where('unlockedAt', '>=', timeFilter),
        orderBy('unlockedAt', 'desc')
      );
    } else {
      achievementsQuery = query(
        achievementsRef,
        orderBy('unlockedAt', 'desc'),
        limit(20)
      );
    }
    
    const achievementsSnapshot = await getDocs(achievementsQuery);
    const achievements = achievementsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      unlockedAchievements: achievements.filter(a => a.status === 'unlocked'),
      availableAchievements: this.getAvailableAchievements(),
      achievementProgress: this.calculateAchievementProgress(achievements),
      achievementCategories: {
        driving: { count: 15, unlocked: achievements.filter(a => a.category === 'driving' && a.status === 'unlocked').length },
        earnings: { count: 12, unlocked: achievements.filter(a => a.category === 'earnings' && a.status === 'unlocked').length },
        safety: { count: 8, unlocked: achievements.filter(a => a.category === 'safety' && a.status === 'unlocked').length },
        community: { count: 10, unlocked: achievements.filter(a => a.category === 'community' && a.status === 'unlocked').length },
        sustainability: { count: 6, unlocked: achievements.filter(a => a.category === 'sustainability' && a.status === 'unlocked').length }
      },
      recentUnlocks: achievements.filter(a => a.status === 'unlocked').slice(0, 5)
    };
  }

  async getLeaderboards(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const leaderboardsRef = collection(db, 'leaderboards');
    let leaderboardsQuery;
    
    if (userId) {
      leaderboardsQuery = query(
        leaderboardsRef,
        where('driverId', '==', userId),
        where('updatedAt', '>=', timeFilter),
        orderBy('updatedAt', 'desc')
      );
    } else {
      leaderboardsQuery = query(
        leaderboardsRef,
        where('updatedAt', '>=', timeFilter),
        orderBy('score', 'desc'),
        limit(50)
      );
    }
    
    const leaderboardsSnapshot = await getDocs(leaderboardsQuery);
    const leaderboards = leaderboardsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      globalLeaderboard: this.generateGlobalLeaderboard(leaderboards),
      weeklyLeaderboard: this.generateWeeklyLeaderboard(leaderboards),
      monthlyLeaderboard: this.generateMonthlyLeaderboard(leaderboards),
      categoryLeaderboards: {
        earnings: this.generateCategoryLeaderboard(leaderboards, 'earnings'),
        rides: this.generateCategoryLeaderboard(leaderboards, 'rides'),
        rating: this.generateCategoryLeaderboard(leaderboards, 'rating'),
        safety: this.generateCategoryLeaderboard(leaderboards, 'safety')
      },
      userRanking: this.calculateUserRanking(leaderboards, userId),
      leaderboardHistory: this.getLeaderboardHistory(leaderboards, userId)
    };
  }

  async getRewardsProgram(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const rewardsRef = collection(db, 'rewards');
    let rewardsQuery;
    
    if (userId) {
      rewardsQuery = query(
        rewardsRef,
        where('driverId', '==', userId),
        where('earnedAt', '>=', timeFilter),
        orderBy('earnedAt', 'desc')
      );
    } else {
      rewardsQuery = query(
        rewardsRef,
        where('earnedAt', '>=', timeFilter),
        orderBy('earnedAt', 'desc'),
        limit(30)
      );
    }
    
    const rewardsSnapshot = await getDocs(rewardsQuery);
    const rewards = rewardsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      currentPoints: this.calculateCurrentPoints(rewards),
      availableRewards: this.getAvailableRewards(),
      earnedRewards: rewards.filter(r => r.status === 'earned'),
      pendingRewards: rewards.filter(r => r.status === 'pending'),
      rewardHistory: rewards,
      pointMultipliers: {
        peakHours: 1.5,
        weekend: 1.3,
        specialEvents: 2.0,
        safetyBonus: 1.2,
        referralBonus: 1.5
      },
      nextMilestone: this.getNextMilestone(rewards)
    };
  }

  async getChallenges(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const challengesRef = collection(db, 'challenges');
    let challengesQuery;
    
    if (userId) {
      challengesQuery = query(
        challengesRef,
        where('driverId', '==', userId),
        where('startDate', '>=', timeFilter),
        orderBy('startDate', 'desc')
      );
    } else {
      challengesQuery = query(
        challengesRef,
        where('startDate', '>=', timeFilter),
        orderBy('startDate', 'desc'),
        limit(20)
      );
    }
    
    const challengesSnapshot = await getDocs(challengesQuery);
    const challenges = challengesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      activeChallenges: challenges.filter(c => c.status === 'active'),
      completedChallenges: challenges.filter(c => c.status === 'completed'),
      upcomingChallenges: this.getUpcomingChallenges(),
      challengeProgress: this.calculateChallengeProgress(challenges),
      challengeCategories: {
        daily: challenges.filter(c => c.type === 'daily'),
        weekly: challenges.filter(c => c.type === 'weekly'),
        monthly: challenges.filter(c => c.type === 'monthly'),
        special: challenges.filter(c => c.type === 'special')
      },
      challengeRewards: this.getChallengeRewards(challenges)
    };
  }

  async getSocialFeatures(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const socialRef = collection(db, 'socialFeatures');
    let socialQuery;
    
    if (userId) {
      socialQuery = query(
        socialRef,
        where('driverId', '==', userId),
        where('createdAt', '>=', timeFilter),
        orderBy('createdAt', 'desc')
      );
    } else {
      socialQuery = query(
        socialRef,
        where('createdAt', '>=', timeFilter),
        orderBy('createdAt', 'desc'),
        limit(40)
      );
    }
    
    const socialSnapshot = await getDocs(socialQuery);
    const socialData = socialSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      driverCommunities: this.getDriverCommunities(socialData),
      socialPosts: socialData.filter(s => s.type === 'post'),
      socialInteractions: this.getSocialInteractions(socialData),
      communityEvents: this.getCommunityEvents(socialData),
      socialStats: {
        followers: 45,
        following: 38,
        posts: 23,
        likes: 156,
        comments: 89
      },
      socialRecommendations: this.getSocialRecommendations(socialData)
    };
  }

  async getLoyaltyProgram(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const loyaltyRef = collection(db, 'loyaltyProgram');
    let loyaltyQuery;
    
    if (userId) {
      loyaltyQuery = query(
        loyaltyRef,
        where('driverId', '==', userId),
        where('updatedAt', '>=', timeFilter),
        orderBy('updatedAt', 'desc')
      );
    } else {
      loyaltyQuery = query(
        loyaltyRef,
        where('updatedAt', '>=', timeFilter),
        orderBy('updatedAt', 'desc'),
        limit(25)
      );
    }
    
    const loyaltySnapshot = await getDocs(loyaltyQuery);
    const loyaltyData = loyaltySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      currentTier: this.getCurrentTier(loyaltyData),
      tierProgress: this.calculateTierProgress(loyaltyData),
      tierBenefits: this.getTierBenefits(loyaltyData),
      loyaltyPoints: this.calculateLoyaltyPoints(loyaltyData),
      tierHistory: this.getTierHistory(loyaltyData),
      exclusiveOffers: this.getExclusiveOffers(loyaltyData),
      tierRequirements: {
        bronze: { points: 0, rides: 0, earnings: 0 },
        silver: { points: 1000, rides: 50, earnings: 1000 },
        gold: { points: 5000, rides: 200, earnings: 5000 },
        platinum: { points: 15000, rides: 500, earnings: 15000 },
        diamond: { points: 50000, rides: 1000, earnings: 50000 }
      }
    };
  }

  async getProgressTracking(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const progressRef = collection(db, 'progressTracking');
    let progressQuery;
    
    if (userId) {
      progressQuery = query(
        progressRef,
        where('driverId', '==', userId),
        where('date', '>=', timeFilter),
        orderBy('date', 'desc')
      );
    } else {
      progressQuery = query(
        progressRef,
        where('date', '>=', timeFilter),
        orderBy('date', 'desc'),
        limit(30)
      );
    }
    
    const progressSnapshot = await getDocs(progressQuery);
    const progressData = progressSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      dailyProgress: this.calculateDailyProgress(progressData),
      weeklyProgress: this.calculateWeeklyProgress(progressData),
      monthlyProgress: this.calculateMonthlyProgress(progressData),
      goalProgress: this.calculateGoalProgress(progressData),
      streakTracking: this.calculateStreaks(progressData),
      progressMetrics: {
        ridesCompleted: progressData.reduce((sum, p) => sum + (p.ridesCompleted || 0), 0),
        earnings: progressData.reduce((sum, p) => sum + (p.earnings || 0), 0),
        rating: this.calculateAverageRating(progressData),
        safetyScore: this.calculateSafetyScore(progressData)
      }
    };
  }

  async getGamificationAnalytics(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const analyticsRef = collection(db, 'gamificationAnalytics');
    let analyticsQuery;
    
    if (userId) {
      analyticsQuery = query(
        analyticsRef,
        where('driverId', '==', userId),
        where('date', '>=', timeFilter),
        orderBy('date', 'desc')
      );
    } else {
      analyticsQuery = query(
        analyticsRef,
        where('date', '>=', timeFilter),
        orderBy('date', 'desc'),
        limit(50)
      );
    }
    
    const analyticsSnapshot = await getDocs(analyticsQuery);
    const analyticsData = analyticsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      engagementMetrics: this.calculateEngagementMetrics(analyticsData),
      retentionMetrics: this.calculateRetentionMetrics(analyticsData),
      performanceMetrics: this.calculatePerformanceMetrics(analyticsData),
      gamificationImpact: this.calculateGamificationImpact(analyticsData),
      userBehavior: this.analyzeUserBehavior(analyticsData),
      featureUsage: this.analyzeFeatureUsage(analyticsData)
    };
  }

  // Helper methods for achievements
  getAvailableAchievements() {
    return [
      { id: 'first_ride', name: 'First Ride', description: 'Complete your first ride', category: 'driving', points: 100, icon: 'car' },
      { id: 'speed_demon', name: 'Speed Demon', description: 'Complete 10 rides in a day', category: 'driving', points: 500, icon: 'flash' },
      { id: 'safety_first', name: 'Safety First', description: 'Maintain 5.0 rating for 50 rides', category: 'safety', points: 1000, icon: 'shield' },
      { id: 'earnings_master', name: 'Earnings Master', description: 'Earn $500 in a week', category: 'earnings', points: 750, icon: 'wallet' },
      { id: 'community_hero', name: 'Community Hero', description: 'Help 5 other drivers', category: 'community', points: 300, icon: 'people' }
    ];
  }

  calculateAchievementProgress(achievements) {
    const totalAchievements = this.getAvailableAchievements().length;
    const unlockedCount = achievements.filter(a => a.status === 'unlocked').length;
    return {
      total: totalAchievements,
      unlocked: unlockedCount,
      percentage: (unlockedCount / totalAchievements) * 100,
      nextAchievement: this.getNextAchievement(achievements)
    };
  }

  getNextAchievement(achievements) {
    const available = this.getAvailableAchievements();
    const unlocked = achievements.filter(a => a.status === 'unlocked').map(a => a.id);
    return available.find(a => !unlocked.includes(a.id));
  }

  // Helper methods for leaderboards
  generateGlobalLeaderboard(leaderboards) {
    return leaderboards
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));
  }

  generateWeeklyLeaderboard(leaderboards) {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return leaderboards
      .filter(l => new Date(l.updatedAt) >= weekAgo)
      .sort((a, b) => b.weeklyScore - a.weeklyScore)
      .slice(0, 20);
  }

  generateMonthlyLeaderboard(leaderboards) {
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return leaderboards
      .filter(l => new Date(l.updatedAt) >= monthAgo)
      .sort((a, b) => b.monthlyScore - a.monthlyScore)
      .slice(0, 20);
  }

  generateCategoryLeaderboard(leaderboards, category) {
    return leaderboards
      .sort((a, b) => b[category] - a[category])
      .slice(0, 10)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));
  }

  calculateUserRanking(leaderboards, userId) {
    if (!userId) return null;
    const userEntry = leaderboards.find(l => l.driverId === userId);
    if (!userEntry) return null;
    
    const globalRank = leaderboards.filter(l => l.score > userEntry.score).length + 1;
    return {
      global: globalRank,
      weekly: userEntry.weeklyRank || 'N/A',
      monthly: userEntry.monthlyRank || 'N/A',
      score: userEntry.score
    };
  }

  getLeaderboardHistory(leaderboards, userId) {
    if (!userId) return [];
    return leaderboards
      .filter(l => l.driverId === userId)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 10);
  }

  // Helper methods for rewards
  calculateCurrentPoints(rewards) {
    return rewards.reduce((sum, reward) => sum + (reward.points || 0), 0);
  }

  getAvailableRewards() {
    return [
      { id: 'coffee', name: 'Free Coffee', points: 500, description: 'Redeem at partner locations' },
      { id: 'gas_card', name: '$25 Gas Card', points: 2000, description: 'Use at any gas station' },
      { id: 'bonus_earnings', name: '10% Bonus', points: 5000, description: '10% bonus on next 10 rides' },
      { id: 'premium_support', name: 'Premium Support', points: 1000, description: 'Priority customer support' }
    ];
  }

  getNextMilestone(rewards) {
    const currentPoints = this.calculateCurrentPoints(rewards);
    const milestones = [1000, 2500, 5000, 10000, 25000];
    const nextMilestone = milestones.find(m => m > currentPoints);
    return {
      current: currentPoints,
      next: nextMilestone,
      progress: nextMilestone ? (currentPoints / nextMilestone) * 100 : 100
    };
  }

  // Helper methods for challenges
  getUpcomingChallenges() {
    return [
      { id: 'weekend_warrior', name: 'Weekend Warrior', description: 'Complete 20 rides this weekend', reward: 1000, type: 'weekly' },
      { id: 'safety_champion', name: 'Safety Champion', description: 'Maintain 5.0 rating for 100 rides', reward: 2000, type: 'monthly' },
      { id: 'earnings_boost', name: 'Earnings Boost', description: 'Earn $1000 in 7 days', reward: 1500, type: 'weekly' }
    ];
  }

  calculateChallengeProgress(challenges) {
    const active = challenges.filter(c => c.status === 'active');
    const completed = challenges.filter(c => c.status === 'completed');
    return {
      active: active.length,
      completed: completed.length,
      completionRate: challenges.length > 0 ? (completed.length / challenges.length) * 100 : 0
    };
  }

  getChallengeRewards(challenges) {
    return challenges
      .filter(c => c.status === 'completed')
      .reduce((sum, c) => sum + (c.reward || 0), 0);
  }

  // Helper methods for social features
  getDriverCommunities(socialData) {
    return [
      { id: 'new_drivers', name: 'New Drivers', members: 1250, description: 'Support for new drivers' },
      { id: 'veterans', name: 'Veteran Drivers', members: 890, description: 'Experienced driver tips' },
      { id: 'safety_first', name: 'Safety First', members: 2100, description: 'Safety best practices' },
      { id: 'earnings_optimization', name: 'Earnings Optimization', members: 1560, description: 'Maximize your earnings' }
    ];
  }

  getSocialInteractions(socialData) {
    return {
      likes: socialData.filter(s => s.type === 'like').length,
      comments: socialData.filter(s => s.type === 'comment').length,
      shares: socialData.filter(s => s.type === 'share').length,
      follows: socialData.filter(s => s.type === 'follow').length
    };
  }

  getCommunityEvents(socialData) {
    return [
      { id: 'meetup_jan', name: 'January Meetup', date: '2024-01-28', location: 'Downtown Coffee Shop', attendees: 45 },
      { id: 'safety_workshop', name: 'Safety Workshop', date: '2024-02-05', location: 'Community Center', attendees: 32 },
      { id: 'earnings_seminar', name: 'Earnings Seminar', date: '2024-02-12', location: 'Conference Center', attendees: 78 }
    ];
  }

  getSocialRecommendations(socialData) {
    return [
      { type: 'community', recommendation: 'Join the Safety First community', reason: 'Based on your safety focus' },
      { type: 'event', recommendation: 'Attend the Earnings Seminar', reason: 'Boost your earnings potential' },
      { type: 'connection', recommendation: 'Connect with veteran drivers', reason: 'Learn from experience' }
    ];
  }

  // Helper methods for loyalty program
  getCurrentTier(loyaltyData) {
    const totalPoints = this.calculateLoyaltyPoints(loyaltyData);
    if (totalPoints >= 50000) return 'Diamond';
    if (totalPoints >= 15000) return 'Platinum';
    if (totalPoints >= 5000) return 'Gold';
    if (totalPoints >= 1000) return 'Silver';
    return 'Bronze';
  }

  calculateTierProgress(loyaltyData) {
    const totalPoints = this.calculateLoyaltyPoints(loyaltyData);
    const currentTier = this.getCurrentTier(loyaltyData);
    const tierRequirements = {
      Bronze: 0,
      Silver: 1000,
      Gold: 5000,
      Platinum: 15000,
      Diamond: 50000
    };
    
    const currentTierPoints = tierRequirements[currentTier];
    const nextTierPoints = Object.values(tierRequirements).find(p => p > totalPoints) || totalPoints;
    const progress = nextTierPoints > currentTierPoints ? 
      ((totalPoints - currentTierPoints) / (nextTierPoints - currentTierPoints)) * 100 : 100;
    
    return {
      currentTier,
      currentPoints: totalPoints,
      nextTier: Object.keys(tierRequirements).find(t => tierRequirements[t] === nextTierPoints),
      nextTierPoints,
      progress
    };
  }

  calculateLoyaltyPoints(loyaltyData) {
    return loyaltyData.reduce((sum, entry) => sum + (entry.points || 0), 0);
  }

  getTierBenefits(loyaltyData) {
    const currentTier = this.getCurrentTier(loyaltyData);
    const benefits = {
      Bronze: ['Basic support', 'Standard app features'],
      Silver: ['Priority support', '5% bonus on peak hours', 'Free coffee monthly'],
      Gold: ['Premium support', '10% bonus on peak hours', 'Free gas card monthly', 'Exclusive events'],
      Platinum: ['VIP support', '15% bonus on peak hours', 'Free maintenance', 'Priority ride requests'],
      Diamond: ['Concierge support', '20% bonus on peak hours', 'All benefits', 'Custom features']
    };
    return benefits[currentTier] || benefits.Bronze;
  }

  getTierHistory(loyaltyData) {
    return loyaltyData
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 10);
  }

  getExclusiveOffers(loyaltyData) {
    const currentTier = this.getCurrentTier(loyaltyData);
    const offers = {
      Bronze: [],
      Silver: [{ id: 'silver_bonus', name: '5% Peak Hour Bonus', validUntil: '2024-02-15' }],
      Gold: [
        { id: 'gold_bonus', name: '10% Peak Hour Bonus', validUntil: '2024-02-15' },
        { id: 'free_maintenance', name: 'Free Oil Change', validUntil: '2024-03-01' }
      ],
      Platinum: [
        { id: 'platinum_bonus', name: '15% Peak Hour Bonus', validUntil: '2024-02-15' },
        { id: 'priority_rides', name: 'Priority Ride Requests', validUntil: '2024-02-28' }
      ],
      Diamond: [
        { id: 'diamond_bonus', name: '20% Peak Hour Bonus', validUntil: '2024-02-15' },
        { id: 'custom_features', name: 'Custom App Features', validUntil: '2024-03-15' }
      ]
    };
    return offers[currentTier] || [];
  }

  // Helper methods for progress tracking
  calculateDailyProgress(progressData) {
    const today = new Date().toDateString();
    const todayData = progressData.find(p => new Date(p.date).toDateString() === today);
    return {
      rides: todayData?.ridesCompleted || 0,
      earnings: todayData?.earnings || 0,
      rating: todayData?.rating || 0,
      goals: {
        rides: { target: 10, current: todayData?.ridesCompleted || 0 },
        earnings: { target: 200, current: todayData?.earnings || 0 },
        rating: { target: 4.8, current: todayData?.rating || 0 }
      }
    };
  }

  calculateWeeklyProgress(progressData) {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekData = progressData.filter(p => new Date(p.date) >= weekAgo);
    return {
      rides: weekData.reduce((sum, p) => sum + (p.ridesCompleted || 0), 0),
      earnings: weekData.reduce((sum, p) => sum + (p.earnings || 0), 0),
      rating: this.calculateAverageRating(weekData),
      goals: {
        rides: { target: 50, current: weekData.reduce((sum, p) => sum + (p.ridesCompleted || 0), 0) },
        earnings: { target: 1000, current: weekData.reduce((sum, p) => sum + (p.earnings || 0), 0) },
        rating: { target: 4.8, current: this.calculateAverageRating(weekData) }
      }
    };
  }

  calculateMonthlyProgress(progressData) {
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthData = progressData.filter(p => new Date(p.date) >= monthAgo);
    return {
      rides: monthData.reduce((sum, p) => sum + (p.ridesCompleted || 0), 0),
      earnings: monthData.reduce((sum, p) => sum + (p.earnings || 0), 0),
      rating: this.calculateAverageRating(monthData),
      goals: {
        rides: { target: 200, current: monthData.reduce((sum, p) => sum + (p.ridesCompleted || 0), 0) },
        earnings: { target: 4000, current: monthData.reduce((sum, p) => sum + (p.earnings || 0), 0) },
        rating: { target: 4.8, current: this.calculateAverageRating(monthData) }
      }
    };
  }

  calculateGoalProgress(progressData) {
    const goals = {
      rides: { target: 1000, current: progressData.reduce((sum, p) => sum + (p.ridesCompleted || 0), 0) },
      earnings: { target: 20000, current: progressData.reduce((sum, p) => sum + (p.earnings || 0), 0) },
      rating: { target: 4.9, current: this.calculateAverageRating(progressData) }
    };
    
    return Object.keys(goals).map(key => ({
      goal: key,
      target: goals[key].target,
      current: goals[key].current,
      progress: (goals[key].current / goals[key].target) * 100
    }));
  }

  calculateStreaks(progressData) {
    const sortedData = progressData.sort((a, b) => new Date(b.date) - new Date(a.date));
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    for (let i = 0; i < sortedData.length; i++) {
      if (sortedData[i].ridesCompleted > 0) {
        tempStreak++;
        if (i === 0) currentStreak = tempStreak;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
      }
    }
    
    return {
      current: currentStreak,
      longest: longestStreak,
      type: 'consecutive days with rides'
    };
  }

  calculateAverageRating(progressData) {
    const ratings = progressData.filter(p => p.rating > 0).map(p => p.rating);
    return ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
  }

  calculateSafetyScore(progressData) {
    const safetyIncidents = progressData.reduce((sum, p) => sum + (p.safetyIncidents || 0), 0);
    const totalRides = progressData.reduce((sum, p) => sum + (p.ridesCompleted || 0), 0);
    return totalRides > 0 ? Math.max(0, 100 - (safetyIncidents / totalRides) * 100) : 100;
  }

  // Helper methods for gamification analytics
  calculateEngagementMetrics(analyticsData) {
    return {
      dailyActiveUsers: analyticsData.length,
      sessionDuration: analyticsData.reduce((sum, a) => sum + (a.sessionDuration || 0), 0) / analyticsData.length,
      featureUsage: this.analyzeFeatureUsage(analyticsData),
      retentionRate: this.calculateRetentionRate(analyticsData)
    };
  }

  calculateRetentionMetrics(analyticsData) {
    const uniqueUsers = new Set(analyticsData.map(a => a.driverId)).size;
    const returningUsers = analyticsData.filter(a => a.returningUser).length;
    return {
      uniqueUsers,
      returningUsers,
      retentionRate: uniqueUsers > 0 ? (returningUsers / uniqueUsers) * 100 : 0
    };
  }

  calculatePerformanceMetrics(analyticsData) {
    return {
      averageRides: analyticsData.reduce((sum, a) => sum + (a.ridesCompleted || 0), 0) / analyticsData.length,
      averageEarnings: analyticsData.reduce((sum, a) => sum + (a.earnings || 0), 0) / analyticsData.length,
      averageRating: this.calculateAverageRating(analyticsData),
      completionRate: analyticsData.filter(a => a.rideCompleted).length / analyticsData.length * 100
    };
  }

  calculateGamificationImpact(analyticsData) {
    const beforeGamification = analyticsData.filter(a => !a.gamificationEnabled);
    const afterGamification = analyticsData.filter(a => a.gamificationEnabled);
    
    const beforeAvg = beforeGamification.length > 0 ? 
      beforeGamification.reduce((sum, a) => sum + (a.earnings || 0), 0) / beforeGamification.length : 0;
    const afterAvg = afterGamification.length > 0 ? 
      afterGamification.reduce((sum, a) => sum + (a.earnings || 0), 0) / afterGamification.length : 0;
    
    return {
      earningsIncrease: beforeAvg > 0 ? ((afterAvg - beforeAvg) / beforeAvg) * 100 : 0,
      engagementIncrease: afterGamification.length / analyticsData.length * 100,
      retentionIncrease: this.calculateRetentionIncrease(beforeGamification, afterGamification)
    };
  }

  analyzeUserBehavior(analyticsData) {
    return {
      peakUsageHours: this.getPeakUsageHours(analyticsData),
      preferredFeatures: this.getPreferredFeatures(analyticsData),
      gamificationResponse: this.getGamificationResponse(analyticsData)
    };
  }

  analyzeFeatureUsage(analyticsData) {
    const features = ['achievements', 'leaderboards', 'challenges', 'rewards', 'social'];
    return features.map(feature => ({
      feature,
      usageCount: analyticsData.filter(a => a[feature + 'Used']).length,
      usageRate: analyticsData.length > 0 ? 
        analyticsData.filter(a => a[feature + 'Used']).length / analyticsData.length * 100 : 0
    }));
  }

  // Additional methods for gamification management
  async unlockAchievement(userId, achievementId) {
    const achievementRef = collection(db, 'achievements');
    return await addDoc(achievementRef, {
      driverId: userId,
      achievementId,
      status: 'unlocked',
      unlockedAt: new Date(),
      points: this.getAvailableAchievements().find(a => a.id === achievementId)?.points || 0
    });
  }

  async updateLeaderboardScore(userId, score, category = 'general') {
    const leaderboardRef = collection(db, 'leaderboards');
    const existingQuery = query(leaderboardRef, where('driverId', '==', userId));
    const existingSnapshot = await getDocs(existingQuery);
    
    if (existingSnapshot.empty) {
      return await addDoc(leaderboardRef, {
        driverId: userId,
        score,
        [category]: score,
        updatedAt: new Date()
      });
    } else {
      const docRef = doc(db, 'leaderboards', existingSnapshot.docs[0].id);
      return await updateDoc(docRef, {
        score: Math.max(existingSnapshot.docs[0].data().score, score),
        [category]: Math.max(existingSnapshot.docs[0].data()[category] || 0, score),
        updatedAt: new Date()
      });
    }
  }

  async addRewardPoints(userId, points, reason) {
    const rewardsRef = collection(db, 'rewards');
    return await addDoc(rewardsRef, {
      driverId: userId,
      points,
      reason,
      status: 'earned',
      earnedAt: new Date()
    });
  }

  async joinChallenge(userId, challengeId) {
    const challengesRef = collection(db, 'challenges');
    return await addDoc(challengesRef, {
      driverId: userId,
      challengeId,
      status: 'active',
      startDate: new Date(),
      progress: 0
    });
  }

  async updateChallengeProgress(userId, challengeId, progress) {
    const challengesRef = collection(db, 'challenges');
    const challengeQuery = query(
      challengesRef,
      where('driverId', '==', userId),
      where('challengeId', '==', challengeId)
    );
    const challengeSnapshot = await getDocs(challengeQuery);
    
    if (!challengeSnapshot.empty) {
      const docRef = doc(db, 'challenges', challengeSnapshot.docs[0].id);
      return await updateDoc(docRef, {
        progress,
        updatedAt: new Date()
      });
    }
  }

  async createSocialPost(userId, content, type = 'post') {
    const socialRef = collection(db, 'socialFeatures');
    return await addDoc(socialRef, {
      driverId: userId,
      content,
      type,
      createdAt: new Date(),
      likes: 0,
      comments: 0
    });
  }

  async updateLoyaltyPoints(userId, points, reason) {
    const loyaltyRef = collection(db, 'loyaltyProgram');
    return await addDoc(loyaltyRef, {
      driverId: userId,
      points,
      reason,
      updatedAt: new Date()
    });
  }

  async trackProgress(userId, progressData) {
    const progressRef = collection(db, 'progressTracking');
    return await addDoc(progressRef, {
      driverId: userId,
      ...progressData,
      date: new Date()
    });
  }

  async subscribeToGamificationUpdates(userId, callback) {
    const updatesRef = collection(db, 'gamificationUpdates');
    const updatesQuery = query(
      updatesRef,
      where('driverId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    
    return onSnapshot(updatesQuery, (snapshot) => {
      const updates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(updates);
    });
  }
}

export const gamificationService = new GamificationService();
export default gamificationService; 