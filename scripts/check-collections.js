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

async function checkCollections() {
  try {
    console.log('🔍 Checking Firestore collections...\n');
    
    // List all collections
    const collections = await db.listCollections();
    
    console.log(`📋 Found ${collections.length} collections:`);
    console.log('='.repeat(50));
    
    for (const collection of collections) {
      const collectionName = collection.id;
      console.log(`\n📦 Collection: ${collectionName}`);
      
      // Get document count
      const snapshot = await collection.limit(1).get();
      const isEmpty = snapshot.empty;
      
      if (isEmpty) {
        console.log(`   Status: Empty (0 documents)`);
      } else {
        // Get a few sample documents to check structure
        const sampleSnapshot = await collection.limit(3).get();
        console.log(`   Status: Contains documents (showing up to 3 samples)`);
        
        sampleSnapshot.forEach((doc, index) => {
          const data = doc.data();
          console.log(`   Sample ${index + 1}: ${doc.id}`);
          
          // Check for common timestamp fields
          if (data.createdAt) {
            if (data.createdAt.seconds) {
              console.log(`     createdAt: ${new Date(data.createdAt.seconds * 1000).toISOString()} (Firestore Timestamp)`);
            } else if (data.createdAt._methodName === 'serverTimestamp') {
              console.log(`     createdAt: serverTimestamp placeholder`);
            } else {
              console.log(`     createdAt: ${JSON.stringify(data.createdAt)}`);
            }
          }
          
          if (data.timestamp) {
            if (data.timestamp.seconds) {
              console.log(`     timestamp: ${new Date(data.timestamp.seconds * 1000).toISOString()} (Firestore Timestamp)`);
            } else {
              console.log(`     timestamp: ${JSON.stringify(data.timestamp)}`);
            }
          }
          
          if (data.pickupDateTime) {
            if (data.pickupDateTime.seconds) {
              console.log(`     pickupDateTime: ${new Date(data.pickupDateTime.seconds * 1000).toISOString()} (Firestore Timestamp)`);
            } else {
              console.log(`     pickupDateTime: ${JSON.stringify(data.pickupDateTime)}`);
            }
          }
          
          console.log(`     status: ${data.status || 'N/A'}`);
          console.log(`     requestType: ${data.requestType || 'N/A'}`);
        });
      }
    }
    
    // Check for common collection name variations
    console.log('\n🔍 Checking for common collection name variations...');
    const commonNames = [
      'rideRequests',
      'medicalRideRequests', 
      'medicalRideSchedule',
      'scheduledRides',
      'rides',
      'medicalRides'
    ];
    
    for (const name of commonNames) {
      try {
        const collection = db.collection(name);
        const snapshot = await collection.limit(1).get();
        const exists = !snapshot.empty;
        console.log(`   ${name}: ${exists ? '✅ EXISTS' : '❌ Empty or does not exist'}`);
      } catch (error) {
        console.log(`   ${name}: ❌ Error accessing (${error.message})`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkCollections();
