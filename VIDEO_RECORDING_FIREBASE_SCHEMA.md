# Video Recording Feature - Firebase Schema & Rules
*Technical Implementation Details*

## 📋 Overview

This document provides the detailed Firebase Firestore schema updates, security rules, and migration scripts needed to implement the video recording feature.

---

## 🗄️ Firestore Schema Updates

### 1. driverApplications Collection

#### Before (Current Schema)
```javascript
driverApplications/{driverId}
{
  userId: "driver123",
  email: "driver@example.com",
  displayName: "John Driver",
  phoneNumber: "+1234567890",
  status: "available",
  isOnline: true,
  location: { latitude: 35.3733, longitude: -119.0187 },
  vehicle_info: {
    make: "Toyota",
    model: "Camry",
    year: 2020,
    color: "Silver",
    licensePlate: "ABC123",
    vehicleType: "standard"
  },
  specialtyVehicleInfo: {
    specialtyVehicleType: "",
    serviceCapabilities: []
  }
}
```

#### After (With Video Capability)
```javascript
driverApplications/{driverId}
{
  // ... all existing fields unchanged ...
  
  // NEW FIELD: Video Recording Capability
  videoRecordingCapability: {
    // Equipment Status
    hasEquipment: false,                              // boolean
    equipmentType: null,                              // string | null
    certificationDate: null,                          // timestamp | null
    certificationStatus: "not_started",               // "not_started" | "pending" | "certified" | "expired" | "revoked"
    equipmentVerified: false,                         // boolean
    equipmentVerifiedDate: null,                      // timestamp | null
    equipmentVerifiedBy: null,                        // string (adminId) | null
    
    // Camera Hardware Details
    cameraInfo: {
      brand: null,                                    // string | null - "Vantrue", "VIOFO", "Garmin", "Other"
      model: null,                                    // string | null - "N2 Pro", "A129 Duo IR", etc.
      purchaseDate: null,                             // timestamp | null
      serialNumber: null,                             // string | null
      hasInteriorCamera: false,                       // boolean
      hasAudioRecording: false,                       // boolean
      storageCapacityGB: 0,                           // number
      storageType: null,                              // string | null - "microSD", "internal"
      resolution: null,                               // string | null - "1080p", "1440p", "4K"
      nightVisionCapable: false,                      // boolean
      lastMaintenanceCheck: null,                     // timestamp | null
      maintenanceNotes: []                            // array of strings
    },
    
    // Legal Compliance
    privacyNoticePosted: false,                       // boolean - sticker visible
    privacyNoticePhotoUrl: null,                      // string | null - proof photo
    audioConsentCapable: false,                       // boolean - can record audio legally
    statesCompliant: [],                              // array of strings - ["CA", "TX"]
    twoPartyConsentAcknowledged: false,               // boolean
    
    // Training & Certification
    trainingCompleted: false,                         // boolean
    trainingCompletedDate: null,                      // timestamp | null
    trainingModuleVersion: null,                      // string | null - "v1.0"
    certificationExpiresAt: null,                     // timestamp | null - annual renewal
    recertificationRequired: false,                   // boolean
    
    // Preferences & Settings
    autoAcceptRecordingRequests: false,               // boolean
    defaultRecordingMode: "video_only",               // "video_only" | "video_audio" | "ask_each_time"
    preRideReminderEnabled: true,                     // boolean
    voiceCommandsEnabled: false,                      // boolean
    
    // Statistics & Tracking
    totalRecordedRides: 0,                            // number
    totalRecordingHours: 0,                           // number
    totalRecordingSizeGB: 0,                          // number
    incidentsReported: 0,                             // number
    incidentsResolved: 0,                             // number
    lastRecordingDate: null,                          // timestamp | null
    averageRiderRatingForRecordedRides: 0,            // number
    recordingRequestAcceptanceRate: 100,              // number (percentage)
    
    // Operational Flags
    isCurrentlyRecording: false,                      // boolean
    currentRecordingRideId: null,                     // string | null
    storageWarningShown: false,                       // boolean - when storage > 80%
    equipmentMalfunctionReported: false,              // boolean
    lastEquipmentCheckDate: null,                     // timestamp | null
    
    // Metadata
    capabilityCreatedAt: null,                        // timestamp | null
    capabilityUpdatedAt: null,                        // timestamp | null
    capabilityCreatedBy: null,                        // string | null - "driver" | "admin"
    capabilityNotes: []                               // array of objects
  }
}
```

