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

async function debugRides() {
  try {
    console.log('🔍 Debugging rideRequests collection...\n');
    
    // Get a few sample documents to understand the structure
    const snapshot = await db.collection('rideRequests').limit(5).get();
    
    if (snapshot.empty) {
      console.log('❌ No documents found in rideRequests collection');
      return;
    }
    
    console.log(`📋 Found ${snapshot.size} sample documents:\n`);
    
    snapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`📄 Document ${index + 1} (ID: ${doc.id}):`);
      console.log('   Status:', data.status || 'N/A');
      
      // Check if it's a Firestore Timestamp
      if (data.createdAt && data.createdAt.seconds) {
        console.log('   CreatedAt seconds:', data.createdAt.seconds);
        console.log('   CreatedAt nanoseconds:', data.createdAt.nanoseconds);
        console.log('   CreatedAt date:', new Date(data.createdAt.seconds * 1000));
        console.log('   CreatedAt ISO:', new Date(data.createdAt.seconds * 1000).toISOString());
      } else if (data.createdAt) {
        console.log('   CreatedAt (raw):', JSON.stringify(data.createdAt));
      } else {
        console.log('   CreatedAt: N/A');
      }
      
      // Check for other timestamp fields
      if (data.timestamp && data.timestamp.seconds) {
        console.log('   Timestamp seconds:', data.timestamp.seconds);
        console.log('   Timestamp nanoseconds:', data.timestamp.nanoseconds);
        console.log('   Timestamp date:', new Date(data.timestamp.seconds * 1000));
        console.log('   Timestamp ISO:', new Date(data.timestamp.seconds * 1000).toISOString());
      } else if (data.timestamp) {
        console.log('   Timestamp (raw):', JSON.stringify(data.timestamp));
      } else {
        console.log('   Timestamp: N/A');
      }
      
      console.log('   Rider ID:', data.riderId || 'N/A');
      console.log('   Platform:', data.platform || 'N/A');
      console.log('   ---');
    });
    
    // Now let's try to query with a very broad date range
    console.log('\n🔍 Testing query with broad date range...');
    
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    
    console.log(`   Searching from: ${oneYearAgo.toISOString()}`);
    console.log(`   Searching to: ${now.toISOString()}`);
    
    const querySnapshot = await db.collection('rideRequests')
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(oneYearAgo))
      .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(now))
      .limit(10)
      .get();
    
    console.log(`   Found ${querySnapshot.size} rides in broad date range`);
    
    if (querySnapshot.size > 0) {
      console.log('\n📋 Sample rides from broad query:');
      querySnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. ID: ${doc.id}, Status: ${data.status}, Created: ${data.createdAt ? new Date(data.createdAt.seconds * 1000) : 'N/A'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error debugging rides:', error);
  } finally {
    process.exit(0);
  }
}

debugRides();
