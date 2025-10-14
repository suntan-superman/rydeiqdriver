#!/usr/bin/env node

/**
 * Ride Cleanup Script using Firebase Admin SDK
 * 
 * This version uses the Firebase Admin SDK for Node.js which properly supports service accounts.
 * 
 * Setup:
 * 1. Install Firebase Admin SDK: npm install firebase-admin
 * 2. Go to Firebase Console > Project Settings > Service Accounts
 * 3. Click "Generate new private key" 
 * 4. Save the JSON file as 'firebase-service-account.json' in the scripts folder
 * 5. Run the script
 * 
 * Usage:
 * node scripts/cleanup-rides-admin.js --start-date=2025-01-01 --end-date=2025-10-12 --dry-run
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Collections to clean up
const COLLECTIONS = {
  RIDE_REQUESTS: 'rideRequests',
  MEDICAL_RIDE_REQUESTS: 'medicalRideSchedule', 
  SCHEDULED_RIDES: 'scheduledRides'
};

/**
 * Parse command line arguments
 */
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {
    startDate: null,
    endDate: null,
    includeMedical: false,
    includeScheduled: false,
    dryRun: false,
    help: false
  };

  args.forEach(arg => {
    if (arg.startsWith('--start-date=')) {
      options.startDate = new Date(arg.split('=')[1]);
    } else if (arg.startsWith('--end-date=')) {
      options.endDate = new Date(arg.split('=')[1]);
    } else if (arg === '--include-medical') {
      options.includeMedical = true;
    } else if (arg === '--include-scheduled') {
      options.includeScheduled = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    }
  });

  return options;
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
🚗 Ride Cleanup Script (Firebase Admin SDK)

This script helps delete multiple rides from Firebase collections using the Firebase Admin SDK.
This method bypasses user authentication and uses admin privileges.

SETUP REQUIRED:
1. Install Firebase Admin SDK: npm install firebase-admin
2. Go to Firebase Console > Project Settings > Service Accounts
3. Click "Generate new private key"
4. Save the JSON file as 'firebase-service-account.json' in the scripts folder
5. Run the script

USAGE:
  node scripts/cleanup-rides-admin.js [OPTIONS]

OPTIONS:
  --start-date=YYYY-MM-DD    Start date for deletion range (required)
  --end-date=YYYY-MM-DD      End date for deletion range (required)
  --include-medical          Also delete from medicalRideRequests collection
  --include-scheduled        Also delete from scheduledRides collection
  --dry-run                  Show what would be deleted without actually deleting
  --help, -h                 Show this help message

EXAMPLES:
  # Delete rides from January 2025 (dry run)
  node scripts/cleanup-rides-admin.js --start-date=2025-01-01 --end-date=2025-01-31 --dry-run

  # Delete rides including medical and scheduled
  node scripts/cleanup-rides-admin.js --start-date=2025-01-01 --end-date=2025-01-31 --include-medical --include-scheduled

NOTES:
  - The service account has admin privileges and can access all data
  - Date format must be YYYY-MM-DD
  - The script will delete rides where the 'createdAt' field falls within the date range
  - Use --dry-run first to see what will be deleted
  - Keep the service account JSON file secure and don't commit it to version control
`);
}

/**
 * Initialize Firebase Admin with service account
 */
function initializeFirebaseAdmin() {
  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      console.log('✅ Firebase Admin already initialized');
      return admin.firestore();
    }
    
    // Look for service account file
    const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
    
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(`
❌ Service account file not found!

Please follow these steps:
1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate new private key"
3. Save the JSON file as 'firebase-service-account.json' in the scripts folder
4. Run the script again

The file should be located at: ${serviceAccountPath}
`);
    }
    
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    
    console.log(`🔐 Using service account: ${serviceAccount.client_email}`);
    
    // Initialize Firebase Admin with service account
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com/`
    });
    
    const db = admin.firestore();
    console.log(`✅ Connected to Firebase project: ${serviceAccount.project_id}`);
    
    return db;
    
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error.message);
    throw error;
  }
}

/**
 * Get rides from a collection within date range
 */
async function getRidesInDateRange(db, collectionName, startDate, endDate) {
  try {
    console.log(`📋 Fetching rides from ${collectionName}...`);
    
    console.log(`   Searching for rides between ${startDate.toLocaleString()} and ${endDate.toLocaleString()}`);
    
    // Get all documents from the collection since createdAt might be a placeholder
    console.log(`   Getting all documents from ${collectionName}...`);
    
    const allSnapshot = await db.collection(collectionName).get();
    console.log(`   Found ${allSnapshot.size} total documents in ${collectionName}`);
    
    const filteredRides = [];
    let validTimestamps = 0;
    let placeholderTimestamps = 0;
    let documentIdTimestamps = 0;
    
    allSnapshot.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt;
      
      // Handle different timestamp formats
      let rideDate = null;
      let timestampSource = 'none';
      
      if (createdAt && createdAt.seconds) {
        // Valid Firestore Timestamp
        rideDate = new Date(createdAt.seconds * 1000);
        timestampSource = 'createdAt';
        validTimestamps++;
      } else if (createdAt && createdAt._seconds) {
        // Alternative Firestore Timestamp format
        rideDate = new Date(createdAt._seconds * 1000);
        timestampSource = 'createdAt';
        validTimestamps++;
      } else if (createdAt && typeof createdAt === 'number') {
        // Unix timestamp
        rideDate = new Date(createdAt);
        timestampSource = 'createdAt';
        validTimestamps++;
      } else if (createdAt && createdAt.toDate) {
        // Firestore Timestamp with toDate method
        rideDate = createdAt.toDate();
        timestampSource = 'createdAt';
        validTimestamps++;
      } else if (createdAt && createdAt._methodName === 'serverTimestamp') {
        // Placeholder serverTimestamp - try to extract from document ID
        placeholderTimestamps++;
        const docId = doc.id;
        
        // Try to extract timestamp from document ID (e.g., "ride_1760381687805_vjqymaqrk" or "medical_1759450256202_13")
        const timestampMatch = docId.match(/(ride_|medical_)(\d+)_/);
        if (timestampMatch) {
          rideDate = new Date(parseInt(timestampMatch[2]));
          timestampSource = 'documentId';
          documentIdTimestamps++;
        }
      }
      
      // Check if ride is in date range
      if (rideDate && rideDate >= startDate && rideDate <= endDate) {
        filteredRides.push({ 
          id: doc.id, 
          data: data, 
          createdAt: rideDate,
          timestampSource: timestampSource
        });
      }
    });
    
    console.log(`   Valid timestamps: ${validTimestamps}`);
    console.log(`   Placeholder timestamps: ${placeholderTimestamps}`);
    console.log(`   Document ID timestamps: ${documentIdTimestamps}`);
    console.log(`   Found ${filteredRides.length} rides in date range`);
    
    // Show sample of found rides
    if (filteredRides.length > 0) {
      console.log(`   Sample rides found:`);
      filteredRides.slice(0, 3).forEach((ride, index) => {
        console.log(`     ${index + 1}. ID: ${ride.id}, Date: ${ride.createdAt.toISOString()}, Source: ${ride.timestampSource}`);
      });
    }
    
    return filteredRides;
    
  } catch (error) {
    console.error(`❌ Error fetching rides from ${collectionName}:`, error.message);
    return [];
  }
}

