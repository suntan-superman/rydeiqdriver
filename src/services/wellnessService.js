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

class WellnessService {
  async getWellnessDashboard(userId = null, timeRange = '30d') {
    // Fatigue detection
    const fatigueDetection = await this.getFatigueDetection(userId, timeRange);
    // Health monitoring
    const healthMonitoring = await this.getHealthMonitoring(userId, timeRange);
    // Wellness tracking
    const wellnessTracking = await this.getWellnessTracking(userId, timeRange);
    // Safety alerts
    const safetyAlerts = await this.getSafetyAlerts(userId, timeRange);
    // Stress management
    const stressManagement = await this.getStressManagement(userId, timeRange);
    // Sleep tracking
    const sleepTracking = await this.getSleepTracking(userId, timeRange);
    // Nutrition guidance
    const nutritionGuidance = await this.getNutritionGuidance(userId, timeRange);
    // Mental health support
    const mentalHealthSupport = await this.getMentalHealthSupport(userId, timeRange);
    // Wellness analytics
    const wellnessAnalytics = await this.getWellnessAnalytics(userId, timeRange);
    
    return {
      fatigueDetection,
      healthMonitoring,
      wellnessTracking,
      safetyAlerts,
      stressManagement,
      sleepTracking,
      nutritionGuidance,
      mentalHealthSupport,
      wellnessAnalytics,
      timestamp: Date.now()
    };
  }

  async getFatigueDetection(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const fatigueRef = collection(db, 'fatigueDetection');
    let fatigueQuery;
    
    if (userId) {
      fatigueQuery = query(
        fatigueRef,
        where('driverId', '==', userId),
        where('timestamp', '>=', timeFilter),
        orderBy('timestamp', 'desc')
      );
    } else {
      fatigueQuery = query(
        fatigueRef,
        where('timestamp', '>=', timeFilter),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
    }
    
    const fatigueSnapshot = await getDocs(fatigueQuery);
    const fatigueData = fatigueSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      currentStatus: this.calculateFatigueStatus(fatigueData),
      fatigueLevel: this.calculateFatigueLevel(fatigueData),
      detectionMethods: {
        eyeTracking: { enabled: true, accuracy: '92%', lastUpdate: new Date() },
        drivingPatterns: { enabled: true, accuracy: '88%', lastUpdate: new Date() },
        responseTime: { enabled: true, accuracy: '85%', lastUpdate: new Date() },
        heartRate: { enabled: false, accuracy: 'N/A', lastUpdate: null },
        facialRecognition: { enabled: true, accuracy: '90%', lastUpdate: new Date() }
      },
      fatigueAlerts: this.getFatigueAlerts(fatigueData),
      restRecommendations: this.getRestRecommendations(fatigueData),
      fatigueHistory: this.getFatigueHistory(fatigueData),
      safetyThresholds: {
        mildFatigue: 30,
        moderateFatigue: 60,
        severeFatigue: 80,
        criticalFatigue: 90
      }
    };
  }

  async getHealthMonitoring(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const healthRef = collection(db, 'healthMonitoring');
    let healthQuery;
    
    if (userId) {
      healthQuery = query(
        healthRef,
        where('driverId', '==', userId),
        where('timestamp', '>=', timeFilter),
        orderBy('timestamp', 'desc')
      );
    } else {
      healthQuery = query(
        healthRef,
        where('timestamp', '>=', timeFilter),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
    }
    
    const healthSnapshot = await getDocs(healthQuery);
    const healthData = healthSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      vitalSigns: this.getVitalSigns(healthData),
      healthScore: this.calculateHealthScore(healthData),
      healthAlerts: this.getHealthAlerts(healthData),
      medicalConditions: this.getMedicalConditions(healthData),
      medicationTracking: this.getMedicationTracking(healthData),
      healthGoals: this.getHealthGoals(healthData),
      healthTrends: this.getHealthTrends(healthData),
      emergencyContacts: this.getEmergencyContacts(healthData)
    };
  }

  async getWellnessTracking(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const wellnessRef = collection(db, 'wellnessTracking');
    let wellnessQuery;
    
    if (userId) {
      wellnessQuery = query(
        wellnessRef,
        where('driverId', '==', userId),
        where('timestamp', '>=', timeFilter),
        orderBy('timestamp', 'desc')
      );
    } else {
      wellnessQuery = query(
        wellnessRef,
        where('timestamp', '>=', timeFilter),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
    }
    
    const wellnessSnapshot = await getDocs(wellnessQuery);
    const wellnessData = wellnessSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      wellnessScore: this.calculateWellnessScore(wellnessData),
      wellnessMetrics: {
        physical: this.calculatePhysicalWellness(wellnessData),
        mental: this.calculateMentalWellness(wellnessData),
        social: this.calculateSocialWellness(wellnessData),
        emotional: this.calculateEmotionalWellness(wellnessData)
      },
      wellnessGoals: this.getWellnessGoals(wellnessData),
      wellnessActivities: this.getWellnessActivities(wellnessData),
      wellnessChallenges: this.getWellnessChallenges(wellnessData),
      wellnessRewards: this.getWellnessRewards(wellnessData)
    };
  }

