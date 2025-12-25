/**
 * Cloud Functions for AnyRyde Driver App
 * Video Recording Feature
 * 
 * Functions:
 * 1. autoDeleteExpiredVideos - Delete videos after 72h retention
 * 2. certificationExpiryReminder - Remind drivers when certification expires
 * 3. updateRecordingStatistics - Update driver recording stats
 * 4. generateVideoThumbnails - Generate thumbnails for uploaded videos (future)
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

// ============================================
// 1. Auto-Delete Expired Videos
// Runs daily at 2 AM UTC
// ============================================

exports.autoDeleteExpiredVideos = functions
  .runWith({ timeoutSeconds: 540, memory: '1GB' })
  .pubsub
  .schedule('0 2 * * *')
  .timeZone('America/Los_Angeles')
  .onRun(async (context) => {
    console.log('🗑️  Starting auto-delete expired videos job...');
    
    try {
      const now = admin.firestore.Timestamp.now();
      
      // Find rides with expired video retention that haven't been deleted
      const expiredQuery = db.collection('rideRequests')
        .where('videoLifecycle.autoDeleteScheduledFor', '<=', now)
        .where('videoLifecycle.retentionExtended', '==', false)
        .where('videoLifecycle.markedForDeletion', '==', false)
        .limit(500); // Process in batches
      
      const snapshot = await expiredQuery.get();
      
      if (snapshot.empty) {
        console.log('✅ No expired videos to delete');
        return null;
      }
      
      console.log(`📊 Found ${snapshot.size} video(s) to mark for deletion`);
      
      const batch = db.batch();
      let count = 0;
      
      snapshot.forEach(doc => {
        batch.update(doc.ref, {
          'videoLifecycle.markedForDeletion': true,
          'videoLifecycle.deletedAt': now,
          'videoLifecycle.deletionMethod': 'auto',
          'videoLifecycle.deletionConfirmedBy': 'system_scheduled_job',
          'updatedAt': admin.firestore.FieldValue.serverTimestamp()
        });
        count++;
      });
      
      await batch.commit();
      
      console.log(`✅ Successfully marked ${count} video(s) for deletion`);
      
      // Log analytics
      await db.collection('analyticsEvents').add({
        eventType: 'video_auto_deletion',
        eventData: {
          videosDeleted: count,
          deletedAt: now,
          reason: 'retention_expired'
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true, deletedCount: count };
      
    } catch (error) {
      console.error('❌ Error in autoDeleteExpiredVideos:', error);
      
      // Log error to analytics
      await db.collection('analyticsEvents').add({
        eventType: 'video_auto_deletion_error',
        eventData: {
          error: error.message,
          timestamp: admin.firestore.Timestamp.now()
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: false, error: error.message };
    }
  });

// ============================================
// 2. Certification Expiry Reminder
// Runs weekly on Sundays at 9 AM
// ============================================

exports.certificationExpiryReminder = functions
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .pubsub
  .schedule('0 9 * * 0')
  .timeZone('America/Los_Angeles')
  .onRun(async (context) => {
    console.log('📢 Starting certification expiry reminder job...');
    
    try {
      const thirtyDaysFromNow = admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      );
      
      // Find drivers whose certification expires in 30 days
      const expiringQuery = db.collection('driverApplications')
        .where('videoRecordingCapability.certificationExpiresAt', '<=', thirtyDaysFromNow)
        .where('videoRecordingCapability.certificationStatus', '==', 'certified')
        .where('videoRecordingCapability.recertificationRequired', '==', false);
      
      const snapshot = await expiringQuery.get();
      
      if (snapshot.empty) {
        console.log('✅ No certifications expiring soon');
        return null;
      }
      
      console.log(`📊 Found ${snapshot.size} driver(s) with expiring certifications`);
      
      const batch = db.batch();
      const notificationPromises = [];
      let count = 0;
      
      snapshot.forEach(doc => {
        const driverId = doc.id;
        const driverData = doc.data();
        const expiresAt = driverData.videoRecordingCapability.certificationExpiresAt;
        const daysUntilExpiry = Math.ceil((expiresAt.toDate() - new Date()) / (24 * 60 * 60 * 1000));
        
        // Mark as requiring recertification
        batch.update(doc.ref, {
          'videoRecordingCapability.recertificationRequired': true,
          'updatedAt': admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Create notification
        const notificationPromise = db.collection('notifications').add({
          userId: driverId,
          type: 'certification_expiry',
          title: '🎥 Video Recording Certification Expiring',
          message: `Your video recording certification expires in ${daysUntilExpiry} days. Please complete recertification to continue accepting recorded rides.`,
          priority: 'high',
          actionRequired: true,
          actionUrl: '/settings/video-recording',
          data: {
            expiresAt: expiresAt,
            daysRemaining: daysUntilExpiry
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          read: false,
          sentVia: 'scheduled_function'
        });
        
        notificationPromises.push(notificationPromise);
        count++;
      });
      
      await batch.commit();
      await Promise.all(notificationPromises);
      
      console.log(`✅ Successfully sent ${count} certification expiry reminder(s)`);
      
      // Log analytics
      await db.collection('analyticsEvents').add({
        eventType: 'certification_expiry_reminders_sent',
        eventData: {
          remindersSent: count,
          sentAt: admin.firestore.Timestamp.now()
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true, remindersSent: count };
      
    } catch (error) {
      console.error('❌ Error in certificationExpiryReminder:', error);
      return { success: false, error: error.message };
    }
  });

// ============================================
// 3. Update Recording Statistics
// Triggered when a ride with recording completes
// ============================================

exports.updateRecordingStatistics = functions.firestore
  .document('rides/{rideId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Check if ride just completed
    const wasCompleted = before.status !== 'completed' && after.status === 'completed';
    
    if (!wasCompleted) {
      return null; // Not interested in this update
    }
    
    // Check if ride had recording
    const hadRecording = after.activeRecording?.isRecording === true || 
                        after.recordingStatus?.durationSeconds > 0;
    
    if (!hadRecording) {
      return null; // No recording, nothing to update
    }
    
    try {
      const driverId = after.driverId;
      const durationSeconds = after.recordingStatus?.durationSeconds || 0;
      const durationHours = durationSeconds / 3600;
      const estimatedSizeGB = after.recordingStatus?.videoMetadata?.estimatedFileSizeMB / 1024 || 0;
      const incidentFlagged = after.activeRecording?.incidentFlagged || false;
      
      // Update driver's recording statistics
      const driverRef = db.collection('driverApplications').doc(driverId);
      
      await driverRef.update({
        'videoRecordingCapability.totalRecordedRides': admin.firestore.FieldValue.increment(1),
        'videoRecordingCapability.totalRecordingHours': admin.firestore.FieldValue.increment(durationHours),
        'videoRecordingCapability.totalRecordingSizeGB': admin.firestore.FieldValue.increment(estimatedSizeGB),
        'videoRecordingCapability.lastRecordingDate': admin.firestore.Timestamp.now(),
        'updatedAt': admin.firestore.FieldValue.serverTimestamp()
      });
      
      // If incident was flagged, increment incident count
      if (incidentFlagged) {
        await driverRef.update({
          'videoRecordingCapability.incidentsReported': admin.firestore.FieldValue.increment(1)
        });
      }
      
      console.log(`✅ Updated recording stats for driver ${driverId}`);
      
      return { success: true, driverId };
      
    } catch (error) {
      console.error('❌ Error updating recording statistics:', error);
      return { success: false, error: error.message };
    }
  });

// ============================================
// 4. Clean Up Old Video Incidents
// Runs monthly on the 1st at 3 AM
// Deletes closed incidents older than 90 days
// ============================================

exports.cleanupOldVideoIncidents = functions
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .pubsub
  .schedule('0 3 1 * *')
  .timeZone('America/Los_Angeles')
  .onRun(async (context) => {
    console.log('🧹 Starting cleanup of old video incidents...');
    
    try {
      const ninetyDaysAgo = admin.firestore.Timestamp.fromDate(
        new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      );
      
      // Find closed incidents older than 90 days
      const oldIncidentsQuery = db.collection('videoIncidents')
        .where('reviewStatus', '==', 'closed')
        .where('closedAt', '<=', ninetyDaysAgo)
        .limit(100); // Process in batches
      
      const snapshot = await oldIncidentsQuery.get();
      
      if (snapshot.empty) {
        console.log('✅ No old incidents to clean up');
        return null;
      }
      
      console.log(`📊 Found ${snapshot.size} old incident(s) to delete`);
      
      const batch = db.batch();
      let count = 0;
      
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
        count++;
      });
      
      await batch.commit();
      
      console.log(`✅ Successfully deleted ${count} old incident(s)`);
      
      return { success: true, deletedCount: count };
      
    } catch (error) {
      console.error('❌ Error in cleanupOldVideoIncidents:', error);
      return { success: false, error: error.message };
    }
  });

// ============================================
// 5. Monitor Storage Usage
// Runs daily to check driver storage capacity
// ============================================

exports.monitorStorageUsage = functions
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .pubsub
  .schedule('0 4 * * *')
  .timeZone('America/Los_Angeles')
  .onRun(async (context) => {
    console.log('📊 Starting storage usage monitoring...');
    
    try {
      // Find drivers currently recording or with high storage usage
      const driversQuery = db.collection('driverApplications')
        .where('videoRecordingCapability.hasEquipment', '==', true)
        .where('videoRecordingCapability.certificationStatus', '==', 'certified');
      
      const snapshot = await driversQuery.get();
      
      if (snapshot.empty) {
        console.log('✅ No video-capable drivers to monitor');
        return null;
      }
      
      console.log(`📊 Monitoring ${snapshot.size} video-capable driver(s)`);
      
      const warningThreshold = 102; // 80% of 128GB = ~102GB
      const criticalThreshold = 115; // 90% of 128GB = ~115GB
      
      let warningsCount = 0;
      const notificationPromises = [];
      
      snapshot.forEach(doc => {
        const driverId = doc.id;
        const driverData = doc.data();
        const totalSizeGB = driverData.videoRecordingCapability?.totalRecordingSizeGB || 0;
        const storageCapacityGB = driverData.videoRecordingCapability?.cameraInfo?.storageCapacityGB || 128;
        
        const usagePercent = (totalSizeGB / storageCapacityGB) * 100;
        
        if (usagePercent >= criticalThreshold) {
          // Critical storage warning
          notificationPromises.push(
            db.collection('notifications').add({
              userId: driverId,
              type: 'storage_critical',
              title: '🚨 Critical: Camera Storage Almost Full',
              message: `Your camera storage is ${Math.round(usagePercent)}% full (${Math.round(totalSizeGB)}GB / ${storageCapacityGB}GB). Please free up space immediately or risk recording failures.`,
              priority: 'critical',
              actionRequired: true,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              read: false
            })
          );
          warningsCount++;
        } else if (usagePercent >= warningThreshold) {
          // Warning storage alert
          notificationPromises.push(
            db.collection('notifications').add({
              userId: driverId,
              type: 'storage_warning',
              title: '⚠️ Camera Storage Running Low',
              message: `Your camera storage is ${Math.round(usagePercent)}% full (${Math.round(totalSizeGB)}GB / ${storageCapacityGB}GB). Consider freeing up space soon.`,
              priority: 'medium',
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              read: false
            })
          );
          warningsCount++;
        }
      });
      
      await Promise.all(notificationPromises);
      
      if (warningsCount > 0) {
        console.log(`⚠️  Sent ${warningsCount} storage warning(s)`);
      } else {
        console.log('✅ All drivers have adequate storage');
      }
      
      return { success: true, warningsSent: warningsCount };
      
    } catch (error) {
      console.error('❌ Error in monitorStorageUsage:', error);
      return { success: false, error: error.message };
    }
  });

// ============================================
// 6. Video Incident Created Notification
// Triggers when a new video incident is created
// ============================================

exports.onVideoIncidentCreated = functions.firestore
  .document('videoIncidents/{incidentId}')
  .onCreate(async (snap, context) => {
    const incident = snap.data();
    const incidentId = context.params.incidentId;
    
    console.log(`🚨 New video incident created: ${incidentId}`);
    
    try {
      // Notify admins/support
      const adminsSnapshot = await db.collection('users')
        .where('role', 'in', ['admin', 'super_admin', 'support'])
        .get();
      
      const notificationPromises = adminsSnapshot.docs.map(adminDoc => {
        return db.collection('notifications').add({
          userId: adminDoc.id,
          type: 'video_incident_created',
          title: `🚨 New Video Incident - ${incident.incidentType}`,
          message: `Driver ${incident.driverId} reported a ${incident.incidentType} incident. Severity: ${incident.incidentSeverity}`,
          priority: incident.incidentSeverity === 'critical' ? 'critical' : 'high',
          actionRequired: true,
          actionUrl: `/admin/video-incidents/${incidentId}`,
          data: {
            incidentId,
            rideId: incident.rideId,
            incidentType: incident.incidentType,
            severity: incident.incidentSeverity
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          read: false
        });
      });
      
      await Promise.all(notificationPromises);
      
      console.log(`✅ Notified ${adminsSnapshot.size} admin(s) about incident`);
      
      return { success: true, notified: adminsSnapshot.size };
      
    } catch (error) {
      console.error('❌ Error in onVideoIncidentCreated:', error);
      return { success: false, error: error.message };
    }
  });

// ============================================
// Export all functions
// ============================================

