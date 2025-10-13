// Driver Reliability & Anti-Gaming Service
// Handles reliability scoring, cooldowns, bid eligibility, and cancel events

import { 
  collection, 
  doc, 
  getDoc,
  getDocs,
  setDoc, 
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/constants/firebase';
import { 
  RELIABILITY_CONFIG, 
  calculateReliabilityScore,
  isExemptCancelCode,
  getCancelReason 
} from '@/constants/reliabilityConfig';

class ReliabilityService {
  constructor() {
    this.db = db;
  }

  /**
   * Check if driver is currently in cooldown
   * @param {string} driverId 
   * @returns {Promise<{isInCooldown: boolean, retrySec: number, reason: string}>}
   */
  async checkCooldown(driverId) {
    try {
      const cooldownRef = doc(this.db, 'driver_cooldowns', driverId);
      const cooldownDoc = await getDoc(cooldownRef);

      if (!cooldownDoc.exists()) {
        return { isInCooldown: false, retrySec: 0, reason: null };
      }

      const cooldownData = cooldownDoc.data();
      const now = new Date();
      const untilTs = cooldownData.until_ts?.toDate();

      if (untilTs && untilTs > now) {
        const retrySec = Math.ceil((untilTs - now) / 1000);
        return {
          isInCooldown: true,
          retrySec,
          reason: cooldownData.reason || 'Recent cancellation'
        };
      }

      // Cooldown expired, clean it up
      await this.removeCooldown(driverId);
      return { isInCooldown: false, retrySec: 0, reason: null };

    } catch (error) {
      console.error('❌ Error checking cooldown:', error);
      // Fail open - don't block driver on error
      return { isInCooldown: false, retrySec: 0, reason: null };
    }
  }

  /**
   * Check if driver can bid on a specific ride
   * @param {string} driverId 
   * @param {string} rideId 
   * @returns {Promise<{canBid: boolean, reason: string}>}
   */
  async checkBidEligibility(driverId, rideId) {
    try {
      // Check global cooldown first
      const cooldownCheck = await this.checkCooldown(driverId);
      if (cooldownCheck.isInCooldown) {
        return {
          canBid: false,
          reason: `Cooldown active for ${cooldownCheck.retrySec}s`,
          type: 'cooldown',
          retrySec: cooldownCheck.retrySec
        };
      }

      // Check ride-specific eligibility
      const eligibilityRef = doc(this.db, 'bid_eligibility', `${rideId}_${driverId}`);
      const eligibilityDoc = await getDoc(eligibilityRef);

      if (eligibilityDoc.exists()) {
        const eligibilityData = eligibilityDoc.data();
        
        if (eligibilityData.status === 'locked_after_cancel') {
          return {
            canBid: false,
            reason: 'You cannot re-bid on this ride after canceling',
            type: 'locked',
            retrySec: null
          };
        }
      }

      return { canBid: true, reason: null, type: null };

    } catch (error) {
      console.error('❌ Error checking bid eligibility:', error);
      // Fail open - don't block driver on error
      return { canBid: true, reason: null, type: null };
    }
  }

  /**
   * Lock driver from bidding on a specific ride
   * @param {string} driverId 
   * @param {string} rideId 
   */
  async lockBidEligibility(driverId, rideId) {
    try {
      const eligibilityRef = doc(this.db, 'bid_eligibility', `${rideId}_${driverId}`);
      await setDoc(eligibilityRef, {
        ride_id: rideId,
        driver_id: driverId,
        status: 'locked_after_cancel',
        note: 'Driver canceled after being awarded this ride',
        locked_at: serverTimestamp()
      });

      console.log('🔒 Locked bid eligibility:', { driverId, rideId });
    } catch (error) {
      console.error('❌ Error locking bid eligibility:', error);
    }
  }

  /**
   * Apply cooldown to driver after cancellation
   * @param {string} driverId 
   * @param {number} durationSec - Override default cooldown duration
   */
  async applyCooldown(driverId, durationSec = null) {
    try {
      const duration = durationSec || RELIABILITY_CONFIG.CANCEL_GLOBAL_COOLDOWN_SEC;
      const untilTs = Timestamp.fromDate(new Date(Date.now() + duration * 1000));

      const cooldownRef = doc(this.db, 'driver_cooldowns', driverId);
      await setDoc(cooldownRef, {
        driver_id: driverId,
        until_ts: untilTs,
        reason: 'Recent ride cancellation',
        created_at: serverTimestamp()
      });

      console.log('⏱️ Applied cooldown:', { driverId, durationSec: duration });
      return { success: true, untilTs };

    } catch (error) {
      console.error('❌ Error applying cooldown:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove cooldown for driver
   * @param {string} driverId 
   */
  async removeCooldown(driverId) {
    try {
      const cooldownRef = doc(this.db, 'driver_cooldowns', driverId);
      await setDoc(cooldownRef, {
        driver_id: driverId,
        until_ts: null,
        reason: null,
        removed_at: serverTimestamp()
      });

      console.log('✅ Removed cooldown:', { driverId });
    } catch (error) {
      console.error('❌ Error removing cooldown:', error);
    }
  }

  /**
   * Record a driver cancellation event
   * @param {string} rideId 
   * @param {string} driverId 
   * @param {string} reasonCode 
   * @param {object} metadata - Additional context
   */
  async recordCancelEvent(rideId, driverId, reasonCode, metadata = {}) {
    try {
      const cancelReason = getCancelReason(reasonCode);
      const isExempt = isExemptCancelCode(reasonCode);

      const eventData = {
        ride_id: rideId,
        driver_id: driverId,
        ts: serverTimestamp(),
        reason_code: reasonCode,
        reason_label: cancelReason?.label || 'Unknown',
        provisional: !isExempt, // Non-exempt cancels are provisional until validated
        validated: isExempt, // Exempt reasons are auto-validated
        exempted: isExempt,
        validation_note: isExempt ? 'Auto-exempted' : null,
        metadata
      };

      const eventsRef = collection(this.db, 'ride_driver_cancel_events');
      await addDoc(eventsRef, eventData);

      console.log('📝 Recorded cancel event:', { rideId, driverId, reasonCode, isExempt });
      return { success: true, isExempt };

    } catch (error) {
      console.error('❌ Error recording cancel event:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get driver's reliability score
   * @param {string} driverId 
   * @returns {Promise<{score: number, breakdown: object, hasData: boolean}>}
   */
  async getDriverReliabilityScore(driverId) {
    try {
      const scoreRef = doc(this.db, 'driver_reliability_scores', driverId);
      const scoreDoc = await getDoc(scoreRef);

      if (!scoreDoc.exists()) {
        return { 
          score: null, 
          breakdown: null, 
          hasData: false,
          message: 'No reliability data yet'
        };
      }

      const scoreData = scoreDoc.data();
      return {
        score: scoreData.score,
        breakdown: {
          acceptance_rate: scoreData.acceptance_rate,
          cancellation_rate: scoreData.cancellation_rate,
          ontime_arrival: scoreData.ontime_arrival,
          bid_honoring: scoreData.bid_honoring
        },
        total_rides: scoreData.total_rides,
        window_start: scoreData.window_start,
        window_end: scoreData.window_end,
        updated_at: scoreData.updated_at,
        hasData: true
      };

    } catch (error) {
      console.error('❌ Error getting reliability score:', error);
      return { score: null, breakdown: null, hasData: false, error: error.message };
    }
  }

  /**
   * Get driver's recent cancel events
   * @param {string} driverId 
   * @param {number} limitCount 
   */
  async getDriverCancelEvents(driverId, limitCount = 10) {
    try {
      const eventsRef = collection(this.db, 'ride_driver_cancel_events');
      const q = query(
        eventsRef,
        where('driver_id', '==', driverId),
        orderBy('ts', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, events };

    } catch (error) {
      console.error('❌ Error getting cancel events:', error);
      return { success: false, events: [], error: error.message };
    }
  }

  /**
   * Update driver metrics (called after ride events)
   * @param {string} driverId 
   * @param {object} updates - { awarded?, accepted?, cancels?, ontime_pickups?, honored_bids? }
   */
  async updateDriverMetrics(driverId, updates) {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const metricsRef = doc(this.db, 'driver_metrics_daily', `${driverId}_${today}`);
      const metricsDoc = await getDoc(metricsRef);

      const currentMetrics = metricsDoc.exists() ? metricsDoc.data() : {
        driver_id: driverId,
        date: today,
        awarded: 0,
        accepted: 0,
        cancels: 0,
        ontime_pickups: 0,
        honored_bids: 0
      };

      const updatedMetrics = {
        ...currentMetrics,
        awarded: currentMetrics.awarded + (updates.awarded || 0),
        accepted: currentMetrics.accepted + (updates.accepted || 0),
        cancels: currentMetrics.cancels + (updates.cancels || 0),
        ontime_pickups: currentMetrics.ontime_pickups + (updates.ontime_pickups || 0),
        honored_bids: currentMetrics.honored_bids + (updates.honored_bids || 0),
        updated_at: serverTimestamp()
      };

      await setDoc(metricsRef, updatedMetrics);
      console.log('📊 Updated driver metrics:', { driverId, updates });

      return { success: true };

    } catch (error) {
      console.error('❌ Error updating driver metrics:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate and update driver's reliability score
   * This would normally be done by Cloud Functions, but can be called manually
   * @param {string} driverId 
   */
  async calculateAndUpdateScore(driverId) {
    try {
      // Get metrics from last 90 days
      const metricsRef = collection(this.db, 'driver_metrics_daily');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - RELIABILITY_CONFIG.SCORE_WINDOW_DAYS);
      
      const q = query(
        metricsRef,
        where('driver_id', '==', driverId),
        where('date', '>=', cutoffDate.toISOString().split('T')[0])
      );

      const snapshot = await getDocs(q);
      
      // Aggregate metrics
      const aggregated = {
        awarded: 0,
        accepted: 0,
        driver_cancels: 0,
        ontime_pickups: 0,
        total_pickups: 0,
        honored_bids: 0
      };

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        aggregated.awarded += data.awarded || 0;
        aggregated.accepted += data.accepted || 0;
        aggregated.driver_cancels += data.cancels || 0;
        aggregated.ontime_pickups += data.ontime_pickups || 0;
        aggregated.total_pickups += (data.ontime_pickups || 0) + (data.cancels || 0);
        aggregated.honored_bids += data.honored_bids || 0;
      });

      // Calculate score
      const score = calculateReliabilityScore(aggregated);

      if (score === null) {
        console.log('⚠️ Not enough data to calculate reliability score');
        return { success: false, reason: 'insufficient_data' };
      }

      // Calculate component rates
      const acceptance_rate = aggregated.awarded > 0 
        ? (aggregated.accepted / aggregated.awarded * 100) 
        : 0;
      const cancellation_rate = aggregated.accepted > 0 
        ? (aggregated.driver_cancels / aggregated.accepted * 100) 
        : 0;
      const ontime_arrival = aggregated.total_pickups > 0 
        ? (aggregated.ontime_pickups / aggregated.total_pickups * 100) 
        : 0;
      const bid_honoring = aggregated.awarded > 0 
        ? (aggregated.honored_bids / aggregated.awarded * 100) 
        : 0;

      // Update score document
      const scoreRef = doc(this.db, 'driver_reliability_scores', driverId);
      await setDoc(scoreRef, {
        driver_id: driverId,
        score: score,
        acceptance_rate: Math.round(acceptance_rate),
        cancellation_rate: Math.round(cancellation_rate),
        ontime_arrival: Math.round(ontime_arrival),
        bid_honoring: Math.round(bid_honoring),
        total_rides: aggregated.accepted,
        window_start: cutoffDate,
        window_end: new Date(),
        updated_at: serverTimestamp()
      });

      console.log('✅ Updated reliability score:', { driverId, score });
      return { success: true, score };

    } catch (error) {
      console.error('❌ Error calculating score:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const reliabilityService = new ReliabilityService();
export default reliabilityService;

