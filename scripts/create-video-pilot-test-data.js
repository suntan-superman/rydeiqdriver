/**
 * Test Data Script: Create Video Recording Pilot Program Data
 * 
 * This script creates test data for the video recording pilot program:
 * - 10 drivers with video capability (various certification statuses)
 * - Sample ride requests with video recording requested
 * - Sample video incidents
 * 
 * Usage: node scripts/create-video-pilot-test-data.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Path to your service account key file
const serviceAccountPath = path.resolve(__dirname, 'firebase-service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`❌ Error: Service account key file not found at ${serviceAccountPath}`);
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const db = admin.firestore();

// Sample driver names for test data
const PILOT_DRIVERS = [
  { firstName: 'John', lastName: 'Smith', email: 'john.pilot@anyryde.test' },
  { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.pilot@anyryde.test' },
  { firstName: 'Michael', lastName: 'Williams', email: 'michael.pilot@anyryde.test' },
  { firstName: 'Emily', lastName: 'Brown', email: 'emily.pilot@anyryde.test' },
  { firstName: 'David', lastName: 'Jones', email: 'david.pilot@anyryde.test' },
  { firstName: 'Jessica', lastName: 'Garcia', email: 'jessica.pilot@anyryde.test' },
  { firstName: 'Robert', lastName: 'Martinez', email: 'robert.pilot@anyryde.test' },
  { firstName: 'Lisa', lastName: 'Rodriguez', email: 'lisa.pilot@anyryde.test' },
  { firstName: 'James', lastName: 'Wilson', email: 'james.pilot@anyryde.test' },
  { firstName: 'Jennifer', lastName: 'Anderson', email: 'jennifer.pilot@anyryde.test' }
];

// Camera equipment options
const CAMERA_EQUIPMENT = [
  { brand: 'Vantrue', model: 'N2 Pro', storageGB: 128 },
  { brand: 'VIOFO', model: 'A129 Duo IR', storageGB: 128 },
  { brand: 'Garmin', model: 'Dash Cam Tandem', storageGB: 64 },
  { brand: 'Vantrue', model: 'N4', storageGB: 256 }
];

// Bakersfield, CA coordinates (spread around the city)
const BAKERSFIELD_LOCATIONS = [
  { lat: 35.3733, lng: -119.0187, name: 'Downtown Bakersfield' },
  { lat: 35.3975, lng: -118.9891, name: 'East Bakersfield' },
  { lat: 35.3527, lng: -119.0520, name: 'West Bakersfield' },
  { lat: 35.4142, lng: -119.0254, name: 'North Bakersfield' },
  { lat: 35.3341, lng: -119.0137, name: 'South Bakersfield' }
];

/**
 * Generate random certification date (within last 6 months)
 */
function getRandomCertificationDate() {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const randomTime = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime());
  return admin.firestore.Timestamp.fromDate(new Date(randomTime));
}

/**
 * Generate expiry date (1 year from certification)
 */
function getExpiryDate(certificationDate) {
  const certDate = certificationDate.toDate();
  const expiryDate = new Date(certDate.getTime() + 365 * 24 * 60 * 60 * 1000);
  return admin.firestore.Timestamp.fromDate(expiryDate);
}

/**
 * Create pilot driver with video capability
 */
