import { db } from './firebase/config';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  doc, 
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { Alert, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as Camera from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

class EnhancedSafetyService {
  constructor() {
    this.db = db;
    this.isMonitoring = false;
    this.safetyScore = 100;
    this.incidentThresholds = {
      speed: 80, // mph
      acceleration: 0.3, // g-force
      braking: -0.4, // g-force
      timeThreshold: 5000 // ms
    };
    this.emergencyContacts = [];
    this.safetySettings = {
      autoReport: true,
      emergencyNotifications: true,
      locationSharing: true,
      incidentDetection: true
    };
  }

  /**
   * Initialize enhanced safety service
   * @param {string} driverId - Driver's user ID
   * @returns {Promise<boolean>} Success status
   */
  async initialize(driverId) {
    try {
      this.driverId = driverId;
      
      // Load driver safety profile
      await this.loadSafetyProfile();
      
      // Load emergency contacts
      await this.loadEmergencyContacts();
      
      // Initialize safety monitoring
      await this.initializeSafetyMonitoring();
      
      console.log('✅ Enhanced Safety Service initialized');
      return true;
    } catch (error) {
      console.error('❌ Error initializing Enhanced Safety Service:', error);
      return false;
    }
  }

  /**
   * Load driver safety profile and settings
   */
  async loadSafetyProfile() {
    try {
      const profileDoc = await getDoc(doc(this.db, 'driverSafetyProfiles', this.driverId));
      
      if (profileDoc.exists()) {
        const profile = profileDoc.data();
        this.safetyScore = profile.safetyScore || 100;
        this.safetySettings = { ...this.safetySettings, ...profile.settings };
        this.incidentThresholds = { ...this.incidentThresholds, ...profile.thresholds };
      } else {
        // Create default safety profile
        await this.createDefaultSafetyProfile();
      }
    } catch (error) {
      console.error('Error loading safety profile:', error);
    }
  }

  /**
   * Load emergency contacts
   */
  async loadEmergencyContacts() {
    try {
      const contactsQuery = query(
        collection(this.db, 'driverEmergencyContacts'),
        where('driverId', '==', this.driverId),
        orderBy('priority', 'asc')
      );
      
      const snapshot = await getDocs(contactsQuery);
      this.emergencyContacts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error loading emergency contacts:', error);
    }
  }

  /**
   * Initialize safety monitoring
   */
  async initializeSafetyMonitoring() {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission not granted for safety monitoring');
        return;
      }

      // Start monitoring if enabled
      if (this.safetySettings.incidentDetection) {
        await this.startIncidentMonitoring();
      }
    } catch (error) {
      console.error('Error initializing safety monitoring:', error);
    }
  }

  /**
   * Start incident monitoring
   */
  async startIncidentMonitoring() {
    try {
      this.isMonitoring = true;
      
      // Start location tracking for incident detection
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (location) => {
          this.analyzeLocationData(location);
        }
      );
      
      console.log('🔍 Incident monitoring started');
    } catch (error) {
      console.error('Error starting incident monitoring:', error);
    }
  }

  /**
   * Stop incident monitoring
   */
  async stopIncidentMonitoring() {
    try {
      this.isMonitoring = false;
      
      if (this.locationSubscription) {
        this.locationSubscription.remove();
        this.locationSubscription = null;
      }
      
      console.log('🛑 Incident monitoring stopped');
    } catch (error) {
      console.error('Error stopping incident monitoring:', error);
    }
  }

  /**
   * Analyze location data for incident detection
   * @param {Object} location - Location data
   */
  analyzeLocationData(location) {
    if (!this.lastLocation) {
      this.lastLocation = location;
      return;
    }

    const timeDiff = location.timestamp - this.lastLocation.timestamp;
    const distance = this.calculateDistance(
      this.lastLocation.coords,
      location.coords
    );

    // Calculate speed (m/s to mph)
    const speed = (distance / (timeDiff / 1000)) * 2.237;
    
    // Calculate acceleration
    const acceleration = this.calculateAcceleration(
      this.lastLocation.coords,
      location.coords,
      timeDiff
    );

    // Check for incidents
    this.checkForIncidents(speed, acceleration, location);

    this.lastLocation = location;
  }

  /**
   * Check for safety incidents
   * @param {number} speed - Current speed in mph
   * @param {number} acceleration - Current acceleration in g-force
   * @param {Object} location - Current location
   */
  checkForIncidents(speed, acceleration, location) {
    const incidents = [];

    // Speed incident
    if (speed > this.incidentThresholds.speed) {
      incidents.push({
        type: 'speeding',
        severity: speed > this.incidentThresholds.speed * 1.2 ? 'high' : 'medium',
        value: speed,
        threshold: this.incidentThresholds.speed,
        location: location.coords
      });
    }

    // Hard acceleration
    if (acceleration > this.incidentThresholds.acceleration) {
      incidents.push({
        type: 'hard_acceleration',
        severity: acceleration > this.incidentThresholds.acceleration * 1.5 ? 'high' : 'medium',
        value: acceleration,
        threshold: this.incidentThresholds.acceleration,
        location: location.coords
      });
    }

    // Hard braking
    if (acceleration < this.incidentThresholds.braking) {
      incidents.push({
        type: 'hard_braking',
        severity: Math.abs(acceleration) > Math.abs(this.incidentThresholds.braking) * 1.5 ? 'high' : 'medium',
        value: acceleration,
        threshold: this.incidentThresholds.braking,
        location: location.coords
      });
    }

    // Process incidents
    incidents.forEach(incident => {
      this.handleIncident(incident);
    });
  }

  /**
   * Handle detected incident
   * @param {Object} incident - Incident data
   */
  async handleIncident(incident) {
    try {
      // Update safety score
      this.updateSafetyScore(incident);

      // Log incident
      await this.logIncident(incident);

      // Auto-report if enabled and severity is high
      if (this.safetySettings.autoReport && incident.severity === 'high') {
        await this.autoReportIncident(incident);
      }

      // Notify driver
      this.notifyDriver(incident);
    } catch (error) {
      console.error('Error handling incident:', error);
    }
  }

  /**
   * Update safety score based on incident
   * @param {Object} incident - Incident data
   */
  updateSafetyScore(incident) {
    const penalties = {
      speeding: { low: 2, medium: 5, high: 10 },
      hard_acceleration: { low: 1, medium: 3, high: 6 },
      hard_braking: { low: 1, medium: 3, high: 6 }
    };

    const penalty = penalties[incident.type]?.[incident.severity] || 1;
    this.safetyScore = Math.max(0, this.safetyScore - penalty);

    // Update in database
    this.updateSafetyScoreInDB();
  }

  /**
   * Log incident to database
   * @param {Object} incident - Incident data
   */
  async logIncident(incident) {
    try {
      await addDoc(collection(this.db, 'safetyIncidents'), {
        driverId: this.driverId,
        type: incident.type,
        severity: incident.severity,
        value: incident.value,
        threshold: incident.threshold,
        location: incident.location,
        timestamp: serverTimestamp(),
        safetyScore: this.safetyScore,
        autoReported: this.safetySettings.autoReport && incident.severity === 'high'
      });
    } catch (error) {
      console.error('Error logging incident:', error);
    }
  }

  /**
   * Auto-report high severity incidents
   * @param {Object} incident - Incident data
   */
  async autoReportIncident(incident) {
    try {
      // Create incident report
      const report = {
        driverId: this.driverId,
        incidentType: incident.type,
        severity: incident.severity,
        location: incident.location,
        timestamp: new Date(),
        autoReported: true,
        status: 'pending_review'
      };

      // Save to database
      await addDoc(collection(this.db, 'incidentReports'), report);

      // Notify emergency contacts if enabled
      if (this.safetySettings.emergencyNotifications) {
        await this.notifyEmergencyContacts(incident);
      }

      console.log('🚨 Auto-reported incident:', incident.type);
    } catch (error) {
      console.error('Error auto-reporting incident:', error);
    }
  }

  /**
   * Notify driver of incident
   * @param {Object} incident - Incident data
   */
  notifyDriver(incident) {
    const messages = {
      speeding: `⚠️ Speed Alert: ${incident.value.toFixed(0)} mph (limit: ${incident.threshold} mph)`,
      hard_acceleration: `⚠️ Hard Acceleration Detected`,
      hard_braking: `⚠️ Hard Braking Detected`
    };

    const message = messages[incident.type] || '⚠️ Safety Incident Detected';
    
    Alert.alert(
      'Safety Alert',
      message,
      [
        { text: 'OK', style: 'default' },
        { 
          text: 'Report Incident', 
          onPress: () => this.manualReportIncident(incident)
        }
      ]
    );
  }

  /**
   * Manual incident reporting
   * @param {Object} incident - Incident data (optional)
   */
  async manualReportIncident(incident = null) {
    try {
      // Get current location
      const location = await Location.getCurrentPositionAsync({});
      
      const report = {
        driverId: this.driverId,
        incidentType: incident?.type || 'manual_report',
        severity: incident?.severity || 'medium',
        location: location.coords,
        timestamp: new Date(),
        autoReported: false,
        status: 'pending_review',
        description: '',
        evidence: []
      };

      // Save to database
      const docRef = await addDoc(collection(this.db, 'incidentReports'), report);
      
      // Show incident reporting interface
      this.showIncidentReportingInterface(docRef.id, report);
    } catch (error) {
      console.error('Error creating manual incident report:', error);
    }
  }

  /**
   * Show incident reporting interface
   * @param {string} reportId - Report ID
   * @param {Object} report - Report data
   */
  showIncidentReportingInterface(reportId, report) {
    Alert.alert(
      'Report Incident',
      'Would you like to add photos or additional details?',
      [
        { text: 'Add Photos', onPress: () => this.addIncidentPhotos(reportId) },
        { text: 'Add Details', onPress: () => this.addIncidentDetails(reportId) },
        { text: 'Submit Report', onPress: () => this.submitIncidentReport(reportId) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  }

  /**
   * Add photos to incident report
   * @param {string} reportId - Report ID
   */
  async addIncidentPhotos(reportId) {
    try {
      // Request camera permissions
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is needed to take photos');
        return;
      }

      // Request media library permissions
      const mediaStatus = await MediaLibrary.requestPermissionsAsync();
      if (mediaStatus.status !== 'granted') {
        Alert.alert('Permission Required', 'Media library permission is needed to save photos');
        return;
      }

      // Show camera interface
      Alert.alert(
        'Add Photos',
        'Take photos of the incident scene',
        [
          { text: 'Take Photo', onPress: () => this.takeIncidentPhoto(reportId) },
          { text: 'Choose from Library', onPress: () => this.chooseIncidentPhoto(reportId) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } catch (error) {
      console.error('Error adding incident photos:', error);
    }
  }

  /**
   * Take incident photo
   * @param {string} reportId - Report ID
   */
  async takeIncidentPhoto(reportId) {
    try {
      // This would integrate with camera component
      // For now, we'll simulate photo capture
      const photoData = {
        uri: 'simulated_photo_uri',
        timestamp: new Date(),
        location: await Location.getCurrentPositionAsync({})
      };

      // Add photo to report
      await this.addPhotoToReport(reportId, photoData);
      
      Alert.alert('Photo Added', 'Photo has been added to the incident report');
    } catch (error) {
      console.error('Error taking incident photo:', error);
    }
  }

  /**
   * Add photo to incident report
   * @param {string} reportId - Report ID
   * @param {Object} photoData - Photo data
   */
  async addPhotoToReport(reportId, photoData) {
    try {
      await updateDoc(doc(this.db, 'incidentReports', reportId), {
        evidence: [photoData],
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding photo to report:', error);
    }
  }

  /**
   * Add details to incident report
   * @param {string} reportId - Report ID
   */
  addIncidentDetails(reportId) {
    // This would show a form for adding incident details
    // For now, we'll simulate adding details
    Alert.prompt(
      'Incident Details',
      'Please describe what happened:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Save', 
          onPress: (description) => this.saveIncidentDetails(reportId, description)
        }
      ]
    );
  }

  /**
   * Save incident details
   * @param {string} reportId - Report ID
   * @param {string} description - Incident description
   */
  async saveIncidentDetails(reportId, description) {
    try {
      await updateDoc(doc(this.db, 'incidentReports', reportId), {
        description: description,
        updatedAt: serverTimestamp()
      });
      
      Alert.alert('Details Saved', 'Incident details have been saved');
    } catch (error) {
      console.error('Error saving incident details:', error);
    }
  }

  /**
   * Submit incident report
   * @param {string} reportId - Report ID
   */
  async submitIncidentReport(reportId) {
    try {
      await updateDoc(doc(this.db, 'incidentReports', reportId), {
        status: 'submitted',
        submittedAt: serverTimestamp()
      });
      
      Alert.alert('Report Submitted', 'Your incident report has been submitted for review');
    } catch (error) {
      console.error('Error submitting incident report:', error);
    }
  }

  /**
   * Notify emergency contacts
   * @param {Object} incident - Incident data
   */
  async notifyEmergencyContacts(incident) {
    try {
      for (const contact of this.emergencyContacts) {
        if (contact.notificationsEnabled) {
          // Send notification to emergency contact
          await this.sendEmergencyNotification(contact, incident);
        }
      }
    } catch (error) {
      console.error('Error notifying emergency contacts:', error);
    }
  }

  /**
   * Send emergency notification
   * @param {Object} contact - Emergency contact
   * @param {Object} incident - Incident data
   */
  async sendEmergencyNotification(contact, incident) {
    try {
      // This would integrate with push notification service
      // For now, we'll log the notification
      console.log(`📱 Sending emergency notification to ${contact.name}:`, incident);
      
      // Save notification record
      await addDoc(collection(this.db, 'emergencyNotifications'), {
        driverId: this.driverId,
        contactId: contact.id,
        contactName: contact.name,
        incidentType: incident.type,
        severity: incident.severity,
        timestamp: serverTimestamp(),
        status: 'sent'
      });
    } catch (error) {
      console.error('Error sending emergency notification:', error);
    }
  }

  /**
   * Get safety analytics
   * @param {string} timeRange - Time range for analytics
   * @returns {Promise<Object>} Safety analytics
   */
  async getSafetyAnalytics(timeRange = '30d') {
    try {
      const dateRange = this.getDateRange(timeRange);
      
      // Get incidents
      const incidentsQuery = query(
        collection(this.db, 'safetyIncidents'),
        where('driverId', '==', this.driverId),
        where('timestamp', '>=', dateRange.start),
        where('timestamp', '<=', dateRange.end),
        orderBy('timestamp', 'desc')
      );

      const incidentsSnapshot = await getDocs(incidentsQuery);
      const incidents = incidentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Get reports
      const reportsQuery = query(
        collection(this.db, 'incidentReports'),
        where('driverId', '==', this.driverId),
        where('timestamp', '>=', dateRange.start),
        where('timestamp', '<=', dateRange.end),
        orderBy('timestamp', 'desc')
      );

      const reportsSnapshot = await getDocs(reportsQuery);
      const reports = reportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calculate analytics
      return this.calculateSafetyAnalytics(incidents, reports);
    } catch (error) {
      console.error('Error getting safety analytics:', error);
      return this.getDefaultSafetyAnalytics();
    }
  }

  /**
   * Calculate safety analytics
   * @param {Array} incidents - Incidents data
   * @param {Array} reports - Reports data
   * @returns {Object} Calculated analytics
   */
  calculateSafetyAnalytics(incidents, reports) {
    const analytics = {
      currentSafetyScore: this.safetyScore,
      totalIncidents: incidents.length,
      totalReports: reports.length,
      incidentTypes: {},
      severityBreakdown: { low: 0, medium: 0, high: 0 },
      trends: {},
      recommendations: []
    };

    // Analyze incidents
    incidents.forEach(incident => {
      // Count by type
      analytics.incidentTypes[incident.type] = (analytics.incidentTypes[incident.type] || 0) + 1;
      
      // Count by severity
      analytics.severityBreakdown[incident.severity] = (analytics.severityBreakdown[incident.severity] || 0) + 1;
    });

    // Generate recommendations
    analytics.recommendations = this.generateSafetyRecommendations(analytics);

    return analytics;
  }

  /**
   * Generate safety recommendations
   * @param {Object} analytics - Safety analytics
   * @returns {Array} Recommendations
   */
  generateSafetyRecommendations(analytics) {
    const recommendations = [];

    if (analytics.incidentTypes.speeding > 5) {
      recommendations.push({
        type: 'speeding',
        priority: 'high',
        title: 'Reduce Speeding Incidents',
        description: 'Consider using cruise control and speed limit alerts',
        action: 'Enable speed alerts in settings'
      });
    }

    if (analytics.incidentTypes.hard_braking > 3) {
      recommendations.push({
        type: 'braking',
        priority: 'medium',
        title: 'Improve Braking Habits',
        description: 'Maintain greater following distance to avoid hard braking',
        action: 'Practice defensive driving techniques'
      });
    }

    if (analytics.currentSafetyScore < 80) {
      recommendations.push({
        type: 'general',
        priority: 'high',
        title: 'Improve Overall Safety Score',
        description: 'Focus on reducing all types of safety incidents',
        action: 'Review safety tips and best practices'
      });
    }

    return recommendations;
  }

  /**
   * Update safety score in database
   */
  async updateSafetyScoreInDB() {
    try {
      await updateDoc(doc(this.db, 'driverSafetyProfiles', this.driverId), {
        safetyScore: this.safetyScore,
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating safety score:', error);
    }
  }

  /**
   * Create default safety profile
   */
  async createDefaultSafetyProfile() {
    try {
      await setDoc(doc(this.db, 'driverSafetyProfiles', this.driverId), {
        driverId: this.driverId,
        safetyScore: 100,
        settings: this.safetySettings,
        thresholds: this.incidentThresholds,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating default safety profile:', error);
    }
  }

  // Helper methods
  calculateDistance(coord1, coord2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = coord1.latitude * Math.PI/180;
    const φ2 = coord2.latitude * Math.PI/180;
    const Δφ = (coord2.latitude - coord1.latitude) * Math.PI/180;
    const Δλ = (coord2.longitude - coord1.longitude) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  calculateAcceleration(coord1, coord2, timeDiff) {
    // Simplified acceleration calculation
    // In a real implementation, this would be more sophisticated
    const distance = this.calculateDistance(coord1, coord2);
    const speed = distance / (timeDiff / 1000);
    return speed / 9.81; // Convert to g-force
  }

  getDateRange(timeRange) {
    const now = new Date();
    const start = new Date();
    
    switch (timeRange) {
      case '7d':
        start.setDate(now.getDate() - 7);
        break;
      case '30d':
        start.setDate(now.getDate() - 30);
        break;
      case '90d':
        start.setDate(now.getDate() - 90);
        break;
      default:
        start.setDate(now.getDate() - 30);
    }
    
    return { start, end: now };
  }

  getDefaultSafetyAnalytics() {
    return {
      currentSafetyScore: 100,
      totalIncidents: 0,
      totalReports: 0,
      incidentTypes: {},
      severityBreakdown: { low: 0, medium: 0, high: 0 },
      trends: {},
      recommendations: []
    };
  }
}

// Export singleton instance
export default new EnhancedSafetyService();
