/**
 * Migration Script: Add Video Recording Capability to Existing Drivers
 * 
 * This script adds the videoRecordingCapability field to all existing driver documents
 * in the driverApplications collection.
 * 
 * Usage: node scripts/migrate-video-recording-capability.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Path to your service account key file
const serviceAccountPath = path.resolve(__dirname, 'firebase-service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`❌ Error: Service account key file not found at ${serviceAccountPath}`);
  console.error(`   Expected location: ${serviceAccountPath}`);
  console.error(`   Please ensure the firebase-service-account.json file exists in the scripts directory.`);
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const db = admin.firestore();

// Default video recording capability structure
const defaultVideoCapability = {
  // Equipment Status
  hasEquipment: false,
  equipmentType: null,
  certificationDate: null,
  certificationStatus: 'not_started', // "not_started" | "pending" | "certified" | "expired" | "revoked"
  equipmentVerified: false,
  equipmentVerifiedDate: null,
  equipmentVerifiedBy: null,
  
  // Camera Hardware Details
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
  
  // Legal Compliance
  privacyNoticePosted: false,
  privacyNoticePhotoUrl: null,
  audioConsentCapable: false,
  statesCompliant: [],
  twoPartyConsentAcknowledged: false,
  
  // Training & Certification
  trainingCompleted: false,
  trainingCompletedDate: null,
  trainingModuleVersion: null,
  certificationExpiresAt: null,
  recertificationRequired: false,
  
  // Preferences & Settings
  autoAcceptRecordingRequests: false,
  defaultRecordingMode: 'video_only',
  preRideReminderEnabled: true,
  voiceCommandsEnabled: false,
  
  // Statistics & Tracking
  totalRecordedRides: 0,
  totalRecordingHours: 0,
  totalRecordingSizeGB: 0,
  incidentsReported: 0,
  incidentsResolved: 0,
  lastRecordingDate: null,
  averageRiderRatingForRecordedRides: 0,
  recordingRequestAcceptanceRate: 100,
  
  // Operational Flags
  isCurrentlyRecording: false,
  currentRecordingRideId: null,
  storageWarningShown: false,
  equipmentMalfunctionReported: false,
  lastEquipmentCheckDate: null,
  
  // Metadata
  capabilityCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
  capabilityUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
  capabilityCreatedBy: 'system_migration',
  capabilityNotes: []
};

/**
 * Main migration function
 */