### 2. rideRequests Collection

#### Schema Addition
```javascript
rideRequests/{requestId}
{
  // ... all existing fields ...
  
  // NEW FIELDS: Video Recording Request
  videoRecordingRequested: false,                     // boolean - rider wants recording
  videoRecordingRequired: false,                      // boolean - hard requirement vs preference
  videoRecordingReason: null,                         // string | null - "safety", "insurance", "elderly_passenger", "minor_passenger"
  
  // Recording Consent Tracking
  recordingConsent: {
    // Rider Consent
    riderConsented: false,                            // boolean
    riderConsentTimestamp: null,                      // timestamp | null
    riderConsentMethod: null,                         // string | null - "in_app_toggle" | "verbal_confirmed"
    riderConsentIpAddress: null,                      // string | null
    riderConsentDeviceInfo: null,                     // string | null
    
    // Driver Consent
    driverConsented: false,                           // boolean
    driverConsentTimestamp: null,                     // timestamp | null
    driverConsentMethod: null,                        // string | null - "app_button" | "voice_command" | "pre_approved"
    
    // Audio Consent (Separate due to two-party laws)
    audioRecordingRequested: false,                   // boolean
    riderAudioConsented: false,                       // boolean
    driverAudioConsented: false,                      // boolean
    audioConsentTimestamp: null,                      // timestamp | null
    
    // Final Decision
    finalRecordingMode: "none",                       // "none" | "video_only" | "video_audio"
    consentAgreementVersion: null,                    // string | null - "v1.0" for legal tracking
    bothPartiesAgreed: false                          // boolean
  },
  
  // Recording Status
  recordingStatus: {
    isActive: false,                                  // boolean
    isPaused: false,                                  // boolean
    startedAt: null,                                  // timestamp | null
    pausedAt: null,                                   // timestamp | null
    resumedAt: null,                                  // timestamp | null
    stoppedAt: null,                                  // timestamp | null
    durationSeconds: 0,                               // number
    
    // Video Metadata
    videoMetadata: {
      cameraModel: null,                              // string | null
      resolution: null,                               // string | null
      fileFormat: null,                               // string | null - "mp4", "mov"
      estimatedFileSizeMB: 0,                         // number
      sdCardLocation: null,                           // string | null
      filePath: null,                                 // string | null - local path on device
      fileHash: null,                                 // string | null - SHA256 for integrity
      isCorrupted: false,                             // boolean
      qualityCheckPassed: null                        // boolean | null
    },
    
    // Technical Issues
    recordingInterruptions: [],                       // array of { timestamp, reason, durationSeconds }
    technicalIssues: [],                              // array of strings
    driverNotifications: []                           // array of { type, timestamp, acknowledged }
  },
  
  // Video Lifecycle
  videoLifecycle: {
    autoDeleteScheduledFor: null,                     // timestamp | null - now + 72 hours
    retentionExtended: false,                         // boolean
    retentionReason: null,                            // string | null - "incident", "dispute", "legal_hold"
    retentionExtendedUntil: null,                     // timestamp | null
    deleteAfterDays: 3,                               // number - configurable
    markedForDeletion: false,                         // boolean
    deletedAt: null,                                  // timestamp | null
    deletionMethod: null,                             // string | null - "auto" | "manual" | "incident_resolved"
    deletionConfirmedBy: null                         // string | null
  }
}
```

### 3. activeRides Collection

