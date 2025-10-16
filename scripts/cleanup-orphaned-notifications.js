const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Path to your service account key file
const serviceAccountPath = path.resolve(__dirname, 'firebase-service-account.json');

// Check if service account file exists
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

async function cleanupOrphanedNotifications() {
  try {
    console.log('🧹 Starting cleanup of orphaned notifications...\n');

    // Get command line arguments
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    
    if (dryRun) {
      console.log('🔍 DRY RUN MODE - No actual deletions will be performed\n');
    }

    // Get all pending notifications
    const notificationsQuery = db.collection('notifications')
      .where('type', 'in', ['scheduled_ride_request', 'medical_ride_request'])
      .where('status', '==', 'pending');
    
    const notificationsSnapshot = await notificationsQuery.get();
    
    console.log(`📊 Found ${notificationsSnapshot.size} pending notifications to check`);
    
    let orphanedCount = 0;
    let validCount = 0;
    const batch = db.batch();
    let batchCount = 0;
    
    console.log('\n🔍 Checking notifications...');
    
    for (const docSnapshot of notificationsSnapshot.docs) {
      const notification = { id: docSnapshot.id, ...docSnapshot.data() };
      const rideId = notification.data?.rideId;
      
      if (!rideId) {
        console.log(`❌ Notification ${notification.id}: No rideId`);
        orphanedCount++;
        if (!dryRun) {
          batch.delete(docSnapshot.ref);
          batchCount++;
        }
        continue;
      }
      
      // Check if ride document exists
      let rideExists = false;
      
      // Check medical rides
      try {
        const medicalRideDoc = await db.collection('medicalRideSchedule').doc(rideId).get();
        if (medicalRideDoc.exists) {
          rideExists = true;
        }
      } catch (error) {
        // Ignore errors, ride doesn't exist
      }
      
      // Check regular scheduled rides if not found in medical
      if (!rideExists) {
        try {
          const scheduledRideDoc = await db.collection('scheduledRides').doc(rideId).get();
          if (scheduledRideDoc.exists) {
            rideExists = true;
          }
        } catch (error) {
          // Ignore errors, ride doesn't exist
        }
      }
      
      if (rideExists) {
        validCount++;
      } else {
        console.log(`❌ Orphaned: ${notification.id} -> ${rideId}`);
        orphanedCount++;
        if (!dryRun) {
          batch.delete(docSnapshot.ref);
          batchCount++;
        }
      }
      
      // Commit batch every 500 operations
      if (batchCount >= 500) {
        if (!dryRun) {
          await batch.commit();
          console.log(`✅ Committed batch of ${batchCount} deletions`);
        }
        batchCount = 0;
      }
    }
    
    // Commit remaining operations
    if (batchCount > 0) {
      if (!dryRun) {
        await batch.commit();
        console.log(`✅ Committed final batch of ${batchCount} deletions`);
      }
    }
    
    console.log('\n📊 Cleanup Summary:');
    console.log('==================================================');
    console.log(`📋 Total notifications checked: ${notificationsSnapshot.size}`);
    console.log(`✅ Valid notifications: ${validCount}`);
    console.log(`❌ Orphaned notifications: ${orphanedCount}`);
    console.log(`🗑️  ${dryRun ? 'Would delete' : 'Deleted'}: ${orphanedCount}`);
    
    if (dryRun) {
      console.log('\n💡 Run without --dry-run to perform actual cleanup');
    } else {
      console.log('\n✅ Cleanup completed successfully!');
      console.log('🔄 The badge should now match the modal content');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    console.log('\n🔄 Script completed. Exiting...');
    process.exit(0);
  }
}

// Run the cleanup function
cleanupOrphanedNotifications();