async function migrateVideoCapability() {
  console.log('🚀 Starting video recording capability migration...');
  console.log('='.repeat(60));
  console.log('');
  
  try {
    const driversRef = db.collection('driverApplications');
    const snapshot = await driversRef.get();
    
    if (snapshot.empty) {
      console.log('ℹ️  No drivers found in driverApplications collection.');
      console.log('   Migration complete (nothing to migrate).');
      return;
    }
    
    console.log(`📊 Found ${snapshot.size} driver(s) in database`);
    console.log('');
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // Process in batches of 450 (Firestore batch limit is 500, using 450 for safety)
    const BATCH_SIZE = 450;
    let batch = db.batch();
    let operationsInBatch = 0;
    
    for (const doc of snapshot.docs) {
      const driverId = doc.id;
      const data = doc.data();
      
      // Check if videoRecordingCapability already exists
      if (data.videoRecordingCapability) {
        console.log(`⏭️  Skipping ${driverId} - already has videoRecordingCapability`);
        skippedCount++;
        continue;
      }
      
      // Add the videoRecordingCapability field
      const driverRef = driversRef.doc(driverId);
      
      batch.update(driverRef, {
        videoRecordingCapability: defaultVideoCapability,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      operationsInBatch++;
      updatedCount++;
      
      console.log(`✅ Queued update for ${driverId} (${data.displayName || 'Unknown'})`);
      
      // Commit batch if it reaches the limit
      if (operationsInBatch >= BATCH_SIZE) {
        console.log('');
        console.log(`⏳ Committing batch of ${operationsInBatch} updates...`);
        await batch.commit();
        console.log(`✓ Batch committed successfully`);
        console.log('');
        
        // Start a new batch
        batch = db.batch();
        operationsInBatch = 0;
      }
    }
    
    // Commit any remaining operations
    if (operationsInBatch > 0) {
      console.log('');
      console.log(`⏳ Committing final batch of ${operationsInBatch} updates...`);
      await batch.commit();
      console.log(`✓ Final batch committed successfully`);
    }
    
    // Print summary
    console.log('');
    console.log('='.repeat(60));
    console.log('📈 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Updated: ${updatedCount} driver(s)`);
    console.log(`⏭️  Skipped: ${skippedCount} driver(s) (already had capability)`);
    console.log(`❌ Errors:  ${errorCount} driver(s)`);
    console.log('');
    
    if (errors.length > 0) {
      console.log('❌ Errors encountered:');
      errors.forEach(({ driverId, error }) => {
        console.log(`   - ${driverId}: ${error.message}`);
      });
      console.log('');
    }
    
    console.log('✅ Migration complete!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Deploy updated firestore.rules');
    console.log('   2. Deploy storage.rules');
    console.log('   3. Deploy firestore indexes (firebase deploy --only firestore:indexes)');
    console.log('   4. Test video capability queries');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('❌ Fatal error during migration:', error);
    console.error('   Stack trace:', error.stack);
    process.exit(1);
  }
}

/**
 * Verify migration by checking a few drivers
 */
async function verifyMigration() {
  console.log('');
  console.log('🔍 Verifying migration...');
  console.log('='.repeat(60));
  
  try {
    const driversRef = db.collection('driverApplications');
    const snapshot = await driversRef.limit(5).get();
    
    let verifiedCount = 0;
    let missingCount = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.videoRecordingCapability) {
        verifiedCount++;
        console.log(`✅ ${doc.id}: Has videoRecordingCapability`);
        
        // Check structure
        const capability = data.videoRecordingCapability;
        if (capability.certificationStatus && capability.cameraInfo && capability.totalRecordedRides !== undefined) {
          console.log(`   ✓ Structure looks correct`);
        } else {
          console.log(`   ⚠️  Structure may be incomplete`);
        }
      } else {
        missingCount++;
        console.log(`❌ ${doc.id}: Missing videoRecordingCapability`);
      }
    });
    
    console.log('');
    console.log(`Verified ${verifiedCount}/${snapshot.size} sample driver(s)`);
    
    if (missingCount > 0) {
      console.log(`⚠️  Warning: ${missingCount} sample driver(s) still missing capability`);
      console.log('   You may need to run the migration script again.');
    } else {
      console.log('✅ All sampled drivers have videoRecordingCapability!');
    }
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

/**
 * Count drivers with video capability
 */
async function countVideoCapableDrivers() {
  console.log('');
  console.log('📊 Counting video-capable drivers...');
  console.log('='.repeat(60));
  
  try {
    const driversRef = db.collection('driverApplications');
    const allSnapshot = await driversRef.get();
    
    let totalDrivers = allSnapshot.size;
    let withCapabilityField = 0;
    let certified = 0;
    let hasEquipment = 0;
    
    allSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.videoRecordingCapability) {
        withCapabilityField++;
        
        if (data.videoRecordingCapability.hasEquipment) {
          hasEquipment++;
        }
        
        if (data.videoRecordingCapability.certificationStatus === 'certified') {
          certified++;
        }
      }
    });
    
    console.log(`Total drivers:                    ${totalDrivers}`);
    console.log(`With videoRecordingCapability:    ${withCapabilityField} (${Math.round(withCapabilityField/totalDrivers*100)}%)`);
    console.log(`With equipment installed:         ${hasEquipment}`);
    console.log(`Certified for video recording:    ${certified}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Error counting drivers:', error);
  }
}

// Main execution
async function main() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Video Recording Capability Migration Script             ║');
  console.log('║   AnyRyde Driver App                                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  
  try {
    // Run migration
    await migrateVideoCapability();
    
    // Verify migration
    await verifyMigration();
    
    // Count video-capable drivers
    await countVideoCapableDrivers();
    
    console.log('');
    console.log('🎉 Script finished successfully!');
    console.log('');
    process.exit(0);
    
  } catch (error) {
    console.error('');
    console.error('❌ Script failed:', error.message);
    console.error('');
    process.exit(1);
  }
}

// Run the script
main();

