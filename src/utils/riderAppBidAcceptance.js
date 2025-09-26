/**
 * 🚗 TEMPORARY RIDER APP BID ACCEPTANCE UTILITY
 * 
 * This is a temporary utility to help test bid acceptance flow
 * between the rider app (rydeiqMobile) and driver app (rydeIQDriver)
 * 
 * When testing, the rider app can use this function to properly
 * accept driver bids and trigger the correct Firebase updates.
 */

import { db } from '../services/firebase/config';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

/**
 * Accept a driver's bid (for rider app testing)
 * @param {string} rideRequestId - The ride request ID
 * @param {Object} selectedBid - The selected bid object
 * @returns {Promise<Object>} Success response
 */
export const acceptDriverBidForTesting = async (rideRequestId, selectedBid) => {
  try {
    // console.log('🎯 RIDER APP TEST: Accepting driver bid:', { rideRequestId, selectedBid });

    const rideRequestRef = doc(db, 'rideRequests', rideRequestId);
    const rideRequestDoc = await getDoc(rideRequestRef);
    
    if (!rideRequestDoc.exists()) {
      throw new Error('Ride request not found');
    }

    const rideRequest = rideRequestDoc.data();
    
    // Find the bid in the driverBids array
    const driverBids = rideRequest.driverBids || [];
    const targetBid = driverBids.find(bid => 
      bid.driverId === selectedBid.driverId && 
      bid.bidAmount === selectedBid.bidAmount
    );

    if (!targetBid) {
      console.warn('⚠️ Bid not found in driverBids array, using provided bid data');
    }

    // Update ride request with bid acceptance
    await updateDoc(rideRequestRef, {
      status: 'accepted',
      acceptedAt: new Date(),
      acceptedDriver: {
        driverId: selectedBid.driverId,
        name: selectedBid.driverInfo?.name || 'Steve Roy',
        rating: selectedBid.driverInfo?.rating || 4.8,
        totalRides: selectedBid.driverInfo?.totalRides || 150
      },
      acceptedBid: selectedBid.bidAmount,
      finalPrice: selectedBid.bidAmount
    });

    // console.log('✅ RIDER APP TEST: Driver bid accepted successfully!', {
    //   rideRequestId,
    //   driverId: selectedBid.driverId,
    //   bidAmount: selectedBid.bidAmount
    // });

    return { 
      success: true, 
      rideRequestId, 
      selectedBid,
      message: 'Bid accepted successfully!' 
    };

  } catch (error) {
    console.error('❌ RIDER APP TEST: Error accepting driver bid:', error);
    throw error;
  }
};

/**
 * Test data for bid acceptance
 */
export const createTestBidForAcceptance = (rideRequestId, driverId = 'bxQN8D3uEpY8cwUJPhGhrXlnKuG3', bidAmount = 15.4) => {
  return {
    driverId,
    bidAmount,
    submittedAt: new Date(),
    driverInfo: {
      name: 'Steve Roy',
      rating: 4.8,
      totalRides: 150,
      email: 'sroy@prologixsa.com'
    }
  };
};

/**
 * Instructions for rider app testing
 */
export const RIDER_APP_TEST_INSTRUCTIONS = `
🧪 RIDER APP TESTING INSTRUCTIONS:

1. Copy this file to your rider app project
2. Import the acceptDriverBidForTesting function
3. When user taps "Accept Bid", call:

   import { acceptDriverBidForTesting, createTestBidForAcceptance } from './path/to/riderAppBidAcceptance';
   
   const handleAcceptBid = async (rideRequestId) => {
     try {
       const testBid = createTestBidForAcceptance(rideRequestId, 'bxQN8D3uEpY8cwUJPhGhrXlnKuG3', 15.4);
       const result = await acceptDriverBidForTesting(rideRequestId, testBid);
       console.log('Bid accepted:', result);
       // Navigate to driver tracking screen
     } catch (error) {
       console.error('Failed to accept bid:', error);
       // Show error message
     }
   };

4. This will properly update the Firebase document and trigger driver notifications
`;

export default {
  acceptDriverBidForTesting,
  createTestBidForAcceptance,
  RIDER_APP_TEST_INSTRUCTIONS
};