#### Schema Addition
```javascript
activeRides/{rideId}
{
  // ... all existing fields ...
  
  // NEW FIELDS: Active Recording State
  activeRecording: {
    isRecording: false,                               // boolean
    recordingMode: "none",                            // "none" | "video_only" | "video_audio"
    startedAt: null,                                  // timestamp | null
    currentDurationSeconds: 0,                        // number - updated every 30 sec
    
    // Manual Controls
    manuallyPaused: false,                            // boolean
    pausedBy: null,                                   // string | null - "driver" | "system"
    pausedReason: null,                               // string | null
    
    // Toggle History (Audit Trail)
    toggleHistory: [
      // {
      //   action: "started",                          // "started" | "paused" | "resumed" | "stopped" | "mode_changed"
      //   timestamp: timestamp,
      //   initiatedBy: "driver",                      // "driver" | "system" | "rider_request"
      //   previousMode: "none",
      //   newMode: "video_only",
      //   reason: "rider_requested",                  // optional
      //   locationAtToggle: { lat, lng }              // optional
      // }
    ],
    
    // Real-time Checks
    lastHeartbeat: null,                              // timestamp | null - camera still recording
    missedHeartbeats: 0,                              // number - alert if > 3
    storageRemainingGB: 0,                            // number
    storageWarningTriggered: false,                   // boolean
    batteryLevel: 0,                                  // number - camera battery if wireless
    
    // Incident Management
    incidentFlagged: false,                           // boolean
    incidentFlaggedAt: null,                          // timestamp | null
    incidentType: null,                               // string | null - "safety" | "dispute" | "damage" | "harassment" | "other"
    incidentSeverity: null,                           // string | null - "low" | "medium" | "high" | "critical"
    incidentDescription: null,                        // string | null
    incidentFlaggedBy: null,                          // string | null - "driver" | "rider" | "system"
    incidentLocation: null,                           // { latitude, longitude } | null
    incidentTimestamp: null,                          // timestamp | null - specific moment
    incidentRequiresReview: false,                    // boolean
    
    // Retention Override
    retentionExtended: false,                         // boolean
    retentionUntil: null,                             // timestamp | null
    retentionExtendedBy: null,                        // string | null - userId
    retentionExtensionReason: null,                   // string | null
    
    // Notifications
    driverNotifiedOfRecording: false,                 // boolean
    riderNotifiedOfRecording: false,                  // boolean
    bothPartiesAcknowledged: false                    // boolean
  },
  
  // Recording Compliance Checks
  recordingCompliance: {
    privacyNoticeSeen: false,                         // boolean
    consentReconfirmedDuringRide: false,              // boolean - if upgraded to audio
    audioConsentUpgrade: null,                        // timestamp | null
    legalComplianceChecks: {
      stateVerified: false,                           // boolean
      twoPartyConsentMet: false,                      // boolean
      minorPassengerDisclosed: false,                 // boolean
      vulnerablePopulationAcknowledged: false         // boolean
    }
  }
}
```

### 4. videoIncidents Collection (NEW)