/**
 * Delete a ride document
 */
async function deleteRide(db, collectionName, rideId, dryRun = false) {
  try {
    if (dryRun) {
      console.log(`   [DRY RUN] Would delete ${rideId} from ${collectionName}`);
      return true;
    }
    
    await db.collection(collectionName).doc(rideId).delete();
    console.log(`   ✅ Deleted ${rideId} from ${collectionName}`);
    return true;
    
  } catch (error) {
    console.error(`   ❌ Error deleting ${rideId} from ${collectionName}:`, error.message);
    return false;
  }
}

/**
 * Main cleanup function
 */
async function cleanupRides(options) {
  const { startDate, endDate, includeMedical, includeScheduled, dryRun } = options;
  
  console.log('🚗 Starting Ride Cleanup Script (Firebase Admin SDK)');
  console.log(`📅 Date Range: ${startDate.toDateString()} to ${endDate.toDateString()}`);
  console.log(`🔍 Mode: ${dryRun ? 'DRY RUN (no actual deletions)' : 'LIVE DELETION'}`);
  console.log('');
  
  // Initialize Firebase Admin with service account
  const db = initializeFirebaseAdmin();
  console.log('');
  
  // Collections to process
  const collectionsToProcess = [COLLECTIONS.RIDE_REQUESTS];
  if (includeMedical) collectionsToProcess.push(COLLECTIONS.MEDICAL_RIDE_REQUESTS);
  if (includeScheduled) collectionsToProcess.push(COLLECTIONS.SCHEDULED_RIDES);
  
  let totalDeleted = 0;
  let totalErrors = 0;
  
  // Process each collection
  for (const collectionName of collectionsToProcess) {
    console.log(`\n📦 Processing ${collectionName}...`);
    
    const rides = await getRidesInDateRange(db, collectionName, startDate, endDate);
    
    if (rides.length === 0) {
      console.log(`   No rides found in date range.`);
      continue;
    }
    
    // Show sample of what will be deleted
    console.log(`   Sample rides to delete:`);
    rides.slice(0, 3).forEach(ride => {
      const createdAt = ride.data.createdAt?.toDate?.() || ride.data.createdAt || 'Unknown date';
      console.log(`     - ${ride.id} (${createdAt})`);
    });
    if (rides.length > 3) {
      console.log(`     ... and ${rides.length - 3} more`);
    }
    
    // Confirm deletion (unless dry run)
    if (!dryRun) {
      console.log(`\n⚠️  About to delete ${rides.length} rides from ${collectionName}`);
      console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Delete rides
    console.log(`\n🗑️  ${dryRun ? 'Simulating deletion of' : 'Deleting'} ${rides.length} rides...`);
    
    for (const ride of rides) {
      const success = await deleteRide(db, collectionName, ride.id, dryRun);
      if (success) {
        totalDeleted++;
      } else {
        totalErrors++;
      }
      
      // Small delay to avoid overwhelming Firebase
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log(`   ✅ Completed ${collectionName}`);
  }
  
  // Summary
  console.log('\n📊 Cleanup Summary:');
  console.log(`   Collections processed: ${collectionsToProcess.length}`);
  console.log(`   Total ${dryRun ? 'would be deleted' : 'deleted'}: ${totalDeleted}`);
  if (totalErrors > 0) {
    console.log(`   Errors: ${totalErrors}`);
  }
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE DELETION'}`);
  
  if (dryRun) {
    console.log('\n💡 Run without --dry-run to perform actual deletions');
  } else {
    console.log('\n🎉 Cleanup completed!');
  }
}

/**
 * Main execution
 */
async function main() {
  const options = parseArguments();
  
  if (options.help) {
    showHelp();
    return;
  }
  
  // Validate arguments
  if (!options.startDate || !options.endDate) {
    console.error('❌ Error: Both --start-date and --end-date are required');
    console.log('Use --help for usage information');
    process.exit(1);
  }
  
  if (options.startDate >= options.endDate) {
    console.error('❌ Error: Start date must be before end date');
    process.exit(1);
  }
  
  try {
    await cleanupRides(options);
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { cleanupRides, getRidesInDateRange };
