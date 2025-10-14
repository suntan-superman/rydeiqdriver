#!/usr/bin/env node

/**
 * Ride Cleanup Script with Authentication
 * 
 * This version handles Firebase authentication to access your Firestore data.
 * You'll need to authenticate with your Firebase project to run this script.
 * 
 * Usage:
 * node scripts/cleanup-rides-auth.js --start-date=2025-01-01 --end-date=2025-10-12 --dry-run
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc, 
  orderBy, 
  limit 
} = require('firebase/firestore');
const { 
  getAuth, 
  signInWithEmailAndPassword,
  connectAuthEmulator 
} = require('firebase/auth');

// Firebase configuration - using your actual project config
const firebaseConfig = {
  apiKey: "AIzaSyB9rIUiKOdcrEI3H8-OZ6STioLImUTfJ9o",
  authDomain: "ryde-9d4bf.firebaseapp.com",
  projectId: "ryde-9d4bf",
  storageBucket: "ryde-9d4bf.firebasestorage.app",
  messagingSenderId: "649308231342",
  appId: "1:649308231342:web:1e6e424c4195c2ba72ff3f",
  measurementId: "G-YQJHJBNZJ7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Collections to clean up
const COLLECTIONS = {
  RIDE_REQUESTS: 'rideRequests',
  MEDICAL_RIDE_REQUESTS: 'medicalRideRequests', 
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
    email: null,
    password: null,
    help: false
  };

  args.forEach(arg => {
    if (arg.startsWith('--start-date=')) {
      options.startDate = new Date(arg.split('=')[1]);
    } else if (arg.startsWith('--end-date=')) {
      options.endDate = new Date(arg.split('=')[1]);
    } else if (arg.startsWith('--email=')) {
      options.email = arg.split('=')[1];
    } else if (arg.startsWith('--password=')) {
      options.password = arg.split('=')[1];
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
🚗 Ride Cleanup Script (with Authentication)

This script helps delete multiple rides from Firebase collections based on date ranges.
You need to authenticate with your Firebase account to access the data.

USAGE:
  node scripts/cleanup-rides-auth.js [OPTIONS]

OPTIONS:
  --start-date=YYYY-MM-DD    Start date for deletion range (required)
  --end-date=YYYY-MM-DD      End date for deletion range (required)
  --email=your-email         Your Firebase account email (required)
  --password=your-password   Your Firebase account password (required)
  --include-medical          Also delete from medicalRideRequests collection
  --include-scheduled        Also delete from scheduledRides collection
  --dry-run                  Show what would be deleted without actually deleting
  --help, -h                 Show this help message

EXAMPLES:
  # Delete rides from January 2025 (dry run)
  node scripts/cleanup-rides-auth.js --start-date=2025-01-01 --end-date=2025-01-31 --email=your-email@domain.com --password=yourpassword --dry-run

  # Delete rides including medical and scheduled
  node scripts/cleanup-rides-auth.js --start-date=2025-01-01 --end-date=2025-01-31 --email=your-email@domain.com --password=yourpassword --include-medical --include-scheduled

NOTES:
  - You need to use an admin account or an account with Firestore read/write permissions
  - Date format must be YYYY-MM-DD
  - The script will delete rides where the 'createdAt' field falls within the date range
  - Use --dry-run first to see what will be deleted
  - For security, consider using environment variables for credentials

ENVIRONMENT VARIABLES (Alternative to command line):
  FIREBASE_EMAIL=your-email@domain.com
  FIREBASE_PASSWORD=yourpassword
`);
}

/**
 * Authenticate with Firebase
 */
async function authenticateFirebase(email, password) {
  try {
    console.log('🔐 Authenticating with Firebase...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log(`✅ Authenticated as: ${userCredential.user.email}`);
    return userCredential.user;
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    throw error;
  }
}

/**
 * Get rides from a collection within date range
 */
async function getRidesInDateRange(collectionName, startDate, endDate) {
  try {
    console.log(`📋 Fetching rides from ${collectionName}...`);
    
    // Query for rides within date range
    const ridesRef = collection(db, collectionName);
    const q = query(
      ridesRef,
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate),
      orderBy('createdAt'),
      limit(1000) // Safety limit to prevent memory issues
    );
    
    const snapshot = await getDocs(q);
    const rides = [];
    
    snapshot.forEach(doc => {
      rides.push({
        id: doc.id,
        data: doc.data()
      });
    });
    
    console.log(`   Found ${rides.length} rides in ${collectionName}`);
    return rides;
    
  } catch (error) {
    console.error(`❌ Error fetching rides from ${collectionName}:`, error.message);
    return [];
  }
}

/**
 * Delete a ride document
 */
async function deleteRide(collectionName, rideId, dryRun = false) {
  try {
    if (dryRun) {
      console.log(`   [DRY RUN] Would delete ${rideId} from ${collectionName}`);
      return true;
    }
    
    await deleteDoc(doc(db, collectionName, rideId));
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
  const { startDate, endDate, includeMedical, includeScheduled, dryRun, email, password } = options;
  
  console.log('🚗 Starting Ride Cleanup Script');
  console.log(`📅 Date Range: ${startDate.toDateString()} to ${endDate.toDateString()}`);
  console.log(`🔍 Mode: ${dryRun ? 'DRY RUN (no actual deletions)' : 'LIVE DELETION'}`);
  console.log('');
  
  // Authenticate
  await authenticateFirebase(email, password);
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
    
    const rides = await getRidesInDateRange(collectionName, startDate, endDate);
    
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
      const success = await deleteRide(collectionName, ride.id, dryRun);
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
  
  if (!options.email || !options.password) {
    console.error('❌ Error: Both --email and --password are required');
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