```javascript
videoIncidents/{incidentId}
{
  // Identifiers
  incidentId: "string",                               // auto-generated
  rideId: "string",                                   // reference to ride
  riderId: "string",                                  // reference to user
  driverId: "string",                                 // reference to driver
  
  // Incident Details
  incidentType: "string",                             // "safety" | "dispute" | "property_damage" | "harassment" | "traffic_violation" | "medical" | "other"
  incidentSeverity: "string",                         // "low" | "medium" | "high" | "critical"
  reportedBy: "string",                               // "driver" | "rider" | "system" | "support"
  reportedAt: timestamp,
  description: "string",
  incidentTimestamp: timestamp,                       // when incident occurred during ride
  
  // Location Data
  incidentLocation: {
    latitude: number,
    longitude: number,
    address: "string",                                // reverse geocoded
    accuracy: number
  },
  
  // Video Information
  videoRequested: boolean,
  videoAvailable: boolean,
  videoOnDriverDevice: boolean,
  videoFileSize: number,                              // MB
  videoDuration: number,                              // seconds
  videoResolution: "string",
  videoFormat: "string",
  
  // Upload Status
  videoUploadRequested: boolean,
  videoUploadedToSecureStorage: boolean,
  videoUploadedAt: timestamp | null,
  videoUploadedBy: "string" | null,                   // userId
  videoStoragePath: "string" | null,                  // Firebase Storage path
  videoSecureUrl: "string" | null,                    // signed URL (expires)
  videoUrlExpiresAt: timestamp | null,
  
  // Video Clips (if multiple clips extracted)
  videoClips: [
    // {
    //   clipId: "string",
    //   startTime: number,                            // seconds from ride start
    //   endTime: number,
    //   duration: number,
    //   reason: "incident_window",                    // why this clip was extracted
    //   storagePath: "string",
    //   sizeKB: number
    // }
  ],
  
  // Retention Management
  videoRetentionUntil: timestamp,                     // extended retention deadline
  autoDeleteDisabled: boolean,
  retentionReason: "string",                          // "active_investigation" | "legal_hold" | "insurance_claim"
  retentionExtensionHistory: [
    // {
    //   extendedAt: timestamp,
    //   extendedBy: "string",                         // userId
    //   newRetentionDate: timestamp,
    //   reason: "string"
    // }
  ],
  
  // Review Status
  reviewStatus: "string",                             // "pending" | "under_review" | "reviewed" | "resolved" | "closed" | "escalated"
  priority: "string",                                 // "low" | "normal" | "high" | "urgent"
  assignedTo: "string" | null,                        // support/admin userId
  assignedAt: timestamp | null,
  reviewedBy: "string" | null,
  reviewedAt: timestamp | null,
  reviewNotes: "string",
  reviewTimeSpentMinutes: number,
  
  // Resolution
  resolution: "string" | null,                        // "no_action" | "warning_issued" | "refund_processed" | "account_suspended" | "law_enforcement_contacted"
  resolutionDetails: "string",
  resolutionDate: timestamp | null,
  closedAt: timestamp | null,
  closedBy: "string" | null,
  
  // Involved Parties Communication
  driverNotified: boolean,
  driverNotifiedAt: timestamp | null,
  riderNotified: boolean,
  riderNotifiedAt: timestamp | null,
  driverResponse: "string" | null,
  riderResponse: "string" | null,
  
  // Access Logs (who viewed the video)
  accessLog: [
    // {
    //   accessedBy: "string",                         // userId
    //   accessedByRole: "string",                     // "admin" | "support" | "driver" | "rider" | "legal"
    //   accessedAt: timestamp,
    //   accessType: "string",                         // "view" | "download" | "share"
    //   ipAddress: "string",
    //   deviceInfo: "string",
    //   actionTaken: "string" | null                  // "no_action" | "downloaded" | "shared_with_legal"
    // }
  ],
  
  // External References
  externalReferences: {
    policeReportNumber: "string" | null,
    insuranceClaimNumber: "string" | null,
    legalCaseNumber: "string" | null,
    supportTicketId: "string" | null
  },
  
  // Tags & Categories
  tags: ["string"],                                   // ["aggressive_driving", "verbal_abuse", etc.]
  category: "string",                                 // "safety" | "behavioral" | "technical" | "other"
  involveVulnerablePopulation: boolean,               // minor, elderly, disabled
  requiresLegalReview: boolean,
  requiresExecutiveReview: boolean,
  
  // Metadata
  createdAt: timestamp,
  updatedAt: timestamp,
  version: number,                                    // for optimistic locking
  isDeleted: boolean,
  deletedAt: timestamp | null,
  deletedBy: "string" | null,
  deletionReason: "string" | null
}
```

---

## 🔐 Updated Firestore Security Rules

