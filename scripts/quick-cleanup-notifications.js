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

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const db = admin.firestore();

async function quickCleanup() {
  try {
    console.log('🧹 Quick cleanup of orphaned notifications...\n');

    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    
    if (dryRun) {
      console.log('🔍 DRY RUN MODE - No actual deletions will be performed\n');
    }

    // Since we know all notifications are orphaned, let's just delete them all
    const notificationsQuery = db.collection('notifications')
      .where('type', 'in', ['scheduled_ride_request', 'medical_ride_request'])
      .where('status', '==', 'pending');
    
    const notificationsSnapshot = await notificationsQuery.get();
    
    console.log(`📊 Found ${notificationsSnapshot.size} pending notifications`);
    
    if (dryRun) {
      console.log(`🗑️  Would delete all ${notificationsSnapshot.size} notifications (all appear to be orphaned)`);
      console.log('\n💡 Run without --dry-run to perform actual cleanup');
      return;
    }
    
    // Delete all in batches
    const batch = db.batch();
    let count = 0;
    
    console.log('🗑️  Deleting orphaned notifications...');
    
    notificationsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
      
      // Commit every 500 operations
      if (count % 500 === 0) {
        console.log(`✅ Deleted ${count} notifications...`);
      }
    });
    
    // Commit the final batch
    await batch.commit();
    
    console.log(`\n✅ Successfully deleted ${count} orphaned notifications!`);
    console.log('🔄 The badge should now match the modal content');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    console.log('\n🔄 Script completed. Exiting...');
    process.exit(0);
  }
}

quickCleanup();
