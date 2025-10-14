#!/usr/bin/env node

/**
 * Simple Ride Cleanup Script
 * 
 * This is a simplified version that works with your existing Firebase setup.
 * Make sure you have the Firebase SDK installed: npm install firebase
 * 
 * Usage:
 * node scripts/cleanup-rides-simple.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, deleteDoc, doc, orderBy, limit, Timestamp } = require('firebase/firestore');

// You can either import your existing config or set it here
// Option 1: Import your existing config
// const { db } = require('../src/services/firebase/config');

// Option 2: Set config directly (using your actual project config)
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

async function cleanupRides() {
  console.log('🚗 Ride Cleanup Script Starting...\n');
  
  // Configuration - Update these dates as needed
  const startDate = new Date('2025-01-01'); // Update this date
  const endDate = new Date('2025-01-31');   // Update this date
  
  console.log(`📅 Cleaning rides from ${startDate.toDateString()} to ${endDate.toDateString()}`);
  
  // Collections to clean (uncomment the ones you want to include)
  const collections = [
    'rideRequests',
    // 'medicalRideRequests',  // Uncomment to include medical rides
    // 'scheduledRides'        // Uncomment to include scheduled rides
  ];
  
  let totalDeleted = 0;
  
  for (const collectionName of collections) {
    console.log(`\n📦 Processing ${collectionName}...`);
    
    try {
      // Query for rides within date range
      const ridesRef = collection(db, collectionName);
      const q = query(
        ridesRef,
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate),
        orderBy('createdAt'),
        limit(500) // Safety limit
      );
      
      const snapshot = await getDocs(q);
      const rides = [];
      
      snapshot.forEach(doc => {
        rides.push({
          id: doc.id,
          data: doc.data()
        });
      });
      
      console.log(`   Found ${rides.length} rides to delete`);
      
      if (rides.length === 0) {
        continue;
      }
      
      // Show sample of what will be deleted
      console.log(`   Sample rides:`);
      rides.slice(0, 3).forEach(ride => {
        const createdAt = ride.data.createdAt?.toDate?.() || ride.data.createdAt || 'Unknown';
        console.log(`     - ${ride.id} (${createdAt})`);
      });
      
      // Delete rides
      console.log(`   Deleting ${rides.length} rides...`);
      
      for (const ride of rides) {
        try {
          await deleteDoc(doc(db, collectionName, ride.id));
          console.log(`     ✅ Deleted ${ride.id}`);
          totalDeleted++;
        } catch (error) {
          console.error(`     ❌ Error deleting ${ride.id}:`, error.message);
        }
        
        // Small delay to avoid overwhelming Firebase
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${collectionName}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Cleanup completed! Total deleted: ${totalDeleted}`);
}

// Run the cleanup
cleanupRides().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