### Complete firestore.rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isAuthenticated() && request.auth.token.role == 'admin';
    }
    
    function isDriverOrRider(driverId, riderId) {
      return isAuthenticated() && 
        (request.auth.uid == driverId || request.auth.uid == riderId);
    }
    
    // ===== EXISTING RULES (unchanged) =====
    
    match /users/{userId} {
      allow read, update: if isOwner(userId);
      allow create: if isAuthenticated();
      allow list: if isAuthenticated();
    }
    
    match /drivers/{driverId} {
      allow read, update: if isOwner(driverId);
      allow create: if isOwner(driverId);
    }
    
    // ===== UPDATED RULES =====
    
    // Driver Applications - Enhanced for video capability
    match /driverApplications/{applicationId} {
      // Standard access
      allow read, update: if isOwner(applicationId);
      allow create: if isOwner(applicationId);
      allow list: if isAuthenticated();
      allow read: if isAuthenticated(); // Riders need to see video capability
      
      // Admin can verify video equipment
      allow update: if isAdmin() && 
        request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['videoRecordingCapability', 'updatedAt']);
      
      // Admin can update only verification fields
      allow update: if isAdmin() &&
        onlyUpdatingVideoVerification();
    }
    
    function onlyUpdatingVideoVerification() {
      let affectedKeys = request.resource.data.diff(resource.data).affectedKeys();
      let allowedKeys = ['videoRecordingCapability.equipmentVerified', 
                         'videoRecordingCapability.equipmentVerifiedDate',
                         'videoRecordingCapability.equipmentVerifiedBy',
                         'videoRecordingCapability.certificationStatus',
                         'updatedAt'];
      return affectedKeys.hasOnly(allowedKeys);
    }
    
    // Ride Requests - Enhanced for video recording
    match /rideRequests/{requestId} {
      allow list: if isAuthenticated();
      
      allow get: if isAuthenticated() && 
        (resource.data.riderId == request.auth.uid || 
         resource.data.driverId == request.auth.uid ||
         request.auth.uid in resource.data.availableDrivers);
      
      allow create: if isAuthenticated();
      
      // Enhanced update: Allow drivers to consent to recording
      allow update: if isAuthenticated() && 
        (resource.data.riderId == request.auth.uid || 
         resource.data.driverId == request.auth.uid ||
         request.auth.uid in resource.data.availableDrivers) &&
        validateVideoConsentUpdate();
      
      allow delete: if isAuthenticated() && 
        (resource.data.riderId == request.auth.uid || 
         request.auth.uid in resource.data.availableDrivers);
    }
    
    function validateVideoConsentUpdate() {
      // Allow updating recording consent fields
      let updatingConsent = request.resource.data.diff(resource.data).affectedKeys()
        .hasAny(['recordingConsent', 'recordingStatus']);
      
      // If updating consent, ensure user is involved in ride
      return !updatingConsent || 
        (request.auth.uid == resource.data.riderId || 
         request.auth.uid == resource.data.driverId);
    }
    
    // Active Rides - Enhanced for recording status
    match /activeRides/{rideId} {
      allow read: if isAuthenticated() && 
        (resource.data.riderId == request.auth.uid || 
         resource.data.driverId == request.auth.uid);
      
      allow create: if isAuthenticated();
      
      // Allow driver to update recording status
      allow update: if isAuthenticated() && 
        resource.data.driverId == request.auth.uid &&
        validateRecordingUpdate();
      
      allow delete: if isAuthenticated() && 
        (resource.data.riderId == request.auth.uid || 
         resource.data.driverId == request.auth.uid);
    }
    
    function validateRecordingUpdate() {
      // Driver can update activeRecording fields
      let affectedKeys = request.resource.data.diff(resource.data).affectedKeys();
      let recordingKeys = affectedKeys.hasAny(['activeRecording', 'recordingCompliance']);
      
      // If updating recording, validate structure
      return !recordingKeys || (
        // Ensure driver is not changing other party's consent
        !request.resource.data.diff(resource.data).affectedKeys().hasAny(['riderId', 'driverId'])
      );
    }
    
    // ===== NEW RULES: Video Incidents =====
    
    match /videoIncidents/{incidentId} {
      // READ: Only involved parties, assigned reviewer, and admins
      allow read: if isAuthenticated() && (
        resource.data.driverId == request.auth.uid ||
        resource.data.riderId == request.auth.uid ||
        resource.data.assignedTo == request.auth.uid ||
        isAdmin()
      );
      
      // LIST: Only admins and assigned support
      allow list: if isAdmin() || 
        (isAuthenticated() && request.auth.token.role == 'support');
      
      // CREATE: Only involved parties can create
      allow create: if isAuthenticated() && (
        request.resource.data.driverId == request.auth.uid || 
        request.resource.data.riderId == request.auth.uid
      ) && validateIncidentCreation();
      
      // UPDATE: Different rules for different actors
      allow update: if isAuthenticated() && (
        // Driver/Rider can add their response
        (resource.data.driverId == request.auth.uid && canUpdateDriverResponse()) ||
        (resource.data.riderId == request.auth.uid && canUpdateRiderResponse()) ||
        // Support/Admin can update review status
        (isAdmin() && canUpdateReviewStatus()) ||
        (request.auth.token.role == 'support' && resource.data.assignedTo == request.auth.uid && canUpdateReviewStatus())
      );
      
      // DELETE: Only admins after resolution
      allow delete: if isAdmin() && 
        resource.data.reviewStatus == 'closed' &&
        resource.data.closedAt < request.time - duration.value(30, 'd'); // 30 days after closing
    }
    
    function validateIncidentCreation() {
      let data = request.resource.data;
      return data.incidentType != null &&
             data.reportedBy != null &&
             data.reportedAt != null &&
             data.rideId != null &&
             data.reviewStatus == 'pending';
    }
    
    function canUpdateDriverResponse() {
      let affectedKeys = request.resource.data.diff(resource.data).affectedKeys();
      return affectedKeys.hasOnly(['driverResponse', 'driverNotified', 'updatedAt']);
    }
    
    function canUpdateRiderResponse() {
      let affectedKeys = request.resource.data.diff(resource.data).affectedKeys();
      return affectedKeys.hasOnly(['riderResponse', 'riderNotified', 'updatedAt']);
    }
    
    function canUpdateReviewStatus() {
      let affectedKeys = request.resource.data.diff(resource.data).affectedKeys();
      let allowedFields = ['reviewStatus', 'assignedTo', 'assignedAt', 'reviewedBy', 
                          'reviewedAt', 'reviewNotes', 'resolution', 'resolutionDetails',
                          'resolutionDate', 'closedAt', 'closedBy', 'priority',
                          'videoRetentionUntil', 'accessLog', 'updatedAt'];
      return affectedKeys.hasOnly(allowedFields);
    }
    
    // ===== EXISTING RULES (rest unchanged) =====
    
    match /rides/{rideId} {
      allow read, write: if isAuthenticated() && 
        (resource.data.driverId == request.auth.uid || 
         resource.data.riderId == request.auth.uid);
    }
    
    match /notifications/{notificationId} {
      allow read, write: if isAuthenticated() && 
        request.auth.uid == resource.data.userId;
    }
    
    match /earnings/{earningId} {
      allow read, write: if isAuthenticated() && 
        request.auth.uid == resource.data.userId;
    }
    
    match /emergencyAlerts/{alertId} {
      allow read, write: if isAuthenticated() && 
        (resource.data.userId == request.auth.uid || isAdmin());
    }
    
    match /messages/{messageId} {
      allow read, write: if isAuthenticated() && 
        (resource.data.senderId == request.auth.uid || 
         resource.data.receiverId == request.auth.uid);
    }
  }
}
```

---

## 📦 Firebase Storage Rules

### storage.rules (NEW)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return request.auth.token.role == 'admin';
    }
    
    function isInvolvedParty(rideId) {
      let rideData = firestore.get(/databases/(default)/documents/rides/$(rideId)).data;
      return request.auth.uid == rideData.driverId || 
             request.auth.uid == rideData.riderId;
    }
    
    // Video incident uploads
    match /videoIncidents/{rideId}/{fileName} {
      // Upload rules
      allow create: if isAuthenticated() && 
        isInvolvedParty(rideId) &&
        request.resource.size < 500 * 1024 * 1024 && // Max 500MB per file
        request.resource.contentType.matches('video/.*') &&
        fileName.matches('.*\\.(mp4|mov|avi)$');
      
      // Read rules
      allow read: if isAuthenticated() && (
        isInvolvedParty(rideId) ||
        isAdmin() ||
        isAssignedReviewer(rideId)
      );
      
      // Delete rules (only admin after incident resolved)
      allow delete: if isAdmin() && 
        incidentIsClosed(rideId);
    }
    
    function isAssignedReviewer(rideId) {
      let incidentData = firestore.get(
        /databases/(default)/documents/videoIncidents/$(rideId)
      ).data;
      return request.auth.uid == incidentData.assignedTo;
    }
    
    function incidentIsClosed(rideId) {
      let incidentData = firestore.get(
        /databases/(default)/documents/videoIncidents/$(rideId)
      ).data;
      return incidentData.reviewStatus == 'closed';
    }
    
    // Driver video capability verification photos
    match /driverVerification/{driverId}/{fileName} {
      // Drivers can upload verification photos
      allow create: if isAuthenticated() && 
        request.auth.uid == driverId &&
        request.resource.size < 10 * 1024 * 1024 && // Max 10MB
        request.resource.contentType.matches('image/.*');
      
      // Driver and admins can read
      allow read: if isAuthenticated() && 
        (request.auth.uid == driverId || isAdmin());
      
      // Only admins can delete
      allow delete: if isAdmin();
    }
    
    // Temporary video clips for review (expire in 7 days)
    match /tempVideoClips/{incidentId}/{clipId} {
      allow create: if isAuthenticated() && isAdmin();
      allow read: if isAuthenticated() && isAdmin();
      allow delete: if isAuthenticated() && isAdmin();
    }
  }
}
```

