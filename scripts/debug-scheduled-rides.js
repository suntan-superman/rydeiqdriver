const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Path to your service account key file
const serviceAccountPath = path.resolve(__dirname, 'firebase-service-account.json');

// Check if service account file exists
if (!fs.existsSync(serviceAccountPath)) {
  console.error(`❌ Error: Service account key file not found at ${serviceAccountPath}`);
  console.error('Please download your service account key from Firebase Console -> Project Settings -> Service Accounts -> Generate new private key, and save it as firebase-service-account.json in the scripts folder.');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const db = admin.firestore();

async function debugScheduledRides() {
  // Set a timeout to prevent hanging
  const timeout = setTimeout(() => {
    console.log('\n⏰ Script timeout - taking too long to respond');
    process.exit(1);
  }, 30000); // 30 second timeout
  
  try {
    console.log('🔍 Debugging Scheduled Rides Badge vs Modal Content...\n');

    console.log('📋 Checking ALL pending scheduled ride notifications...\n');
    
    // Check ALL pending notifications (not just one driver)
    const notificationsQuery = db.collection('notifications')
      .where('type', 'in', ['scheduled_ride_request', 'medical_ride_request'])
      .where('status', '==', 'pending');
    
    const notificationsSnapshot = await notificationsQuery.get();
    
    console.log(`📊 Found ${notificationsSnapshot.size} pending notifications`);
    
    if (notificationsSnapshot.size === 0) {
      console.log('✅ No pending notifications found - badge should show 0');
      return;
    }
    
    console.log('\n📄 Notification Details:');
    console.log('==================================================');
    
    const notifications = [];
    
    notificationsSnapshot.forEach(doc => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        type: data.type,
        status: data.status,
        rideId: data.data?.rideId,
        createdAt: data.createdAt,
        data: data.data
      });
      
      console.log(`📋 Notification ${doc.id}:`);
      console.log(`   Type: ${data.type}`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Ride ID: ${data.data?.rideId}`);
      console.log(`   Created: ${data.createdAt?.toDate?.() || data.createdAt}`);
      console.log('   ---');
    });
    
    console.log('\n🔍 Checking if referenced rides exist:');
    console.log('==================================================');
    
    for (const notification of notifications) {
      if (!notification.rideId) {
        console.log(`❌ Notification ${notification.id}: No rideId in data`);
        continue;
      }
      
      console.log(`\n🔍 Checking ride: ${notification.rideId}`);
      
      // Check medical rides
      try {
        const medicalRideDoc = await db.collection('medicalRideSchedule').doc(notification.rideId).get();
        if (medicalRideDoc.exists) {
          const medicalData = medicalRideDoc.data();
          console.log(`✅ Medical Ride Found:`);
          console.log(`   Status: ${medicalData.status}`);
          console.log(`   Assigned Driver: ${medicalData.assignedDriverId}`);
          console.log(`   Pickup DateTime: ${medicalData.pickupDateTime?.toDate?.() || medicalData.pickupDateTime}`);
          continue;
        }
      } catch (error) {
        console.log(`❌ Error checking medical ride: ${error.message}`);
      }
      
      // Check regular scheduled rides
      try {
        const scheduledRideDoc = await db.collection('scheduledRides').doc(notification.rideId).get();
        if (scheduledRideDoc.exists) {
          const scheduledData = scheduledRideDoc.data();
          console.log(`✅ Regular Scheduled Ride Found:`);
          console.log(`   Status: ${scheduledData.status}`);
          console.log(`   Assigned Driver: ${scheduledData.assignedDriverId}`);
          console.log(`   Scheduled DateTime: ${scheduledData.scheduledDateTime?.toDate?.() || scheduledData.scheduledDateTime}`);
          continue;
        }
      } catch (error) {
        console.log(`❌ Error checking scheduled ride: ${error.message}`);
      }
      
      console.log(`❌ No ride document found for ID: ${notification.rideId}`);
    }
    
    console.log('\n💡 Analysis Complete!');
    console.log('==================================================');
    console.log('The badge shows the notification count, but the modal shows rides that actually exist.');
    console.log('If notifications exist but rides are missing, the badge will be higher than the modal content.');
    
  } catch (error) {
    console.error('❌ Error debugging scheduled rides:', error);
  } finally {
    console.log('\n🔄 Script completed. Exiting...');
    process.exit(0);
  }
}

// Run the debug function
debugScheduledRides();
