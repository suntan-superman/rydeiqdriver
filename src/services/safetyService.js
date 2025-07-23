import { db } from './firebase/config';
import { collection, query, where, orderBy, getDoc, getDocs, doc, addDoc, updateDoc, deleteDoc, limit } from 'firebase/firestore';

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

class SafetyService {
  async getSafetyDashboard(userId = null, timeRange = '30d') {
    // Emergency protocols
    const emergencyProtocols = await this.getEmergencyProtocols();
    // Safety analytics
    const safetyAnalytics = await this.getSafetyAnalytics(userId, timeRange);
    // Driver protection
    const driverProtection = await this.getDriverProtection(userId);
    // Incident reporting
    const incidentReporting = await this.getIncidentReporting(userId, timeRange);
    // Safety alerts
    const safetyAlerts = await this.getSafetyAlerts(timeRange);
    // Safety training
    const safetyTraining = await this.getSafetyTraining(userId);
    // Safety tools
    const safetyTools = await this.getSafetyTools();
    // Safety recommendations
    const safetyRecommendations = await this.getSafetyRecommendations(userId);
    
    return {
      emergencyProtocols,
      safetyAnalytics,
      driverProtection,
      incidentReporting,
      safetyAlerts,
      safetyTraining,
      safetyTools,
      safetyRecommendations,
      timestamp: Date.now()
    };
  }

  async getEmergencyProtocols() {
    // Mock emergency protocols data
    return {
      emergencyContacts: [
        { name: 'Emergency Services', number: '911', type: 'Emergency' },
        { name: 'RydeIQ Safety', number: '1-800-SAFETY', type: 'Platform' },
        { name: 'Local Police', number: '555-0123', type: 'Law Enforcement' }
      ],
      emergencyProcedures: [
        { title: 'Accident Response', steps: ['Stop safely', 'Call 911', 'Document scene', 'Contact platform'] },
        { title: 'Medical Emergency', steps: ['Assess situation', 'Call 911', 'Provide first aid', 'Contact platform'] },
        { title: 'Threat Response', steps: ['Stay calm', 'Call 911', 'Drive to safe location', 'Contact platform'] }
      ],
      panicButton: {
        enabled: true,
        location: 'HomeScreen',
        actions: ['Call 911', 'Alert Platform', 'Share Location']
      }
    };
  }

