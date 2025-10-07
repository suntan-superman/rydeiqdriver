const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteAllTestRides() {
  try {
    console.log('🗑️  Starting cleanup of all test rides...\n');

    // Delete from medicalRideSchedule
    console.log('📋 Deleting from medicalRideSchedule...');
    const medicalSnapshot = await db.collection('medicalRideSchedule').get();
    const medicalBatch = db.batch();
    let medicalCount = 0;
    
    medicalSnapshot.forEach(doc => {
      medicalBatch.delete(doc.ref);
      medicalCount++;
    });
    
    if (medicalCount > 0) {
      await medicalBatch.commit();
      console.log(`   ✅ Deleted ${medicalCount} medical rides`);
    } else {
      console.log('   ℹ️  No medical rides to delete');
    }

    // Delete from scheduledRides
    console.log('\n📋 Deleting from scheduledRides...');
    const scheduledSnapshot = await db.collection('scheduledRides').get();
    const scheduledBatch = db.batch();
    let scheduledCount = 0;
    
    scheduledSnapshot.forEach(doc => {
      scheduledBatch.delete(doc.ref);
      scheduledCount++;
    });
    
    if (scheduledCount > 0) {
      await scheduledBatch.commit();
      console.log(`   ✅ Deleted ${scheduledCount} scheduled rides`);
    } else {
      console.log('   ℹ️  No scheduled rides to delete');
    }

    // Delete all notifications with type 'scheduled_ride_request'
    console.log('\n📋 Deleting notifications...');
    const notificationsSnapshot = await db.collection('notifications')
      .where('type', '==', 'scheduled_ride_request')
      .get();
    
    const notificationBatch = db.batch();
    let notificationCount = 0;
    
    notificationsSnapshot.forEach(doc => {
      notificationBatch.delete(doc.ref);
      notificationCount++;
    });
    
    if (notificationCount > 0) {
      await notificationBatch.commit();
      console.log(`   ✅ Deleted ${notificationCount} notifications`);
    } else {
      console.log('   ℹ️  No notifications to delete');
    }

    console.log('\n🎉 Cleanup completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Medical rides deleted: ${medicalCount}`);
    console.log(`   - Scheduled rides deleted: ${scheduledCount}`);
    console.log(`   - Notifications deleted: ${notificationCount}`);
    console.log(`   - Total items deleted: ${medicalCount + scheduledCount + notificationCount}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

deleteAllTestRides();

