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

// Test data templates
const testLocations = [
  { address: "123 Main St, Bakersfield, CA 93301", lat: 35.3733, lng: -119.0187 },
  { address: "456 Oak Ave, Bakersfield, CA 93305", lat: 35.3789, lng: -119.0234 },
  { address: "789 Pine St, Bakersfield, CA 93307", lat: 35.3823, lng: -119.0172 },
  { address: "321 Elm Dr, Bakersfield, CA 93308", lat: 35.3845, lng: -119.0145 },
  { address: "654 Maple Ave, Bakersfield, CA 93309", lat: 35.3876, lng: -119.0118 }
];

const testPatients = [
  { id: "PATIENT_001", name: "John Smith" },
  { id: "PATIENT_002", name: "Mary Johnson" },
  { id: "PATIENT_003", name: "Robert Davis" },
  { id: "PATIENT_004", name: "Sarah Wilson" }
];

const testCustomers = [
  { id: "CUSTOMER_001", name: "Alice Brown" },
  { id: "CUSTOMER_002", name: "Bob Miller" },
  { id: "CUSTOMER_003", name: "Carol Garcia" }
];

async function createTestScheduledRides() {
  try {
    console.log('🧪 Creating test scheduled rides...\n');

    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const driverId = args.find(arg => arg.startsWith('--driver='))?.split('=')[1] || 'bxQN8D3uEpY8cwUJPhGhrXlnKuG3';
    
    if (dryRun) {
      console.log('🔍 DRY RUN MODE - No actual data will be created\n');
    }
    
    console.log(`👤 Target driver ID: ${driverId}`);
    console.log(`📅 Creating rides for the next 7 days...\n`);

    const now = new Date();
    const rides = [];
    
    // Create 3 medical rides
    for (let i = 1; i <= 3; i++) {
      const pickupTime = new Date(now.getTime() + (i * 24 * 60 * 60 * 1000) + (9 * 60 * 60 * 1000)); // Next 3 days at 9 AM
      const patient = testPatients[i - 1];
      const pickup = testLocations[0];
      const dropoff = testLocations[i % testLocations.length];
      
      const medicalRide = {
        requestType: 'medical',
        rideId: `medical_${Date.now()}_${i}`,
        patientId: patient.id,
        patientName: patient.name,
        appointmentType: i === 1 ? 'Dialysis' : i === 2 ? 'Doctor Visit' : 'Physical Therapy',
        pickupLocation: {
          address: pickup.address,
          coordinates: { lat: pickup.lat, lng: pickup.lng }
        },
        dropoffLocation: {
          address: dropoff.address,
          coordinates: { lat: dropoff.lat, lng: dropoff.lng }
        },
        pickupDateTime: admin.firestore.Timestamp.fromDate(pickupTime),
        estimatedDuration: 45 + (i * 15),
        medicalRequirements: {
          wheelchairAccessible: i % 2 === 0,
          assistanceLevel: i === 1 ? 'moderate' : i === 2 ? 'minimal' : 'high',
          oxygenSupport: i === 3,
          stretcherRequired: i === 3,
          specialInstructions: i === 1 ? 'Recurring dialysis - Wednesday schedule' : 
                              i === 2 ? 'Regular checkup' : 'Physical therapy session'
        },
        priorityLevel: i === 1 ? 'routine' : i === 2 ? 'urgent' : 'routine',
        status: 'pending',
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
        dispatcherId: 'DISPATCHER_001'
      };
      
      rides.push({ type: 'medical', data: medicalRide });
    }
    
    // Create 2 regular scheduled rides
    for (let i = 1; i <= 2; i++) {
      const pickupTime = new Date(now.getTime() + ((i + 3) * 24 * 60 * 60 * 1000) + (14 * 60 * 60 * 1000)); // Next 2 days at 2 PM
      const customer = testCustomers[i - 1];
      const pickup = testLocations[i];
      const dropoff = testLocations[(i + 2) % testLocations.length];
      
      const regularRide = {
        requestType: 'regular',
        rideId: `regular_${Date.now()}_${i}`,
        customerId: customer.id,
        customerName: customer.name,
        pickup: {
          address: pickup.address,
          coordinates: { lat: pickup.lat, lng: pickup.lng }
        },
        dropoff: {
          address: dropoff.address,
          coordinates: { lat: dropoff.lat, lng: dropoff.lng }
        },
        scheduledDateTime: admin.firestore.Timestamp.fromDate(pickupTime),
        rideType: i === 1 ? 'standard' : 'premium',
        estimatedDuration: 30 + (i * 10),
        estimatedFare: 15 + (i * 5),
        specialInstructions: i === 1 ? 'Airport pickup - may have luggage' : 'Shopping trip - may have bags',
        status: 'pending',
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now()
      };
      
      rides.push({ type: 'regular', data: regularRide });
    }
    
    console.log('📋 Test rides to create:');
    console.log('==================================================');
    
    for (const ride of rides) {
      const timeField = ride.type === 'medical' ? 'pickupDateTime' : 'scheduledDateTime';
      const time = ride.data[timeField].toDate();
      console.log(`📅 ${ride.type.toUpperCase()} Ride: ${ride.data.rideId}`);
      console.log(`   Time: ${time.toLocaleString()}`);
      console.log(`   ${ride.type === 'medical' ? 'Patient' : 'Customer'}: ${ride.data.patientName || ride.data.customerName}`);
      console.log(`   Pickup: ${ride.data.pickupLocation?.address || ride.data.pickup.address}`);
      console.log(`   Dropoff: ${ride.data.dropoffLocation?.address || ride.data.dropoff.address}`);
      console.log('   ---');
    }
    
    if (dryRun) {
      console.log('\n💡 Run without --dry-run to create the test data');
      return;
    }
    
    // Create the rides in the database
    console.log('\n🗄️  Creating rides in database...');
    
    for (const ride of rides) {
      const collection = ride.type === 'medical' ? 'medicalRideSchedule' : 'scheduledRides';
      await db.collection(collection).doc(ride.data.rideId).set(ride.data);
      console.log(`✅ Created ${ride.type} ride: ${ride.data.rideId}`);
    }
    
    // Create notifications for the driver
    console.log('\n🔔 Creating notifications for driver...');
    
    for (const ride of rides) {
      const notification = {
        userId: driverId,
        type: ride.type === 'medical' ? 'medical_ride_request' : 'scheduled_ride_request',
        status: 'pending',
        title: `New ${ride.type} ride request`,
        message: `${ride.type === 'medical' ? 'Medical' : 'Scheduled'} ride from ${ride.data.pickupLocation?.address || ride.data.pickup.address}`,
        data: {
          rideId: ride.data.rideId,
          requestType: ride.type,
          pickupTime: ride.type === 'medical' ? ride.data.pickupDateTime : ride.data.scheduledDateTime
        },
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now()
      };
      
      const notificationRef = await db.collection('notifications').add(notification);
      console.log(`✅ Created notification: ${notificationRef.id} for ride ${ride.data.rideId}`);
    }
    
    console.log('\n🎉 Test data creation completed!');
    console.log('==================================================');
    console.log('📊 Summary:');
    console.log(`   Medical rides: 3`);
    console.log(`   Regular rides: 2`);
    console.log(`   Total notifications: 5`);
    console.log(`   Driver ID: ${driverId}`);
    console.log('\n🔄 Check your driver app - the badge should now show 5 pending requests!');
    console.log('📱 The modal should display all 5 rides with details.');
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    console.log('\n🔄 Script completed. Exiting...');
    process.exit(0);
  }
}

// Run the test data creation function
createTestScheduledRides();