async function createPilotDriver(driverInfo, index) {
  const driverId = `pilot_driver_${index + 1}`;
  const camera = CAMERA_EQUIPMENT[index % CAMERA_EQUIPMENT.length];
  const location = BAKERSFIELD_LOCATIONS[index % BAKERSFIELD_LOCATIONS.length];
  
  // Vary certification status
  const certificationStatuses = ['certified', 'certified', 'certified', 'pending', 'not_started'];
  const certificationStatus = certificationStatuses[index % certificationStatuses.length];
  
  const certificationDate = certificationStatus === 'certified' ? getRandomCertificationDate() : null;
  const expiryDate = certificationDate ? getExpiryDate(certificationDate) : null;
  
  const driverData = {
    userId: driverId,
    email: driverInfo.email,
    displayName: `${driverInfo.firstName} ${driverInfo.lastName}`,
    phoneNumber: `+1559555${(index + 1).toString().padStart(4, '0')}`,
    firstName: driverInfo.firstName,
    lastName: driverInfo.lastName,
    
    // Status & Location
    status: index < 7 ? 'available' : 'offline', // 7 online, 3 offline
    isOnline: index < 7,
    location: {
      latitude: location.lat,
      longitude: location.lng,
      accuracy: 10,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    },
    
    // Vehicle Info
    vehicle_info: {
      make: ['Toyota', 'Honda', 'Ford', 'Chevrolet'][index % 4],
      model: ['Camry', 'Accord', 'Fusion', 'Malibu'][index % 4],
      year: 2018 + (index % 5),
      color: ['Silver', 'Black', 'White', 'Blue'][index % 4],
      licensePlate: `7ABC${(index + 1).toString().padStart(3, '0')}`,
      vehicleType: 'standard'
    },
    
    // Video Recording Capability
    videoRecordingCapability: {
      hasEquipment: certificationStatus !== 'not_started',
      equipmentType: certificationStatus !== 'not_started' ? `${camera.brand} ${camera.model}` : null,
      certificationDate: certificationDate,
      certificationStatus: certificationStatus,
      equipmentVerified: certificationStatus === 'certified',
      equipmentVerifiedDate: certificationDate,
      equipmentVerifiedBy: certificationStatus === 'certified' ? 'admin_test_user' : null,
      
      cameraInfo: {
        brand: camera.brand,
        model: camera.model,
        purchaseDate: certificationDate,
        serialNumber: `SN${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        hasInteriorCamera: true,
        hasAudioRecording: true,
        storageCapacityGB: camera.storageGB,
        storageType: 'microSD',
        resolution: '1080p',
        nightVisionCapable: true,
        lastMaintenanceCheck: certificationDate,
        maintenanceNotes: []
      },
      
      privacyNoticePosted: certificationStatus === 'certified',
      privacyNoticePhotoUrl: certificationStatus === 'certified' ? `/driverVerification/${driverId}/privacy-notice.jpg` : null,
      audioConsentCapable: certificationStatus === 'certified',
      statesCompliant: certificationStatus === 'certified' ? ['CA'] : [],
      twoPartyConsentAcknowledged: certificationStatus === 'certified',
      
      trainingCompleted: certificationStatus === 'certified',
      trainingCompletedDate: certificationDate,
      trainingModuleVersion: certificationStatus === 'certified' ? 'v1.0' : null,
      certificationExpiresAt: expiryDate,
      recertificationRequired: false,
      
      autoAcceptRecordingRequests: index % 3 === 0, // Every 3rd driver
      defaultRecordingMode: 'video_only',
      preRideReminderEnabled: true,
      voiceCommandsEnabled: false,
      
      // Random statistics for realism
      totalRecordedRides: certificationStatus === 'certified' ? Math.floor(Math.random() * 20) : 0,
      totalRecordingHours: certificationStatus === 'certified' ? Math.floor(Math.random() * 30) : 0,
      totalRecordingSizeGB: certificationStatus === 'certified' ? Math.floor(Math.random() * 50) : 0,
      incidentsReported: certificationStatus === 'certified' && Math.random() > 0.7 ? 1 : 0,
      incidentsResolved: 0,
      lastRecordingDate: certificationStatus === 'certified' ? admin.firestore.Timestamp.now() : null,
      averageRiderRatingForRecordedRides: 4.8 + Math.random() * 0.2,
      recordingRequestAcceptanceRate: 90 + Math.floor(Math.random() * 10),
      
      isCurrentlyRecording: false,
      currentRecordingRideId: null,
      storageWarningShown: false,
      equipmentMalfunctionReported: false,
      lastEquipmentCheckDate: certificationDate,
      
      capabilityCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
      capabilityUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      capabilityCreatedBy: 'pilot_test_script',
      capabilityNotes: ['Created for pilot program testing']
    },
    
    // Additional fields
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    isPilotDriver: true,
    pilotProgramStartDate: admin.firestore.Timestamp.now()
  };
  
  await db.collection('driverApplications').doc(driverId).set(driverData);
  
  return { driverId, driverData };
}

/**
 * Create sample ride requests with video recording
 */
async function createSampleRideRequests(pilotDriverIds) {
  const rideRequests = [];
  
  // Create 5 ride requests, 3 with video recording requested
  for (let i = 0; i < 5; i++) {
    const pickup = BAKERSFIELD_LOCATIONS[i % BAKERSFIELD_LOCATIONS.length];
    const dropoff = BAKERSFIELD_LOCATIONS[(i + 2) % BAKERSFIELD_LOCATIONS.length];
    const videoRequested = i < 3; // First 3 rides request video
    
    const rideRequestData = {
      riderId: `test_rider_${i + 1}`,
      riderInfo: {
        name: `Test Rider ${i + 1}`,
        rating: 4.5 + Math.random() * 0.5,
        phoneNumber: `+1559444${(i + 1).toString().padStart(4, '0')}`
      },
      
      pickup: {
        address: `${pickup.name}, Bakersfield, CA 93301`,
        coordinates: {
          latitude: pickup.lat,
          longitude: pickup.lng
        },
        instructions: 'Meet at main entrance'
      },
      
      dropoff: {
        address: `${dropoff.name}, Bakersfield, CA 93305`,
        coordinates: {
          latitude: dropoff.lat,
          longitude: dropoff.lng
        },
        instructions: ''
      },
      
      // Video recording fields
      videoRecordingRequested: videoRequested,
      videoRecordingRequired: i === 0, // First ride requires video
      videoRecordingReason: videoRequested ? 'safety' : null,
      
      recordingConsent: {
        riderConsented: videoRequested,
        riderConsentTimestamp: videoRequested ? admin.firestore.Timestamp.now() : null,
        riderConsentMethod: videoRequested ? 'in_app_toggle' : null,
        riderConsentIpAddress: videoRequested ? '192.168.1.100' : null,
        
        driverConsented: false,
        driverConsentTimestamp: null,
        driverConsentMethod: null,
        
        audioRecordingRequested: false,
        riderAudioConsented: false,
        driverAudioConsented: false,
        audioConsentTimestamp: null,
        
        finalRecordingMode: 'none',
        consentAgreementVersion: 'v1.0',
        bothPartiesAgreed: false
      },
      
      // Driver matching (only include certified video drivers if video requested)
      availableDrivers: videoRequested ? 
        pilotDriverIds.filter((id, idx) => idx < 7) : // First 7 are certified and online
        pilotDriverIds,
      
      status: 'pending',
      timestamp: admin.firestore.Timestamp.now(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      estimatedPrice: {
        min: 12.00 + Math.random() * 5,
        max: 18.00 + Math.random() * 7,
        currency: 'USD'
      },
      
      driverBids: [],
      isPilotRide: true
    };
    
    const rideRef = await db.collection('rideRequests').add(rideRequestData);
    rideRequests.push({ id: rideRef.id, ...rideRequestData });
  }
  
  return rideRequests;
}

/**
 * Create sample video incident
 */
async function createSampleVideoIncident(driverId) {
  const incidentData = {
    incidentId: `incident_${Date.now()}`,
    rideId: `test_ride_${Date.now()}`,
    riderId: 'test_rider_1',
    driverId: driverId,
    
    incidentType: 'safety',
    incidentSeverity: 'medium',
    reportedBy: 'driver',
    reportedAt: admin.firestore.Timestamp.now(),
    description: 'Test incident for pilot program - rider behavior concern',
    incidentTimestamp: admin.firestore.Timestamp.now(),
    
    incidentLocation: {
      latitude: 35.3733,
      longitude: -119.0187,
      address: 'Downtown Bakersfield, CA',
      accuracy: 10
    },
    
    videoRequested: true,
    videoAvailable: true,
    videoOnDriverDevice: true,
    videoFileSize: 1024, // 1GB
    videoDuration: 1800, // 30 minutes
    videoResolution: '1080p',
    videoFormat: 'mp4',
    
    videoUploadRequested: false,
    videoUploadedToSecureStorage: false,
    videoUploadedAt: null,
    videoUploadedBy: null,
    videoStoragePath: null,
    videoSecureUrl: null,
    videoUrlExpiresAt: null,
    
    videoClips: [],
    
    videoRetentionUntil: admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    ),
    autoDeleteDisabled: true,
    retentionReason: 'active_investigation',
    retentionExtensionHistory: [],
    
    reviewStatus: 'pending',
    priority: 'normal',
    assignedTo: null,
    assignedAt: null,
    reviewedBy: null,
    reviewedAt: null,
    reviewNotes: '',
    reviewTimeSpentMinutes: 0,
    
    resolution: null,
    resolutionDetails: null,
    resolutionDate: null,
    closedAt: null,
    closedBy: null,
    
    driverNotified: true,
    driverNotifiedAt: admin.firestore.Timestamp.now(),
    riderNotified: false,
    riderNotifiedAt: null,
    driverResponse: null,
    riderResponse: null,
    
    accessLog: [],
    
    externalReferences: {
      policeReportNumber: null,
      insuranceClaimNumber: null,
      legalCaseNumber: null,
      supportTicketId: null
    },
    
    tags: ['pilot_program', 'test_data'],
    category: 'safety',
    involveVulnerablePopulation: false,
    requiresLegalReview: false,
    requiresExecutiveReview: false,
    
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    version: 1,
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    deletionReason: null,
    
    isTestData: true
  };
  
  const incidentRef = await db.collection('videoIncidents').add(incidentData);
  return { id: incidentRef.id, ...incidentData };
}

/**
 * Main execution
 */
async function main() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Video Recording Pilot Program Test Data                 ║');
  console.log('║   AnyRyde Driver App                                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('🚀 Creating test data for pilot program...');
  console.log('='.repeat(60));
  console.log('');
  
  try {
    // 1. Create pilot drivers
    console.log('👥 Creating 10 pilot drivers...');
    const pilotDrivers = [];
    
    for (let i = 0; i < PILOT_DRIVERS.length; i++) {
      const driver = await createPilotDriver(PILOT_DRIVERS[i], i);
      pilotDrivers.push(driver);
      console.log(`✅ Created driver: ${driver.driverData.displayName} (${driver.driverId})`);
      console.log(`   Status: ${driver.driverData.videoRecordingCapability.certificationStatus}`);
      console.log(`   Equipment: ${driver.driverData.videoRecordingCapability.cameraInfo.brand} ${driver.driverData.videoRecordingCapability.cameraInfo.model}`);
    }
    
    console.log('');
    console.log(`✅ Created ${pilotDrivers.length} pilot drivers`);
    console.log('');
    
    // 2. Create sample ride requests
    console.log('🚗 Creating sample ride requests...');
    const pilotDriverIds = pilotDrivers.map(d => d.driverId);
    const rideRequests = await createSampleRideRequests(pilotDriverIds);
    
    rideRequests.forEach((ride, idx) => {
      console.log(`✅ Created ride request ${idx + 1}: ${ride.pickup.address} → ${ride.dropoff.address}`);
      console.log(`   Video requested: ${ride.videoRecordingRequested ? 'Yes' : 'No'}`);
      console.log(`   Available drivers: ${ride.availableDrivers.length}`);
    });
    
    console.log('');
    console.log(`✅ Created ${rideRequests.length} sample ride requests`);
    console.log('');
    
    // 3. Create sample incident
    console.log('🚨 Creating sample video incident...');
    const certifiedDriverId = pilotDrivers.find(d => 
      d.driverData.videoRecordingCapability.certificationStatus === 'certified'
    ).driverId;
    
    const incident = await createSampleVideoIncident(certifiedDriverId);
    console.log(`✅ Created incident: ${incident.id}`);
    console.log(`   Type: ${incident.incidentType}`);
    console.log(`   Severity: ${incident.incidentSeverity}`);
    console.log('');
    
    // Print summary
    console.log('='.repeat(60));
    console.log('📊 Test Data Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Pilot Drivers Created:    ${pilotDrivers.length}`);
    console.log(`   - Certified:              ${pilotDrivers.filter(d => d.driverData.videoRecordingCapability.certificationStatus === 'certified').length}`);
    console.log(`   - Pending:                ${pilotDrivers.filter(d => d.driverData.videoRecordingCapability.certificationStatus === 'pending').length}`);
    console.log(`   - Not Started:            ${pilotDrivers.filter(d => d.driverData.videoRecordingCapability.certificationStatus === 'not_started').length}`);
    console.log(`   - Online:                 ${pilotDrivers.filter(d => d.driverData.isOnline).length}`);
    console.log('');
    console.log(`✅ Ride Requests Created:    ${rideRequests.length}`);
    console.log(`   - With video requested:   ${rideRequests.filter(r => r.videoRecordingRequested).length}`);
    console.log(`   - Video required:         ${rideRequests.filter(r => r.videoRecordingRequired).length}`);
    console.log('');
    console.log(`✅ Video Incidents Created:  1`);
    console.log('');
    
    console.log('📝 Next Steps:');
    console.log('   1. Test driver matching with video capability filter');
    console.log('   2. Test recording consent workflow');
    console.log('   3. Test incident reporting flow');
    console.log('   4. Monitor Cloud Functions execution');
    console.log('');
    console.log('🧹 Cleanup:');
    console.log('   Run: node scripts/cleanup-pilot-test-data.js');
    console.log('');
    
    console.log('✅ Test data creation complete!');
    console.log('');
    process.exit(0);
    
  } catch (error) {
    console.error('');
    console.error('❌ Error creating test data:', error);
    console.error('   Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the script
main();

