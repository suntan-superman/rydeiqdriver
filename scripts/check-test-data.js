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

async function checkTestData() {
  try {
    console.log('🔍 Checking test data...\n');

    // Check medical rides
    console.log('📋 Medical Rides (medicalRideSchedule):');
    const medicalRidesSnapshot = await db.collection('medicalRideSchedule').get();
    console.log(`   Found ${medicalRidesSnapshot.size} medical rides`);
    
    if (medicalRidesSnapshot.size > 0) {
      medicalRidesSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. ${doc.id} - ${data.status} - ${data.pickupDateTime?.toDate?.() || 'No date'}`);
      });
    }
    
    // Check regular scheduled rides
    console.log('\n📋 Regular Scheduled Rides (scheduledRides):');
    const scheduledRidesSnapshot = await db.collection('scheduledRides').get();
    console.log(`   Found ${scheduledRidesSnapshot.size} scheduled rides`);
    
    if (scheduledRidesSnapshot.size > 0) {
      scheduledRidesSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. ${doc.id} - ${data.status} - ${data.scheduledDateTime?.toDate?.() || 'No date'}`);
      });
    }
    
    // Check notifications
    console.log('\n🔔 Notifications:');
    const notificationsSnapshot = await db.collection('notifications')
      .where('type', 'in', ['scheduled_ride_request', 'medical_ride_request'])
      .where('status', '==', 'pending')
      .get();
    
    console.log(`   Found ${notificationsSnapshot.size} pending notifications`);
    
    if (notificationsSnapshot.size > 0) {
      notificationsSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. ${doc.id} - ${data.type} - Driver: ${data.userId} - Ride: ${data.data?.rideId}`);
      });
    }
    
    console.log('\n💡 Analysis:');
    console.log('==================================================');
    
    if (notificationsSnapshot.size === 0) {
      console.log('❌ No notifications found - this is why the badge shows 0');
      console.log('🔧 The script may have used the wrong driver ID');
    } else {
      console.log(`✅ Found ${notificationsSnapshot.size} notifications`);
      console.log('🔍 Check if any notifications are for your driver ID');
    }
    
    if (medicalRidesSnapshot.size === 0 && scheduledRidesSnapshot.size === 0) {
      console.log('❌ No ride documents found - script may not have run successfully');
    } else {
      console.log(`✅ Found ${medicalRidesSnapshot.size + scheduledRidesSnapshot.size} ride documents`);
    }
    
  } catch (error) {
    console.error('❌ Error checking test data:', error);
  } finally {
    console.log('\n🔄 Script completed. Exiting...');
    process.exit(0);
  }
}

checkTestData();