  async getSafetyAnalytics(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    let incidentsQuery;
    const incidentsRef = collection(db, 'safetyIncidents');
    
    if (userId) {
      incidentsQuery = query(
        incidentsRef,
        where('driverId', '==', userId),
        where('createdAt', '>=', timeFilter),
        orderBy('createdAt', 'desc')
      );
    } else {
      incidentsQuery = query(
        incidentsRef,
        where('createdAt', '>=', timeFilter),
        orderBy('createdAt', 'desc')
      );
    }
    
    const incidentsSnapshot = await getDocs(incidentsQuery);
    const incidents = incidentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      totalIncidents: incidents.length,
      incidentTypes: {
        accident: incidents.filter(i => i.type === 'accident').length,
        medical: incidents.filter(i => i.type === 'medical').length,
        threat: incidents.filter(i => i.type === 'threat').length,
        mechanical: incidents.filter(i => i.type === 'mechanical').length
      },
      safetyScore: this.calculateSafetyScore(incidents),
      averageResponseTime: '2.1 minutes',
      safetyTrend: '+15% improvement'
    };
  }

  async getDriverProtection(userId) {
    // Mock driver protection data
    return {
      insurance: {
        status: 'Active',
        provider: 'RydeIQ Insurance',
        coverage: '$1,000,000',
        expires: '2024-12-31'
      },
      backgroundCheck: {
        status: 'Passed',
        lastUpdated: '2024-01-15',
        nextCheck: '2025-01-15'
      },
      vehicleInspection: {
        status: 'Passed',
        lastInspection: '2024-01-10',
        nextInspection: '2024-07-10'
      },
      safetyEquipment: {
        dashcam: 'Installed',
        emergencyKit: 'Present',
        firstAidKit: 'Present',
        fireExtinguisher: 'Present'
      }
    };
  }

  async getIncidentReporting(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const reportsRef = collection(db, 'incidentReports');
    let reportsQuery;
    
    if (userId) {
      reportsQuery = query(
        reportsRef,
        where('driverId', '==', userId),
        where('createdAt', '>=', timeFilter),
        orderBy('createdAt', 'desc')
      );
    } else {
      reportsQuery = query(
        reportsRef,
        where('createdAt', '>=', timeFilter),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
    }
    
    const reportsSnapshot = await getDocs(reportsQuery);
    const reports = reportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      reports,
      totalReports: reports.length,
      reportTypes: ['Accident', 'Medical', 'Threat', 'Mechanical', 'Other'],
      averageResolutionTime: '3.2 days'
    };
  }

  async getSafetyAlerts(timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const alertsRef = collection(db, 'safetyAlerts');
    const alertsQuery = query(
      alertsRef,
      where('createdAt', '>=', timeFilter),
      where('active', '==', true),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    
    const alertsSnapshot = await getDocs(alertsQuery);
    const alerts = alertsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      activeAlerts: alerts,
      totalAlerts: alerts.length,
      alertTypes: ['Weather', 'Traffic', 'Crime', 'Road Conditions', 'Platform']
    };
  }

  async getSafetyTraining(userId) {
    // Mock safety training data
    return {
      completedCourses: [
        { name: 'Defensive Driving', completed: '2024-01-15', score: 95 },
        { name: 'Emergency Response', completed: '2024-01-20', score: 88 },
        { name: 'Customer Safety', completed: '2024-01-25', score: 92 }
      ],
      upcomingCourses: [
        { name: 'Advanced Safety Protocols', date: '2024-02-15', required: true },
        { name: 'First Aid Certification', date: '2024-03-01', required: false }
      ],
      trainingProgress: 75,
      nextRequiredTraining: '2024-02-15'
    };
  }

  async getSafetyTools() {
    // Mock safety tools data
    return {
      availableTools: [
        { name: 'Panic Button', status: 'Active', location: 'HomeScreen' },
        { name: 'Emergency Contact', status: 'Configured', contacts: 3 },
        { name: 'Location Sharing', status: 'Active', recipients: 2 },
        { name: 'Voice Recording', status: 'Available', autoRecord: true },
        { name: 'Safety Check-in', status: 'Scheduled', frequency: 'Every 4 hours' }
      ],
      safetyFeatures: {
        realTimeTracking: true,
        emergencyResponse: true,
        incidentDocumentation: true,
        safetyNotifications: true
      }
    };
  }

  async getSafetyRecommendations(userId) {
    // Mock safety recommendations based on user activity
    return {
      immediateActions: [
        { action: 'Update emergency contacts', priority: 'High' },
        { action: 'Complete safety training', priority: 'Medium' },
        { action: 'Check vehicle inspection', priority: 'Low' }
      ],
      safetyTips: [
        'Always check your surroundings before starting a ride',
        'Keep emergency contacts easily accessible',
        'Maintain regular vehicle maintenance',
        'Stay alert during night shifts'
      ],
      preventiveMeasures: [
        'Install dashcam for documentation',
        'Join safety-focused driver groups',
        'Attend monthly safety workshops',
        'Review incident reports regularly'
      ]
    };
  }

  calculateSafetyScore(incidents) {
    if (incidents.length === 0) return 100;
    const severityScores = {
      low: 10,
      medium: 25,
      high: 50,
      critical: 100
    };
    
    const totalDeduction = incidents.reduce((sum, incident) => {
      return sum + (severityScores[incident.severity] || 25);
    }, 0);
    
    return Math.max(0, 100 - totalDeduction);
  }

  // Additional methods for safety interactions
  async reportIncident(incidentData) {
    const reportsRef = collection(db, 'incidentReports');
    return await addDoc(reportsRef, {
      ...incidentData,
      createdAt: new Date(),
      status: 'pending',
      reviewed: false
    });
  }

  async updateEmergencyContacts(contacts) {
    // This would typically update user profile
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      emergencyContacts: contacts,
      updatedAt: new Date()
    });
  }

  async triggerPanicAlert(userId, location) {
    const alertsRef = collection(db, 'panicAlerts');
    return await addDoc(alertsRef, {
      driverId: userId,
      location,
      timestamp: new Date(),
      status: 'active',
      responded: false
    });
  }
}

export const safetyService = new SafetyService();
export default safetyService; 