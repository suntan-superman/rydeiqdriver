const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ryde-9d4bf-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

/**
 * Create extended test scheduled ride requests for the next 2-3 weeks
 * Generates 10-15 diverse ride requests across multiple days
 */
async function createExtendedTestRides() {
  try {
    console.log('🚀 Creating extended test scheduled ride requests (2-3 weeks)...');

    // Get approved/available drivers
    const driversSnapshot = await db.collection('driverApplications')
      .where('status', 'in', ['approved', 'available'])
      .get();

    if (driversSnapshot.empty) {
      console.log('❌ No approved/available drivers found.');
      return;
    }

    const drivers = driversSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`📋 Found ${drivers.length} drivers`);

    // Generate diverse test rides across 2-3 weeks
    const testRides = [];
    const now = Date.now();
    
    // Helper function to add days
    const addDays = (days) => now + (days * 24 * 60 * 60 * 1000);
    
    // Helper function to set time
    const setTime = (baseDate, hours, minutes = 0) => {
      const date = new Date(baseDate);
      date.setHours(hours, minutes, 0, 0);
      return date;
    };

    // Week 1 - Days 1-7
    testRides.push(
      // Day 1 - Tomorrow
      {
        rideId: `medical_${now}_1`,
        requestType: 'medical',
        appointmentType: 'Dialysis',
        patientId: 'PATIENT_001',
        pickupDateTime: setTime(addDays(1), 8, 30),
        pickupLocation: {
          address: '123 Main St, Bakersfield, CA 93301',
          coordinates: { lat: 35.3733, lng: -119.0187 }
        },
        dropoffLocation: {
          address: '456 Hospital Ave, Bakersfield, CA 93305',
          coordinates: { lat: 35.3789, lng: -119.0234 }
        },
        medicalRequirements: {
          wheelchairAccessible: true,
          oxygenSupport: false,
          stretcherRequired: false,
          assistanceLevel: 'moderate',
          specialInstructions: 'Patient requires assistance'
        },
        estimatedDuration: 120,
        priorityLevel: 'routine',
        dispatcherId: 'DISPATCHER_001'
      },
      {
        rideId: `regular_${now}_2`,
        requestType: 'regular',
        rideType: 'standard',
        customerId: 'CUSTOMER_001',
        scheduledDateTime: setTime(addDays(1), 14, 0),
        pickup: {
          address: '555 Elm St, Bakersfield, CA 93304',
          coordinates: { lat: 35.3767, lng: -119.0123 }
        },
        dropoff: {
          address: '777 Pine Ave, Bakersfield, CA 93306',
          coordinates: { lat: 35.3798, lng: -119.0167 }
        },
        estimatedFare: 22.50,
        estimatedDuration: 45,
        specialInstructions: 'Call upon arrival'
      },
      
      // Day 2
      {
        rideId: `medical_${now}_3`,
        requestType: 'medical',
        appointmentType: 'Physical Therapy',
        patientId: 'PATIENT_002',
        pickupDateTime: setTime(addDays(2), 10, 0),
        pickupLocation: {
          address: '789 Oak St, Bakersfield, CA 93308',
          coordinates: { lat: 35.3812, lng: -119.0156 }
        },
        dropoffLocation: {
          address: '321 Medical Center Dr, Bakersfield, CA 93309',
          coordinates: { lat: 35.3856, lng: -119.0198 }
        },
        medicalRequirements: {
          wheelchairAccessible: false,
          oxygenSupport: true,
          stretcherRequired: false,
          assistanceLevel: 'minimal',
          specialInstructions: 'Patient has portable oxygen tank'
        },
        estimatedDuration: 90,
        priorityLevel: 'routine',
        dispatcherId: 'DISPATCHER_001'
      },
      
      // Day 3
      {
        rideId: `regular_${now}_4`,
        requestType: 'regular',
        rideType: 'premium',
        customerId: 'CUSTOMER_002',
        scheduledDateTime: setTime(addDays(3), 9, 30),
        pickup: {
          address: '111 Business Blvd, Bakersfield, CA 93301',
          coordinates: { lat: 35.3723, lng: -119.0201 }
        },
        dropoff: {
          address: '222 Corporate Way, Bakersfield, CA 93305',
          coordinates: { lat: 35.3801, lng: -119.0156 }
        },
        estimatedFare: 35.00,
        estimatedDuration: 60,
        specialInstructions: 'Business client - punctuality important'
      },
      {
        rideId: `medical_${now}_5`,
        requestType: 'medical',
        appointmentType: 'Doctor Visit',
        patientId: 'PATIENT_003',
        pickupDateTime: setTime(addDays(3), 15, 30),
        pickupLocation: {
          address: '456 Residential Ave, Bakersfield, CA 93307',
          coordinates: { lat: 35.3745, lng: -119.0178 }
        },
        dropoffLocation: {
          address: '789 Clinic Dr, Bakersfield, CA 93302',
          coordinates: { lat: 35.3778, lng: -119.0145 }
        },
        medicalRequirements: {
          wheelchairAccessible: false,
          oxygenSupport: false,
          stretcherRequired: false,
          assistanceLevel: 'minimal',
          specialInstructions: 'Elderly patient - drive carefully'
        },
        estimatedDuration: 75,
        priorityLevel: 'routine',
        dispatcherId: 'DISPATCHER_002'
      },
      
      // Day 5
      {
        rideId: `regular_${now}_6`,
        requestType: 'regular',
        rideType: 'standard',
        customerId: 'CUSTOMER_003',
        scheduledDateTime: setTime(addDays(5), 11, 0),
        pickup: {
          address: '888 Shopping Center, Bakersfield, CA 93304',
          coordinates: { lat: 35.3756, lng: -119.0189 }
        },
        dropoff: {
          address: '999 Restaurant Row, Bakersfield, CA 93301',
          coordinates: { lat: 35.3734, lng: -119.0201 }
        },
        estimatedFare: 18.00,
        estimatedDuration: 30,
        specialInstructions: 'Lunch appointment - on time preferred'
      },
      
      // Day 6
      {
        rideId: `medical_${now}_7`,
        requestType: 'medical',
        appointmentType: 'Dialysis',
        patientId: 'PATIENT_001',
        pickupDateTime: setTime(addDays(6), 8, 30),
        pickupLocation: {
          address: '123 Main St, Bakersfield, CA 93301',
          coordinates: { lat: 35.3733, lng: -119.0187 }
        },
        dropoffLocation: {
          address: '456 Hospital Ave, Bakersfield, CA 93305',
          coordinates: { lat: 35.3789, lng: -119.0234 }
        },
        medicalRequirements: {
          wheelchairAccessible: true,
          oxygenSupport: false,
          stretcherRequired: false,
          assistanceLevel: 'moderate',
          specialInstructions: 'Regular recurring dialysis patient'
        },
        estimatedDuration: 120,
        priorityLevel: 'routine',
        dispatcherId: 'DISPATCHER_001'
      },
    );

    // Week 2 - Days 8-14
    testRides.push(
      // Day 8
      {
        rideId: `regular_${now}_8`,
        requestType: 'regular',
        rideType: 'standard',
        customerId: 'CUSTOMER_004',
        scheduledDateTime: setTime(addDays(8), 13, 30),
        pickup: {
          address: '321 Airport Rd, Bakersfield, CA 93308',
          coordinates: { lat: 35.3825, lng: -119.0123 }
        },
        dropoff: {
          address: '654 Downtown St, Bakersfield, CA 93301',
          coordinates: { lat: 35.3729, lng: -119.0195 }
        },
        estimatedFare: 28.00,
        estimatedDuration: 50,
        specialInstructions: 'Airport pickup - check flight status'
      },
      
      // Day 9
      {
        rideId: `medical_${now}_9`,
        requestType: 'medical',
        appointmentType: 'Physical Therapy',
        patientId: 'PATIENT_002',
        pickupDateTime: setTime(addDays(9), 10, 0),
        pickupLocation: {
          address: '789 Oak St, Bakersfield, CA 93308',
          coordinates: { lat: 35.3812, lng: -119.0156 }
        },
        dropoffLocation: {
          address: '321 Medical Center Dr, Bakersfield, CA 93309',
          coordinates: { lat: 35.3856, lng: -119.0198 }
        },
        medicalRequirements: {
          wheelchairAccessible: false,
          oxygenSupport: true,
          stretcherRequired: false,
          assistanceLevel: 'minimal',
          specialInstructions: 'Recurring PT session'
        },
        estimatedDuration: 90,
        priorityLevel: 'routine',
        dispatcherId: 'DISPATCHER_001'
      },
      
      // Day 10
      {
        rideId: `regular_${now}_10`,
        requestType: 'regular',
        rideType: 'premium',
        customerId: 'CUSTOMER_005',
        scheduledDateTime: setTime(addDays(10), 16, 0),
        pickup: {
          address: '147 Hotel Circle, Bakersfield, CA 93301',
          coordinates: { lat: 35.3741, lng: -119.0184 }
        },
        dropoff: {
          address: '258 Conference Center, Bakersfield, CA 93305',
          coordinates: { lat: 35.3792, lng: -119.0167 }
        },
        estimatedFare: 32.00,
        estimatedDuration: 40,
        specialInstructions: 'VIP client - professional service expected'
      },
      
      // Day 12
      {
        rideId: `medical_${now}_11`,
        requestType: 'medical',
        appointmentType: 'Specialist Appointment',
        patientId: 'PATIENT_004',
        pickupDateTime: setTime(addDays(12), 14, 30),
        pickupLocation: {
          address: '963 Senior Living Dr, Bakersfield, CA 93306',
          coordinates: { lat: 35.3801, lng: -119.0134 }
        },
        dropoffLocation: {
          address: '852 Cardiology Center, Bakersfield, CA 93309',
          coordinates: { lat: 35.3867, lng: -119.0212 }
        },
        medicalRequirements: {
          wheelchairAccessible: true,
          oxygenSupport: false,
          stretcherRequired: false,
          assistanceLevel: 'moderate',
          specialInstructions: 'Cardiology appointment - no rushing'
        },
        estimatedDuration: 105,
        priorityLevel: 'routine',
        dispatcherId: 'DISPATCHER_002'
      },
      
      // Day 13
      {
        rideId: `regular_${now}_12`,
        requestType: 'regular',
        rideType: 'standard',
        customerId: 'CUSTOMER_006',
        scheduledDateTime: setTime(addDays(13), 10, 15),
        pickup: {
          address: '741 Community Center, Bakersfield, CA 93304',
          coordinates: { lat: 35.3771, lng: -119.0161 }
        },
        dropoff: {
          address: '852 Library Ln, Bakersfield, CA 93301',
          coordinates: { lat: 35.3738, lng: -119.0193 }
        },
        estimatedFare: 15.00,
        estimatedDuration: 25,
        specialInstructions: 'Short local trip'
      },
    );

    // Week 3 - Days 15-21
    testRides.push(
      // Day 15
      {
        rideId: `medical_${now}_13`,
        requestType: 'medical',
        appointmentType: 'Dialysis',
        patientId: 'PATIENT_001',
        pickupDateTime: setTime(addDays(15), 8, 30),
        pickupLocation: {
          address: '123 Main St, Bakersfield, CA 93301',
          coordinates: { lat: 35.3733, lng: -119.0187 }
        },
        dropoffLocation: {
          address: '456 Hospital Ave, Bakersfield, CA 93305',
          coordinates: { lat: 35.3789, lng: -119.0234 }
        },
        medicalRequirements: {
          wheelchairAccessible: true,
          oxygenSupport: false,
          stretcherRequired: false,
          assistanceLevel: 'moderate',
          specialInstructions: 'Recurring dialysis - Wednesday schedule'
        },
        estimatedDuration: 120,
        priorityLevel: 'routine',
        dispatcherId: 'DISPATCHER_001'
      },
      
      // Day 16
      {
        rideId: `regular_${now}_14`,
        requestType: 'regular',
        rideType: 'standard',
        customerId: 'CUSTOMER_007',
        scheduledDateTime: setTime(addDays(16), 12, 45),
        pickup: {
          address: '369 Park Ave, Bakersfield, CA 93307',
          coordinates: { lat: 35.3823, lng: -119.0172 }
        },
        dropoff: {
          address: '147 Mall Dr, Bakersfield, CA 93308',
          coordinates: { lat: 35.3845, lng: -119.0145 }
        },
        estimatedFare: 20.00,
        estimatedDuration: 35,
        specialInstructions: 'Shopping trip - may have bags'
      },
      
      // Day 18
      {
        rideId: `medical_${now}_15`,
        requestType: 'medical',
        appointmentType: 'Chemotherapy',
        patientId: 'PATIENT_005',
        pickupDateTime: setTime(addDays(18), 9, 0),
        pickupLocation: {
          address: '258 Residential St, Bakersfield, CA 93302',
          coordinates: { lat: 35.3759, lng: -119.0208 }
        },
        dropoffLocation: {
          address: '963 Cancer Center, Bakersfield, CA 93309',
          coordinates: { lat: 35.3881, lng: -119.0189 }
        },
        medicalRequirements: {
          wheelchairAccessible: false,
          oxygenSupport: false,
          stretcherRequired: false,
          assistanceLevel: 'full',
          specialInstructions: 'Patient may be feeling unwell - gentle drive, bring sick bags'
        },
        estimatedDuration: 150,
        priorityLevel: 'urgent',
        dispatcherId: 'DISPATCHER_002'
      },
      
      // Day 19
      {
        rideId: `regular_${now}_16`,
        requestType: 'regular',
        rideType: 'premium',
        customerId: 'CUSTOMER_008',
        scheduledDateTime: setTime(addDays(19), 17, 30),
        pickup: {
          address: '741 Executive Plaza, Bakersfield, CA 93301',
          coordinates: { lat: 35.3726, lng: -119.0211 }
        },
        dropoff: {
          address: '852 Fine Dining District, Bakersfield, CA 93305',
          coordinates: { lat: 35.3795, lng: -119.0223 }
        },
        estimatedFare: 38.00,
        estimatedDuration: 45,
        specialInstructions: 'Evening dinner reservation - punctuality critical'
      },
      
      // Day 20
      {
        rideId: `medical_${now}_17`,
        requestType: 'medical',
        appointmentType: 'Follow-up Appointment',
        patientId: 'PATIENT_006',
        pickupDateTime: setTime(addDays(20), 11, 15),
        pickupLocation: {
          address: '654 Nursing Home Way, Bakersfield, CA 93306',
          coordinates: { lat: 35.3804, lng: -119.0178 }
        },
        dropoffLocation: {
          address: '987 Primary Care Center, Bakersfield, CA 93301',
          coordinates: { lat: 35.3742, lng: -119.0196 }
        },
        medicalRequirements: {
          wheelchairAccessible: true,
          oxygenSupport: false,
          stretcherRequired: false,
          assistanceLevel: 'moderate',
          specialInstructions: 'Post-surgery follow-up - gentle handling'
        },
        estimatedDuration: 90,
        priorityLevel: 'routine',
        dispatcherId: 'DISPATCHER_001'
      }
    );

    console.log(`📝 Generated ${testRides.length} test ride requests`);
    console.log('📊 Distribution:');
    const medicalCount = testRides.filter(r => r.requestType === 'medical').length;
    const regularCount = testRides.filter(r => r.requestType === 'regular').length;
    console.log(`   - Medical: ${medicalCount}`);
    console.log(`   - Regular: ${regularCount}`);

    // Create ride documents and notifications
    let totalNotifications = 0;
    
    for (const request of testRides) {
      const rideCollection = request.requestType === 'medical' ? 'medicalRideSchedule' : 'scheduledRides';
      
      console.log(`\n📝 Creating ${request.requestType} ride: ${request.rideId}`);
      console.log(`   Pickup: ${request.pickupDateTime || request.scheduledDateTime}`);
      
      // Create ride document
      await db.collection(rideCollection).doc(request.rideId).set({
        ...request,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`   ✅ Ride document created in ${rideCollection}`);

      // Create notifications for each driver
      for (const driver of drivers) {
        const notificationData = {
          userId: driver.id,
          type: request.requestType === 'medical' ? 'medical_ride_request' : 'scheduled_ride_request',
          title: request.requestType === 'medical' ? 'Medical Transport Request' : 'Scheduled Ride Request',
          message: request.requestType === 'medical' 
            ? `${request.appointmentType} transport for ${request.patientId} - ${request.pickupDateTime.toLocaleString()}`
            : `${request.rideType} ride scheduled for ${request.scheduledDateTime.toLocaleString()}`,
          data: {
            rideId: request.rideId,
            requestType: request.requestType,
            ...(request.requestType === 'medical' ? {
              appointmentType: request.appointmentType,
              patientId: request.patientId,
              pickupDateTime: request.pickupDateTime,
              medicalRequirements: request.medicalRequirements
            } : {
              rideType: request.rideType,
              customerId: request.customerId,
              scheduledDateTime: request.scheduledDateTime,
              estimatedFare: request.estimatedFare
            })
          },
          status: 'pending',
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('notifications').add(notificationData);
        totalNotifications++;
      }
      console.log(`   ✅ Created ${drivers.length} notifications`);
    }

    console.log('\n🎉 Extended test scheduled ride requests created successfully!');
    console.log('📊 Summary:');
    console.log(`   - Total rides: ${testRides.length}`);
    console.log(`   - Medical rides: ${medicalCount}`);
    console.log(`   - Regular rides: ${regularCount}`);
    console.log(`   - Total notifications: ${totalNotifications}`);
    console.log(`   - Drivers notified: ${drivers.length}`);
    console.log('   - Time span: Next 2-3 weeks');
    console.log('\n👀 Drivers can now see these requests in their dashboard');
    console.log('📅 Use date filters to view rides by day/week/month');

  } catch (error) {
    console.error('❌ Error creating extended test rides:', error);
  }
}

// Run the script
createExtendedTestRides()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

