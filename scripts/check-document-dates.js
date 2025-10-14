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

async function checkDocumentDates() {
  try {
    console.log('🔍 Checking document dates in rideRequests collection...\n');
    
    const snapshot = await db.collection('rideRequests').get();
    
    if (snapshot.empty) {
      console.log('❌ No documents found');
      return;
    }
    
    console.log(`📋 Found ${snapshot.size} documents:\n`);
    
    const documents = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const docId = doc.id;
      
      // Extract timestamp from document ID
      const timestampMatch = docId.match(/ride_(\d+)_/);
      if (timestampMatch) {
        const timestamp = parseInt(timestampMatch[1]);
        const date = new Date(timestamp);
        documents.push({
          id: docId,
          timestamp: timestamp,
          date: date,
          status: data.status || 'unknown'
        });
      }
    });
    
    // Sort by timestamp
    documents.sort((a, b) => a.timestamp - b.timestamp);
    
    console.log('📅 Document dates (sorted by creation time):');
    console.log('='.repeat(80));
    
    documents.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.id}`);
      console.log(`   Date: ${doc.date.toISOString()}`);
      console.log(`   Date (local): ${doc.date.toLocaleString()}`);
      console.log(`   Status: ${doc.status}`);
      console.log('');
    });
    
    // Show date range
    if (documents.length > 0) {
      const earliest = documents[0];
      const latest = documents[documents.length - 1];
      
      console.log('📊 Summary:');
      console.log(`   Earliest: ${earliest.date.toISOString()} (${earliest.id})`);
      console.log(`   Latest: ${latest.date.toISOString()} (${latest.id})`);
      console.log(`   Total documents: ${documents.length}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkDocumentDates();