  async getSafetyAlerts(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const alertsRef = collection(db, 'safetyAlerts');
    let alertsQuery;
    
    if (userId) {
      alertsQuery = query(
        alertsRef,
        where('driverId', '==', userId),
        where('timestamp', '>=', timeFilter),
        orderBy('timestamp', 'desc')
      );
    } else {
      alertsQuery = query(
        alertsRef,
        where('timestamp', '>=', timeFilter),
        orderBy('timestamp', 'desc'),
        limit(30)
      );
    }
    
    const alertsSnapshot = await getDocs(alertsQuery);
    const alertsData = alertsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      activeAlerts: alertsData.filter(alert => alert.status === 'active'),
      alertHistory: alertsData,
      alertTypes: {
        fatigue: alertsData.filter(a => a.type === 'fatigue').length,
        health: alertsData.filter(a => a.type === 'health').length,
        safety: alertsData.filter(a => a.type === 'safety').length,
        weather: alertsData.filter(a => a.type === 'weather').length,
        traffic: alertsData.filter(a => a.type === 'traffic').length
      },
      alertSeverity: {
        low: alertsData.filter(a => a.severity === 'low').length,
        medium: alertsData.filter(a => a.severity === 'medium').length,
        high: alertsData.filter(a => a.severity === 'high').length,
        critical: alertsData.filter(a => a.severity === 'critical').length
      },
      alertResponse: this.getAlertResponse(alertsData)
    };
  }

  async getStressManagement(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const stressRef = collection(db, 'stressManagement');
    let stressQuery;
    
    if (userId) {
      stressQuery = query(
        stressRef,
        where('driverId', '==', userId),
        where('timestamp', '>=', timeFilter),
        orderBy('timestamp', 'desc')
      );
    } else {
      stressQuery = query(
        stressRef,
        where('timestamp', '>=', timeFilter),
        orderBy('timestamp', 'desc'),
        limit(40)
      );
    }
    
    const stressSnapshot = await getDocs(stressQuery);
    const stressData = stressSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      stressLevel: this.calculateStressLevel(stressData),
      stressTriggers: this.getStressTriggers(stressData),
      stressReliefTechniques: this.getStressReliefTechniques(stressData),
      breathingExercises: this.getBreathingExercises(stressData),
      meditationSessions: this.getMeditationSessions(stressData),
      stressAlerts: this.getStressAlerts(stressData),
      stressTrends: this.getStressTrends(stressData),
      stressResources: this.getStressResources(stressData)
    };
  }

  async getSleepTracking(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const sleepRef = collection(db, 'sleepTracking');
    let sleepQuery;
    
    if (userId) {
      sleepQuery = query(
        sleepRef,
        where('driverId', '==', userId),
        where('timestamp', '>=', timeFilter),
        orderBy('timestamp', 'desc')
      );
    } else {
      sleepQuery = query(
        sleepRef,
        where('timestamp', '>=', timeFilter),
        orderBy('timestamp', 'desc'),
        limit(30)
      );
    }
    
    const sleepSnapshot = await getDocs(sleepQuery);
    const sleepData = sleepSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      sleepScore: this.calculateSleepScore(sleepData),
      sleepMetrics: {
        duration: this.calculateAverageSleepDuration(sleepData),
        quality: this.calculateSleepQuality(sleepData),
        efficiency: this.calculateSleepEfficiency(sleepData),
        consistency: this.calculateSleepConsistency(sleepData)
      },
      sleepStages: this.getSleepStages(sleepData),
      sleepGoals: this.getSleepGoals(sleepData),
      sleepAlerts: this.getSleepAlerts(sleepData),
      sleepRecommendations: this.getSleepRecommendations(sleepData),
      sleepTrends: this.getSleepTrends(sleepData)
    };
  }

  async getNutritionGuidance(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const nutritionRef = collection(db, 'nutritionGuidance');
    let nutritionQuery;
    
    if (userId) {
      nutritionQuery = query(
        nutritionRef,
        where('driverId', '==', userId),
        where('timestamp', '>=', timeFilter),
        orderBy('timestamp', 'desc')
      );
    } else {
      nutritionQuery = query(
        nutritionRef,
        where('timestamp', '>=', timeFilter),
        orderBy('timestamp', 'desc'),
        limit(40)
      );
    }
    
    const nutritionSnapshot = await getDocs(nutritionQuery);
    const nutritionData = nutritionSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      nutritionScore: this.calculateNutritionScore(nutritionData),
      mealTracking: this.getMealTracking(nutritionData),
      hydrationTracking: this.getHydrationTracking(nutritionData),
      nutritionGoals: this.getNutritionGoals(nutritionData),
      mealRecommendations: this.getMealRecommendations(nutritionData),
      nutritionAlerts: this.getNutritionAlerts(nutritionData),
      nutritionEducation: this.getNutritionEducation(nutritionData),
      nutritionTrends: this.getNutritionTrends(nutritionData)
    };
  }

  async getMentalHealthSupport(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const mentalHealthRef = collection(db, 'mentalHealthSupport');
    let mentalHealthQuery;
    
    if (userId) {
      mentalHealthQuery = query(
        mentalHealthRef,
        where('driverId', '==', userId),
        where('timestamp', '>=', timeFilter),
        orderBy('timestamp', 'desc')
      );
    } else {
      mentalHealthQuery = query(
        mentalHealthRef,
        where('timestamp', '>=', timeFilter),
        orderBy('timestamp', 'desc'),
        limit(30)
      );
    }
    
    const mentalHealthSnapshot = await getDocs(mentalHealthQuery);
    const mentalHealthData = mentalHealthSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      mentalHealthScore: this.calculateMentalHealthScore(mentalHealthData),
      moodTracking: this.getMoodTracking(mentalHealthData),
      mentalHealthResources: this.getMentalHealthResources(mentalHealthData),
      counselingServices: this.getCounselingServices(mentalHealthData),
      mentalHealthAlerts: this.getMentalHealthAlerts(mentalHealthData),
      supportGroups: this.getSupportGroups(mentalHealthData),
      mentalHealthEducation: this.getMentalHealthEducation(mentalHealthData),
      crisisSupport: this.getCrisisSupport(mentalHealthData)
    };
  }

  async getWellnessAnalytics(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const analyticsRef = collection(db, 'wellnessAnalytics');
    let analyticsQuery;
    
    if (userId) {
      analyticsQuery = query(
        analyticsRef,
        where('driverId', '==', userId),
        where('timestamp', '>=', timeFilter),
        orderBy('timestamp', 'desc')
      );
    } else {
      analyticsQuery = query(
        analyticsRef,
        where('timestamp', '>=', timeFilter),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
    }
    
    const analyticsSnapshot = await getDocs(analyticsQuery);
    const analyticsData = analyticsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      wellnessMetrics: this.calculateWellnessMetrics(analyticsData),
      safetyMetrics: this.calculateSafetyMetrics(analyticsData),
      performanceMetrics: this.calculatePerformanceMetrics(analyticsData),
      wellnessImpact: this.calculateWellnessImpact(analyticsData),
      userEngagement: this.calculateUserEngagement(analyticsData),
      improvementSuggestions: this.getImprovementSuggestions(analyticsData)
    };
  }

  // Helper methods for fatigue detection
  calculateFatigueStatus(fatigueData) {
    if (fatigueData.length === 0) return 'Unknown';
    const latestFatigue = fatigueData[0];
    const fatigueLevel = latestFatigue.fatigueLevel || 0;
    
    if (fatigueLevel >= 90) return 'Critical';
    if (fatigueLevel >= 80) return 'Severe';
    if (fatigueLevel >= 60) return 'Moderate';
    if (fatigueLevel >= 30) return 'Mild';
    return 'Alert';
  }

  calculateFatigueLevel(fatigueData) {
    if (fatigueData.length === 0) return 0;
    const recentFatigue = fatigueData.slice(0, 5);
    return recentFatigue.reduce((sum, data) => sum + (data.fatigueLevel || 0), 0) / recentFatigue.length;
  }

  getFatigueAlerts(fatigueData) {
    return fatigueData
      .filter(data => data.fatigueLevel >= 60)
      .slice(0, 10)
      .map(data => ({
        timestamp: data.timestamp,
        level: data.fatigueLevel,
        severity: data.fatigueLevel >= 80 ? 'High' : 'Medium',
        recommendation: this.getFatigueRecommendation(data.fatigueLevel)
      }));
  }

  getFatigueRecommendation(fatigueLevel) {
    if (fatigueLevel >= 90) return 'Immediate rest required';
    if (fatigueLevel >= 80) return 'Take a break within 30 minutes';
    if (fatigueLevel >= 60) return 'Consider taking a short break';
    return 'Continue driving safely';
  }

  getRestRecommendations(fatigueData) {
    return [
      { duration: '15 minutes', frequency: 'Every 2 hours', effectiveness: 'High' },
      { duration: '30 minutes', frequency: 'Every 4 hours', effectiveness: 'Very High' },
      { duration: '1 hour', frequency: 'Every 6 hours', effectiveness: 'Maximum' }
    ];
  }

  getFatigueHistory(fatigueData) {
    return fatigueData
      .slice(0, 20)
      .map(data => ({
        timestamp: data.timestamp,
        level: data.fatigueLevel,
        status: this.calculateFatigueStatus([data])
      }));
  }

  // Helper methods for health monitoring
  getVitalSigns(healthData) {
    if (healthData.length === 0) return {};
    const latestHealth = healthData[0];
    return {
      heartRate: latestHealth.heartRate || 'N/A',
      bloodPressure: latestHealth.bloodPressure || 'N/A',
      temperature: latestHealth.temperature || 'N/A',
      oxygenSaturation: latestHealth.oxygenSaturation || 'N/A',
      lastUpdated: latestHealth.timestamp
    };
  }

  calculateHealthScore(healthData) {
    if (healthData.length === 0) return 0;
    const recentHealth = healthData.slice(0, 10);
    return recentHealth.reduce((sum, data) => sum + (data.healthScore || 0), 0) / recentHealth.length;
  }

  getHealthAlerts(healthData) {
    return healthData
      .filter(data => data.alertLevel === 'high' || data.alertLevel === 'critical')
      .slice(0, 10)
      .map(data => ({
        timestamp: data.timestamp,
        type: data.alertType,
        severity: data.alertLevel,
        message: data.alertMessage
      }));
  }

  getMedicalConditions(healthData) {
    return [
      { condition: 'Hypertension', status: 'Controlled', lastCheck: '2024-01-15' },
      { condition: 'Diabetes', status: 'Well Managed', lastCheck: '2024-01-10' },
      { condition: 'Asthma', status: 'Stable', lastCheck: '2024-01-20' }
    ];
  }

  getMedicationTracking(healthData) {
    return [
      { medication: 'Blood Pressure Meds', taken: true, time: '08:00', dosage: '10mg' },
      { medication: 'Diabetes Meds', taken: true, time: '12:00', dosage: '500mg' },
      { medication: 'Asthma Inhaler', taken: false, time: '16:00', dosage: '2 puffs' }
    ];
  }

  getHealthGoals(healthData) {
    return [
      { goal: 'Maintain BP < 140/90', progress: 85, target: 100 },
      { goal: 'Blood Sugar < 126', progress: 90, target: 100 },
      { goal: 'Exercise 30 min/day', progress: 60, target: 100 }
    ];
  }

  getHealthTrends(healthData) {
    return {
      heartRate: { trend: 'Stable', average: 72, range: '65-80' },
      bloodPressure: { trend: 'Improving', average: '130/85', range: '120-140/80-90' },
      weight: { trend: 'Maintaining', average: 75, range: '73-77' }
    };
  }

  getEmergencyContacts(healthData) {
    return [
      { name: 'Dr. Smith', type: 'Primary Care', phone: '+1-555-0123' },
      { name: 'Emergency Contact', type: 'Family', phone: '+1-555-0124' },
      { name: 'Hospital', type: 'Emergency', phone: '911' }
    ];
  }

  // Helper methods for wellness tracking
  calculateWellnessScore(wellnessData) {
    if (wellnessData.length === 0) return 0;
    const recentWellness = wellnessData.slice(0, 10);
    return recentWellness.reduce((sum, data) => sum + (data.wellnessScore || 0), 0) / recentWellness.length;
  }

  calculatePhysicalWellness(wellnessData) {
    if (wellnessData.length === 0) return 0;
    const recentWellness = wellnessData.slice(0, 10);
    return recentWellness.reduce((sum, data) => sum + (data.physicalWellness || 0), 0) / recentWellness.length;
  }

  calculateMentalWellness(wellnessData) {
    if (wellnessData.length === 0) return 0;
    const recentWellness = wellnessData.slice(0, 10);
    return recentWellness.reduce((sum, data) => sum + (data.mentalWellness || 0), 0) / recentWellness.length;
  }

  calculateSocialWellness(wellnessData) {
    if (wellnessData.length === 0) return 0;
    const recentWellness = wellnessData.slice(0, 10);
    return recentWellness.reduce((sum, data) => sum + (data.socialWellness || 0), 0) / recentWellness.length;
  }

  calculateEmotionalWellness(wellnessData) {
    if (wellnessData.length === 0) return 0;
    const recentWellness = wellnessData.slice(0, 10);
    return recentWellness.reduce((sum, data) => sum + (data.emotionalWellness || 0), 0) / recentWellness.length;
  }

  getWellnessGoals(wellnessData) {
    return [
      { goal: 'Exercise 5 days/week', progress: 80, target: 100 },
      { goal: 'Meditate daily', progress: 60, target: 100 },
      { goal: 'Sleep 8 hours/night', progress: 70, target: 100 },
      { goal: 'Stay hydrated', progress: 90, target: 100 }
    ];
  }

  getWellnessActivities(wellnessData) {
    return [
      { activity: 'Morning Walk', duration: '30 min', completed: true },
      { activity: 'Meditation', duration: '15 min', completed: false },
      { activity: 'Stretching', duration: '10 min', completed: true },
      { activity: 'Deep Breathing', duration: '5 min', completed: true }
    ];
  }

  getWellnessChallenges(wellnessData) {
    return [
      { challenge: '7-Day Exercise Streak', progress: 5, target: 7, reward: '50 points' },
      { challenge: 'Hydration Goal', progress: 6, target: 8, reward: '25 points' },
      { challenge: 'Sleep Consistency', progress: 4, target: 7, reward: '75 points' }
    ];
  }

  getWellnessRewards(wellnessData) {
    return [
      { reward: 'Free Coffee', points: 100, redeemed: false },
      { reward: 'Massage Session', points: 500, redeemed: false },
      { reward: 'Gym Membership', points: 1000, redeemed: false }
    ];
  }

  // Helper methods for safety alerts
  getAlertResponse(alertsData) {
    return {
      averageResponseTime: '2.3 minutes',
      responseRate: '94%',
      escalationRate: '6%',
      satisfactionScore: 4.2
    };
  }

  // Helper methods for stress management
  calculateStressLevel(stressData) {
    if (stressData.length === 0) return 0;
    const recentStress = stressData.slice(0, 5);
    return recentStress.reduce((sum, data) => sum + (data.stressLevel || 0), 0) / recentStress.length;
  }

  getStressTriggers(stressData) {
    return [
      { trigger: 'Heavy Traffic', frequency: 'High', impact: 'Medium' },
      { trigger: 'Difficult Passengers', frequency: 'Medium', impact: 'High' },
      { trigger: 'Long Hours', frequency: 'Medium', impact: 'Medium' },
      { trigger: 'Weather Conditions', frequency: 'Low', impact: 'High' }
    ];
  }

  getStressReliefTechniques(stressData) {
    return [
      { technique: 'Deep Breathing', duration: '5 min', effectiveness: 'High' },
      { technique: 'Progressive Relaxation', duration: '10 min', effectiveness: 'Very High' },
      { technique: 'Mindful Driving', duration: 'Ongoing', effectiveness: 'Medium' },
      { technique: 'Music Therapy', duration: 'Variable', effectiveness: 'High' }
    ];
  }

  getBreathingExercises(stressData) {
    return [
      { name: '4-7-8 Breathing', pattern: 'Inhale 4s, Hold 7s, Exhale 8s', cycles: 4 },
      { name: 'Box Breathing', pattern: 'Inhale 4s, Hold 4s, Exhale 4s, Hold 4s', cycles: 5 },
      { name: 'Diaphragmatic Breathing', pattern: 'Deep belly breathing', cycles: 10 }
    ];
  }

  getMeditationSessions(stressData) {
    return [
      { session: 'Morning Calm', duration: '10 min', type: 'Mindfulness' },
      { session: 'Traffic Relief', duration: '5 min', type: 'Quick Reset' },
      { session: 'Evening Wind Down', duration: '15 min', type: 'Relaxation' }
    ];
  }

  getStressAlerts(stressData) {
    return stressData
      .filter(data => data.stressLevel >= 70)
      .slice(0, 5)
      .map(data => ({
        timestamp: data.timestamp,
        level: data.stressLevel,
        recommendation: 'Take a stress relief break'
      }));
  }

  getStressTrends(stressData) {
    return {
      daily: { trend: 'Decreasing', average: 45 },
      weekly: { trend: 'Stable', average: 50 },
      monthly: { trend: 'Improving', average: 55 }
    };
  }

  getStressResources(stressData) {
    return [
      { resource: 'Stress Management Guide', type: 'PDF', available: true },
      { resource: 'Meditation App', type: 'Mobile App', available: true },
      { resource: 'Counseling Services', type: 'Professional', available: true },
      { resource: 'Support Group', type: 'Community', available: true }
    ];
  }

  // Helper methods for sleep tracking
  calculateSleepScore(sleepData) {
    if (sleepData.length === 0) return 0;
    const recentSleep = sleepData.slice(0, 7);
    return recentSleep.reduce((sum, data) => sum + (data.sleepScore || 0), 0) / recentSleep.length;
  }

  calculateAverageSleepDuration(sleepData) {
    if (sleepData.length === 0) return 0;
    const recentSleep = sleepData.slice(0, 7);
    return recentSleep.reduce((sum, data) => sum + (data.duration || 0), 0) / recentSleep.length;
  }

  calculateSleepQuality(sleepData) {
    if (sleepData.length === 0) return 0;
    const recentSleep = sleepData.slice(0, 7);
    return recentSleep.reduce((sum, data) => sum + (data.quality || 0), 0) / recentSleep.length;
  }

  calculateSleepEfficiency(sleepData) {
    if (sleepData.length === 0) return 0;
    const recentSleep = sleepData.slice(0, 7);
    return recentSleep.reduce((sum, data) => sum + (data.efficiency || 0), 0) / recentSleep.length;
  }

  calculateSleepConsistency(sleepData) {
    if (sleepData.length === 0) return 0;
    const recentSleep = sleepData.slice(0, 7);
    return recentSleep.reduce((sum, data) => sum + (data.consistency || 0), 0) / recentSleep.length;
  }

  getSleepStages(sleepData) {
    if (sleepData.length === 0) return {};
    const latestSleep = sleepData[0];
    return {
      light: latestSleep.lightSleep || 0,
      deep: latestSleep.deepSleep || 0,
      rem: latestSleep.remSleep || 0,
      awake: latestSleep.awakeTime || 0
    };
  }

  getSleepGoals(sleepData) {
    return [
      { goal: 'Sleep 8 hours', progress: 75, target: 100 },
      { goal: 'Bedtime by 11 PM', progress: 60, target: 100 },
      { goal: 'Wake up at 7 AM', progress: 80, target: 100 },
      { goal: 'Sleep quality > 80%', progress: 70, target: 100 }
    ];
  }

  getSleepAlerts(sleepData) {
    return sleepData
      .filter(data => data.duration < 6 || data.quality < 60)
      .slice(0, 5)
      .map(data => ({
        timestamp: data.timestamp,
        issue: data.duration < 6 ? 'Insufficient sleep' : 'Poor sleep quality',
        recommendation: 'Improve sleep hygiene'
      }));
  }

  getSleepRecommendations(sleepData) {
    return [
      { recommendation: 'Maintain consistent bedtime', priority: 'High' },
      { recommendation: 'Avoid screens 1 hour before bed', priority: 'Medium' },
      { recommendation: 'Create a relaxing bedtime routine', priority: 'High' },
      { recommendation: 'Keep bedroom cool and dark', priority: 'Medium' }
    ];
  }

  getSleepTrends(sleepData) {
    return {
      duration: { trend: 'Improving', average: 7.2, target: 8.0 },
      quality: { trend: 'Stable', average: 75, target: 80 },
      efficiency: { trend: 'Improving', average: 85, target: 90 }
    };
  }

  // Helper methods for nutrition guidance
  calculateNutritionScore(nutritionData) {
    if (nutritionData.length === 0) return 0;
    const recentNutrition = nutritionData.slice(0, 7);
    return recentNutrition.reduce((sum, data) => sum + (data.nutritionScore || 0), 0) / recentNutrition.length;
  }

  getMealTracking(nutritionData) {
    return [
      { meal: 'Breakfast', time: '08:00', calories: 450, completed: true },
      { meal: 'Lunch', time: '13:00', calories: 650, completed: true },
      { meal: 'Dinner', time: '19:00', calories: 550, completed: false },
      { meal: 'Snacks', time: 'Throughout', calories: 200, completed: true }
    ];
  }

  getHydrationTracking(nutritionData) {
    return {
      target: 8,
      consumed: 6,
      remaining: 2,
      progress: 75,
      lastDrink: '2 hours ago'
    };
  }

  getNutritionGoals(nutritionData) {
    return [
      { goal: 'Eat 3 balanced meals', progress: 85, target: 100 },
      { goal: 'Drink 8 glasses water', progress: 75, target: 100 },
      { goal: 'Limit processed foods', progress: 60, target: 100 },
      { goal: 'Include protein in meals', progress: 90, target: 100 }
    ];
  }

  getMealRecommendations(nutritionData) {
    return [
      { meal: 'Breakfast', recommendation: 'Oatmeal with berries and nuts', calories: 350 },
      { meal: 'Lunch', recommendation: 'Grilled chicken salad', calories: 450 },
      { meal: 'Dinner', recommendation: 'Salmon with vegetables', calories: 500 },
      { meal: 'Snack', recommendation: 'Greek yogurt with fruit', calories: 150 }
    ];
  }

  getNutritionAlerts(nutritionData) {
    return [
      { alert: 'Low water intake', severity: 'Medium', action: 'Drink more water' },
      { alert: 'Missing breakfast', severity: 'High', action: 'Eat a healthy breakfast' },
      { alert: 'High sodium intake', severity: 'Low', action: 'Reduce salt consumption' }
    ];
  }

  getNutritionEducation(nutritionData) {
    return [
      { topic: 'Healthy Eating on the Road', type: 'Article', duration: '5 min' },
      { topic: 'Meal Prep Tips', type: 'Video', duration: '10 min' },
      { topic: 'Nutrition Myths Debunked', type: 'Infographic', duration: '3 min' }
    ];
  }

  getNutritionTrends(nutritionData) {
    return {
      calories: { trend: 'Stable', average: 1800, target: 2000 },
      hydration: { trend: 'Improving', average: 6, target: 8 },
      mealSkipping: { trend: 'Decreasing', average: 1, target: 0 }
    };
  }

  // Helper methods for mental health support
  calculateMentalHealthScore(mentalHealthData) {
    if (mentalHealthData.length === 0) return 0;
    const recentMentalHealth = mentalHealthData.slice(0, 7);
    return recentMentalHealth.reduce((sum, data) => sum + (data.mentalHealthScore || 0), 0) / recentMentalHealth.length;
  }

  getMoodTracking(mentalHealthData) {
    return [
      { date: '2024-01-20', mood: 'Happy', score: 8, notes: 'Great day driving' },
      { date: '2024-01-19', mood: 'Stressed', score: 4, notes: 'Heavy traffic' },
      { date: '2024-01-18', mood: 'Calm', score: 7, notes: 'Peaceful rides' },
      { date: '2024-01-17', mood: 'Anxious', score: 3, notes: 'Financial worries' }
    ];
  }

  getMentalHealthResources(mentalHealthData) {
    return [
      { resource: '24/7 Crisis Hotline', type: 'Emergency', contact: '1-800-273-8255' },
      { resource: 'Mental Health App', type: 'Self-Help', available: true },
      { resource: 'Therapy Sessions', type: 'Professional', available: true },
      { resource: 'Support Groups', type: 'Community', available: true }
    ];
  }

  getCounselingServices(mentalHealthData) {
    return [
      { service: 'Individual Therapy', provider: 'Dr. Johnson', available: true },
      { service: 'Group Therapy', provider: 'Community Center', available: true },
      { service: 'Online Counseling', provider: 'BetterHelp', available: true },
      { service: 'Crisis Intervention', provider: '24/7 Hotline', available: true }
    ];
  }

  getMentalHealthAlerts(mentalHealthData) {
    return mentalHealthData
      .filter(data => data.mentalHealthScore < 50)
      .slice(0, 5)
      .map(data => ({
        timestamp: data.timestamp,
        score: data.mentalHealthScore,
        recommendation: 'Consider talking to a mental health professional'
      }));
  }

  getSupportGroups(mentalHealthData) {
    return [
      { group: 'Driver Support Network', type: 'Peer Support', meeting: 'Weekly' },
      { group: 'Stress Management', type: 'Skill Building', meeting: 'Bi-weekly' },
      { group: 'Anxiety Support', type: 'Specialized', meeting: 'Monthly' }
    ];
  }

  getMentalHealthEducation(mentalHealthData) {
    return [
      { topic: 'Managing Driving Stress', type: 'Workshop', duration: '1 hour' },
      { topic: 'Mindfulness for Drivers', type: 'Course', duration: '4 weeks' },
      { topic: 'Building Resilience', type: 'Seminar', duration: '2 hours' }
    ];
  }

  getCrisisSupport(mentalHealthData) {
    return {
      hotline: '1-800-273-8255',
      textLine: 'Text HOME to 741741',
      emergency: '911',
      available: '24/7'
    };
  }

  // Helper methods for wellness analytics
  calculateWellnessMetrics(analyticsData) {
    return {
      averageWellnessScore: 75,
      wellnessTrend: 'Improving',
      topWellnessFactors: ['Sleep', 'Exercise', 'Stress Management'],
      wellnessGoals: { set: 8, achieved: 6, progress: 75 }
    };
  }

  calculateSafetyMetrics(analyticsData) {
    return {
      safetyScore: 92,
      incidentRate: '0.5%',
      safetyTrend: 'Improving',
      topSafetyFactors: ['Fatigue Management', 'Health Monitoring', 'Stress Control']
    };
  }

  calculatePerformanceMetrics(analyticsData) {
    return {
      performanceScore: 88,
      efficiency: '94%',
      customerSatisfaction: 4.6,
      earningsImpact: '+15%'
    };
  }

  calculateWellnessImpact(analyticsData) {
    return {
      reducedIncidents: '-40%',
      improvedSatisfaction: '+25%',
      increasedEarnings: '+15%',
      betterRetention: '+30%'
    };
  }

  calculateUserEngagement(analyticsData) {
    return {
      dailyActiveUsers: '85%',
      featureUsage: '78%',
      satisfactionScore: 4.4,
      retentionRate: '92%'
    };
  }

  getImprovementSuggestions(analyticsData) {
    return [
      { suggestion: 'Increase sleep tracking engagement', priority: 'High', impact: 'High' },
      { suggestion: 'Add more stress relief techniques', priority: 'Medium', impact: 'Medium' },
      { suggestion: 'Improve nutrition guidance', priority: 'Low', impact: 'Medium' },
      { suggestion: 'Enhance mental health resources', priority: 'Medium', impact: 'High' }
    ];
  }

  // Additional methods for wellness management
  async updateWellnessSettings(userId, settings) {
    const settingsRef = collection(db, 'wellnessSettings');
    return await addDoc(settingsRef, {
      driverId: userId,
      ...settings,
      updatedAt: new Date()
    });
  }

  async trackWellnessActivity(userId, activity) {
    const activityRef = collection(db, 'wellnessActivities');
    return await addDoc(activityRef, {
      driverId: userId,
      ...activity,
      timestamp: new Date()
    });
  }

  async logHealthData(userId, healthData) {
    const healthRef = collection(db, 'healthMonitoring');
    return await addDoc(healthRef, {
      driverId: userId,
      ...healthData,
      timestamp: new Date()
    });
  }

  async reportFatigue(userId, fatigueData) {
    const fatigueRef = collection(db, 'fatigueDetection');
    return await addDoc(fatigueRef, {
      driverId: userId,
      ...fatigueData,
      timestamp: new Date()
    });
  }

  async createSafetyAlert(userId, alertData) {
    const alertRef = collection(db, 'safetyAlerts');
    return await addDoc(alertRef, {
      driverId: userId,
      ...alertData,
      timestamp: new Date()
    });
  }

  async logSleepData(userId, sleepData) {
    const sleepRef = collection(db, 'sleepTracking');
    return await addDoc(sleepRef, {
      driverId: userId,
      ...sleepData,
      timestamp: new Date()
    });
  }

  async trackNutrition(userId, nutritionData) {
    const nutritionRef = collection(db, 'nutritionGuidance');
    return await addDoc(nutritionRef, {
      driverId: userId,
      ...nutritionData,
      timestamp: new Date()
    });
  }

  async logMentalHealthData(userId, mentalHealthData) {
    const mentalHealthRef = collection(db, 'mentalHealthSupport');
    return await addDoc(mentalHealthRef, {
      driverId: userId,
      ...mentalHealthData,
      timestamp: new Date()
    });
  }

  async submitWellnessFeedback(userId, feedback) {
    const feedbackRef = collection(db, 'wellnessFeedback');
    return await addDoc(feedbackRef, {
      driverId: userId,
      ...feedback,
      submittedAt: new Date()
    });
  }

  async subscribeToWellnessUpdates(userId, callback) {
    const updatesRef = collection(db, 'wellnessUpdates');
    const updatesQuery = query(
      updatesRef,
      where('driverId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    
    return onSnapshot(updatesQuery, (snapshot) => {
      const updates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(updates);
    }, (error) => {
      console.error('Error in wellness updates subscription:', error);
      callback([], error);
    });
  }

  // Emergency and crisis methods
  async triggerEmergencyAlert(userId, emergencyData) {
    const emergencyRef = collection(db, 'emergencyAlerts');
    return await addDoc(emergencyRef, {
      driverId: userId,
      ...emergencyData,
      timestamp: new Date(),
      status: 'active'
    });
  }

  async requestWellnessCheck(userId, checkData) {
    const checkRef = collection(db, 'wellnessChecks');
    return await addDoc(checkRef, {
      driverId: userId,
      ...checkData,
      timestamp: new Date(),
      status: 'pending'
    });
  }

  async scheduleCounseling(userId, counselingData) {
    const counselingRef = collection(db, 'counselingSessions');
    return await addDoc(counselingRef, {
      driverId: userId,
      ...counselingData,
      scheduledAt: new Date(),
      status: 'scheduled'
    });
  }
}

export const wellnessService = new WellnessService();
export default wellnessService; 