---

## 🔄 Data Migration Scripts

### 1. Add Video Capability to Existing Drivers

**File**: `scripts/migrate-video-capability.js`

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateVideoCapability() {
  console.log('🚀 Starting video capability migration...');
  
  const driversRef = db.collection('driverApplications');
  const snapshot = await driversRef.get();
  
  const batch = db.batch();
  let updateCount = 0;
  
  snapshot.forEach(doc => {
    const data = doc.data();
    
    // Only update if videoRecordingCapability doesn't exist
    if (!data.videoRecordingCapability) {
      const driverRef = db.collection('driverApplications').doc(doc.id);
      
      batch.update(driverRef, {
        videoRecordingCapability: {
          hasEquipment: false,
          equipmentType: null,
          certificationDate: null,
          certificationStatus: 'not_started',
          equipmentVerified: false,
          equipmentVerifiedDate: null,
          equipmentVerifiedBy: null,
          
          cameraInfo: {
            brand: null,
            model: null,
            purchaseDate: null,
            serialNumber: null,
            hasInteriorCamera: false,
            hasAudioRecording: false,
            storageCapacityGB: 0,
            storageType: null,
            resolution: null,
            nightVisionCapable: false,
            lastMaintenanceCheck: null,
            maintenanceNotes: []
          },
          
          privacyNoticePosted: false,
          privacyNoticePhotoUrl: null,
          audioConsentCapable: false,
          statesCompliant: [],
          twoPartyConsentAcknowledged: false,
          
          trainingCompleted: false,
          trainingCompletedDate: null,
          trainingModuleVersion: null,
          certificationExpiresAt: null,
          recertificationRequired: false,
          
          autoAcceptRecordingRequests: false,
          defaultRecordingMode: 'video_only',
          preRideReminderEnabled: true,
          voiceCommandsEnabled: false,
          
          totalRecordedRides: 0,
          totalRecordingHours: 0,
          totalRecordingSizeGB: 0,
          incidentsReported: 0,
          incidentsResolved: 0,
          lastRecordingDate: null,
          averageRiderRatingForRecordedRides: 0,
          recordingRequestAcceptanceRate: 100,
          
          isCurrentlyRecording: false,
          currentRecordingRideId: null,
          storageWarningShown: false,
          equipmentMalfunctionReported: false,
          lastEquipmentCheckDate: null,
          
          capabilityCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
          capabilityUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
          capabilityCreatedBy: 'system_migration',
          capabilityNotes: []
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      updateCount++;
      
      // Firestore batch limit is 500
      if (updateCount % 450 === 0) {
        console.log(`⏳ Committing batch of ${updateCount} updates...`);
      }
    }
  });
  
  await batch.commit();
  console.log(`✅ Migration complete! Updated ${updateCount} driver profiles.`);
}

migrateVideoCapability()
  .then(() => {
    console.log('🎉 Script finished successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  });
```

### 2. Create Composite Indexes

**File**: `firestore.indexes.json`

```json
{
  "indexes": [
    {
      "collectionGroup": "driverApplications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "isOnline", "order": "ASCENDING" },
        { "fieldPath": "videoRecordingCapability.hasEquipment", "order": "ASCENDING" },
        { "fieldPath": "videoRecordingCapability.certificationStatus", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "rideRequests",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "availableDrivers", "arrayConfig": "CONTAINS" },
        { "fieldPath": "videoRecordingRequested", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "videoIncidents",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "reviewStatus", "order": "ASCENDING" },
        { "fieldPath": "priority", "order": "DESCENDING" },
        { "fieldPath": "reportedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "videoIncidents",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "assignedTo", "order": "ASCENDING" },
        { "fieldPath": "reviewStatus", "order": "ASCENDING" },
        { "fieldPath": "reportedAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

---

## 🧪 Testing Queries

### Test Video-Capable Driver Query

```javascript
// Find all verified video-capable drivers who are online
const videoCapableDriversQuery = query(
  collection(db, 'driverApplications'),
  where('isOnline', '==', true),
  where('status', '==', 'available'),
  where('videoRecordingCapability.hasEquipment', '==', true),
  where('videoRecordingCapability.certificationStatus', '==', 'certified')
);
```

### Test Pending Video Incidents

```javascript
// Find all pending video incidents for support dashboard
const pendingIncidentsQuery = query(
  collection(db, 'videoIncidents'),
  where('reviewStatus', '==', 'pending'),
  orderBy('priority', 'desc'),
  orderBy('reportedAt', 'desc'),
  limit(50)
);
```

---

## 📊 Monitoring & Triggers

### Cloud Functions for Auto-Deletion

**File**: `functions/index.js`

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Auto-delete videos after retention period
exports.autoDeleteExpiredVideos = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();
    
    // Find rides with expired video retention
    const expiredQuery = db.collection('activeRides')
      .where('videoLifecycle.autoDeleteScheduledFor', '<=', now)
      .where('videoLifecycle.retentionExtended', '==', false)
      .where('videoLifecycle.markedForDeletion', '==', false);
    
    const snapshot = await expiredQuery.get();
    
    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.update(doc.ref, {
        'videoLifecycle.markedForDeletion': true,
        'videoLifecycle.deletedAt': now,
        'videoLifecycle.deletionMethod': 'auto'
      });
    });
    
    await batch.commit();
    console.log(`Marked ${snapshot.size} videos for deletion`);
    
    return null;
  });

// Send reminder when video equipment certification expires soon
exports.certificationExpiryReminder = functions.pubsub
  .schedule('every 168 hours') // Weekly
  .onRun(async (context) => {
    const db = admin.firestore();
    const thirtyDaysFromNow = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    );
    
    const expiringQuery = db.collection('driverApplications')
      .where('videoRecordingCapability.certificationExpiresAt', '<=', thirtyDaysFromNow)
      .where('videoRecordingCapability.recertificationRequired', '==', false);
    
    const snapshot = await expiringQuery.get();
    
    // Send notifications to drivers
    const notificationPromises = snapshot.docs.map(doc => {
      return db.collection('notifications').add({
        userId: doc.id,
        type: 'certification_expiry',
        title: 'Video Recording Certification Expiring Soon',
        message: 'Your video recording certification expires in 30 days. Please complete recertification.',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        read: false
      });
    });
    
    await Promise.all(notificationPromises);
    console.log(`Sent ${snapshot.size} certification expiry reminders`);
    
    return null;
  });
```

---

## ✅ Deployment Checklist

### Phase 1: Backend Setup
- [ ] Deploy updated `firestore.rules`
- [ ] Deploy new `storage.rules`
- [ ] Create composite indexes (wait for completion)
- [ ] Run migration script for existing drivers
- [ ] Test security rules with Firebase emulator
- [ ] Deploy Cloud Functions

### Phase 2: Validation
- [ ] Verify driver query returns correct results
- [ ] Test incident creation with mock data
- [ ] Validate access controls (driver/rider/admin)
- [ ] Check auto-deletion trigger works
- [ ] Monitor error logs for 24 hours

### Phase 3: Rollout
- [ ] Enable feature flag for pilot drivers
- [ ] Monitor Firestore usage metrics
- [ ] Track Storage costs
- [ ] Collect feedback from pilot
- [ ] Adjust retention policies if needed

---

**Last Updated**: October 17, 2024  
**Version**: 1.0  
**Status**: Ready for Implementation

