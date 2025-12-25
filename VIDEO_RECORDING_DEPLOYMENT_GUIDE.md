# Video Recording Feature - Deployment Guide
*Complete Backend Deployment Instructions*

## 📋 Overview

This guide walks you through deploying the complete video recording feature backend infrastructure to Firebase.

**Estimated Time**: 30-45 minutes  
**Difficulty**: Intermediate  
**Prerequisites**: Firebase CLI installed, admin access to Firebase project

---

## ✅ Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] Logged into Firebase (`firebase login`)
- [ ] Selected correct Firebase project (`firebase use <project-id>`)
- [ ] Service account key in `scripts/firebase-service-account.json`
- [ ] Node.js 18+ installed
- [ ] Reviewed all configuration files

---

## 🚀 Step-by-Step Deployment

### Phase 1: Firestore Security Rules & Indexes

#### Step 1.1: Deploy Firestore Rules

```bash
# From project root directory
cd /path/to/rydeIQDriver

# Test rules in emulator first (optional but recommended)
firebase emulators:start --only firestore

# In another terminal, verify rules
firebase emulators:exec "npm test"

# Deploy rules to production
firebase deploy --only firestore:rules
```

**Expected Output:**
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/YOUR_PROJECT/overview
```

**Verify Deployment:**
```bash
# Check deployed rules
firebase firestore:rules:get

# Should show updated rules with video recording sections
```

#### Step 1.2: Deploy Firestore Indexes

```bash
# Deploy composite indexes
firebase deploy --only firestore:indexes
```

**Important Notes:**
- Index creation can take **5-30 minutes** depending on existing data
- Monitor progress: https://console.firebase.google.com/project/YOUR_PROJECT/firestore/indexes
- Queries will fail until indexes are built

**Verify Index Status:**
```bash
# Check index status in Firebase Console
# Firestore → Indexes tab
# All indexes should show "Enabled" status
```

---

### Phase 2: Firebase Storage Rules

#### Step 2.1: Deploy Storage Rules

```bash
# Deploy storage security rules
firebase deploy --only storage
```

**Expected Output:**
```
=== Deploying to 'your-project-id'...

i  storage: uploading rules storage.rules...
✔  storage: released rules storage.rules to firebase.storage/YOUR_BUCKET

✔  Deploy complete!
```

**Verify Deployment:**
1. Go to Firebase Console → Storage → Rules tab
2. Should see new rules for:
   - `/videoIncidents/{rideId}/{fileName}`
   - `/driverVerification/{driverId}/{fileName}`
   - `/privacyNoticePhotos/{driverId}/{fileName}`

---

### Phase 3: Data Migration

#### Step 3.1: Backup Existing Data

```bash
# Export current driver data (safety first!)
gcloud firestore export gs://YOUR_BACKUP_BUCKET/backups/pre-video-migration

# OR manually backup important collections
node scripts/backup-drivers.js  # (create if needed)
```

#### Step 3.2: Run Migration Script

```bash
# Navigate to scripts directory
cd scripts

# Install dependencies (if not already installed)
npm install firebase-admin

# Run migration
node migrate-video-recording-capability.js
```

**Expected Output:**
```
╔════════════════════════════════════════════════════════════╗
║   Video Recording Capability Migration Script             ║
║   AnyRyde Driver App                                       ║
╚════════════════════════════════════════════════════════════╝

🚀 Starting video recording capability migration...

📊 Found 47 driver(s) in database

✅ Queued update for pilot_driver_1 (John Smith)
✅ Queued update for driver_abc123 (Sarah Johnson)
...

⏳ Committing batch of 47 updates...
✓ Batch committed successfully

==========================================================
📈 Migration Summary:
==========================================================
✅ Updated: 47 driver(s)
⏭️  Skipped: 0 driver(s)
❌ Errors:  0 driver(s)

✅ Migration complete!
```

**Troubleshooting Migration:**

| Error | Solution |
|-------|----------|
| `Service account key not found` | Copy `serviceAccountKey.json` to `scripts/` folder |
| `Permission denied` | Ensure service account has `Cloud Datastore User` role |
| `Batch limit exceeded` | Script automatically handles batching |
| `Some updates failed` | Check error output, re-run script (skips existing) |

#### Step 3.3: Verify Migration

```bash
# Still in scripts directory
node migrate-video-recording-capability.js

# Should show:
# ⏭️  Skipping driver_xyz - already has videoRecordingCapability
```

**Manual Verification in Firebase Console:**
1. Go to Firestore → driverApplications
2. Open any driver document
3. Should see `videoRecordingCapability` field with all subfields
4. Check structure matches schema

---

### Phase 4: Cloud Functions Deployment

#### Step 4.1: Install Cloud Functions Dependencies

```bash
# Navigate to functions directory
cd ../functions

# Install dependencies
npm install

# Check for vulnerabilities
npm audit
```

#### Step 4.2: Deploy Cloud Functions

```bash
# Deploy all functions
firebase deploy --only functions

# OR deploy specific functions individually
firebase deploy --only functions:autoDeleteExpiredVideos
firebase deploy --only functions:certificationExpiryReminder
firebase deploy --only functions:updateRecordingStatistics
firebase deploy --only functions:cleanupOldVideoIncidents
firebase deploy --only functions:monitorStorageUsage
firebase deploy --only functions:onVideoIncidentCreated
```

**Expected Output:**
```
=== Deploying to 'your-project-id'...

i  functions: preparing functions directory for uploading...
i  functions: packaged functions (234.56 KB) for uploading
✔  functions: functions folder uploaded successfully

i  functions: creating Node.js 18 function autoDeleteExpiredVideos...
✔  functions[autoDeleteExpiredVideos]: Successful create operation.
✔  functions[certificationExpiryReminder]: Successful create operation.
✔  functions[updateRecordingStatistics]: Successful create operation.
...

✔  Deploy complete!
```

**Function Schedule Verification:**
```bash
# Check scheduled functions
firebase functions:log --only autoDeleteExpiredVideos

# View function logs
firebase functions:log --limit 50
```

#### Step 4.3: Configure Function Environment (if needed)

```bash
# Set environment variables
firebase functions:config:set video.retention_days="3"
firebase functions:config:set video.max_file_size_mb="500"

# View current config
firebase functions:config:get

# Re-deploy after config changes
firebase deploy --only functions
```

---

### Phase 5: Test Data Creation (Optional - Pilot Program)

#### Step 5.1: Create Pilot Test Data

```bash
# Navigate back to scripts
cd ../scripts

# Create pilot program test data
node create-video-pilot-test-data.js
```

**Expected Output:**
```
╔════════════════════════════════════════════════════════════╗
║   Video Recording Pilot Program Test Data                 ║
╚════════════════════════════════════════════════════════════╝

👥 Creating 10 pilot drivers...
✅ Created driver: John Smith (pilot_driver_1)
   Status: certified
   Equipment: Vantrue N2 Pro
...

📊 Test Data Summary:
==========================================================
✅ Pilot Drivers Created:    10
   - Certified:              7
   - Pending:                2
   - Not Started:            1
   - Online:                 7

✅ Ride Requests Created:    5
   - With video requested:   3
   - Video required:         1

✅ Video Incidents Created:  1
```

---

## 🧪 Post-Deployment Testing

### Test 1: Query Video-Capable Drivers

```javascript
// Test in Firebase Console or Node script
const db = admin.firestore();

const videoCapableDrivers = await db.collection('driverApplications')
  .where('videoRecordingCapability.hasEquipment', '==', true)
  .where('videoRecordingCapability.certificationStatus', '==', 'certified')
  .get();

console.log(`Found ${videoCapableDrivers.size} video-capable drivers`);
```

**Expected Result:** Should return drivers without index errors

### Test 2: Security Rules

```javascript
// Test driver can update own video capability
firebase.firestore().collection('driverApplications').doc(currentDriverId).update({
  'videoRecordingCapability.autoAcceptRecordingRequests': true
});
// Should succeed ✅

// Test driver cannot update another driver's video capability
firebase.firestore().collection('driverApplications').doc(otherDriverId).update({
  'videoRecordingCapability.certificationStatus': 'certified'
});
// Should fail with permission denied ✅

// Test admin can verify equipment
// (As admin user)
firebase.firestore().collection('driverApplications').doc(driverId).update({
  'videoRecordingCapability.equipmentVerified': true,
  'videoRecordingCapability.equipmentVerifiedBy': 'admin_user_id'
});
// Should succeed ✅
```

### Test 3: Cloud Functions

```bash
# Manually trigger scheduled functions for testing
firebase functions:shell

# In the shell:
autoDeleteExpiredVideos()
certificationExpiryReminder()

# Check logs
firebase functions:log --limit 20
```

### Test 4: Storage Upload

```javascript
// Test video upload (use Firebase Console or client SDK)
const storageRef = firebase.storage().ref();
const videoRef = storageRef.child('videoIncidents/test_ride_123/test_video.mp4');

// Upload should succeed for ride participant
await videoRef.put(videoFile);
// ✅ Success

// Upload should fail for non-participant
// ❌ Permission denied
```

---

## 🔍 Monitoring & Observability

### Set Up Monitoring

1. **Firestore Monitoring**
   ```
   Console → Firestore → Usage tab
   - Monitor read/write operations
   - Check index usage
   - Watch for security rule violations
   ```

2. **Storage Monitoring**
   ```
   Console → Storage → Usage tab
   - Monitor storage usage
   - Check bandwidth costs
   - Track file uploads
   ```

3. **Functions Monitoring**
   ```
   Console → Functions → Logs
   - Monitor function executions
   - Check for errors
   - View execution times
   ```

### Set Up Alerts

```bash
# Create alert for function failures
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_CHANNEL_ID \
  --display-name="Video Functions Error Alert" \
  --condition-display-name="Function Error Rate" \
  --condition-filter='resource.type="cloud_function"' \
  --condition-threshold-value=5
```

---

## 📊 Expected Costs (Estimated)

### Firebase Costs per Month

| Service | Usage | Cost |
|---------|-------|------|
| **Firestore** | | |
| - Document reads | ~10K/day | $0.36 |
| - Document writes | ~2K/day | $1.08 |
| - Document deletes | ~500/day | $0.15 |
| - Storage (1GB) | Metadata only | $0.18 |
| **Storage** | | |
| - Storage (50GB avg) | Video files | $1.30 |
| - Downloads (10GB) | Incident reviews | $0.12 |
| **Functions** | | |
| - Invocations (30K) | Scheduled + triggers | $0.00 (free tier) |
| - GB-seconds (5K) | Execution time | $0.00 (free tier) |
| **Total** | | **~$3-5/month** |

*Costs scale linearly with usage*

---

## 🐛 Troubleshooting

### Common Issues

#### Issue 1: Index Not Found Error

**Error:**
```
The query requires an index. You can create it here:
https://console.firebase.google.com/...
```

**Solution:**
```bash
# Re-deploy indexes
firebase deploy --only firestore:indexes

# Wait 15-30 minutes for index to build
# Check status in Console
```

#### Issue 2: Security Rules Blocking Legitimate Requests

**Error:**
```
FirebaseError: Missing or insufficient permissions
```

**Solution:**
1. Check Firestore rules tab for denied requests
2. Verify user authentication status
3. Check if user ID matches document owner
4. Test rules in Firebase Emulator locally

#### Issue 3: Migration Script Fails

**Error:**
```
Error: Could not reach Cloud Firestore backend
```

**Solution:**
```bash
# Check service account permissions
gcloud projects get-iam-policy YOUR_PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:*"

# Ensure service account has:
# - Cloud Datastore User
# - Firebase Admin SDK Administrator Service Agent
```

#### Issue 4: Functions Not Executing

**Check:**
```bash
# View function logs
firebase functions:log --only autoDeleteExpiredVideos

# Check function status
firebase functions:list

# Verify schedule is correct
gcloud scheduler jobs list
```

---

## ✅ Deployment Verification Checklist

After deployment, verify:

### Firestore
- [ ] Rules deployed without errors
- [ ] All indexes show "Enabled" status
- [ ] Test query for video-capable drivers succeeds
- [ ] Migration script completed successfully
- [ ] All drivers have `videoRecordingCapability` field

### Storage
- [ ] Storage rules deployed
- [ ] Test upload succeeds for authorized user
- [ ] Test upload fails for unauthorized user
- [ ] Buckets exist: `videoIncidents`, `driverVerification`

### Cloud Functions
- [ ] All 6 functions deployed successfully
- [ ] Functions appear in Firebase Console → Functions
- [ ] Scheduled functions show in Cloud Scheduler
- [ ] Test function execution succeeds
- [ ] Function logs show no errors

### Monitoring
- [ ] Set up alerts for function failures
- [ ] Monitor Firestore usage daily for first week
- [ ] Track Storage costs
- [ ] Review security rule violations (should be 0)

---

## 🎯 Next Steps After Deployment

1. **Test in Driver App**
   - Build and run driver app with new backend
   - Test video capability setup flow
   - Test ride matching with video requests
   - Test incident reporting

2. **Pilot Program Launch**
   - Onboard 5-10 pilot drivers
   - Provide video equipment
   - Monitor closely for first 2 weeks
   - Collect feedback

3. **Documentation**
   - Update API documentation
   - Create driver onboarding guides
   - Write support articles
   - Document incident review process

4. **Scaling Preparation**
   - Set up budget alerts
   - Configure auto-scaling (if needed)
   - Plan for increased storage needs
   - Review security rules performance

---

## 📞 Support & Resources

### Firebase Resources
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Cloud Functions Docs](https://firebase.google.com/docs/functions)
- [Firebase Storage Docs](https://firebase.google.com/docs/storage)

### AnyRyde Internal Resources
- Video Recording Implementation Plan: `VIDEO_RECORDING_FEATURE_IMPLEMENTATION_PLAN.md`
- Firebase Schema Documentation: `VIDEO_RECORDING_FIREBASE_SCHEMA.md`
- Driver Video Kit Guide: `AnyRyde_Driver_Video_Kit.md`

### Troubleshooting
- Firebase Status: https://status.firebase.google.com/
- Community Support: https://stackoverflow.com/questions/tagged/firebase
- Firebase Support: https://firebase.google.com/support

---

## 🔄 Rollback Procedure (Emergency)

If deployment causes critical issues:

```bash
# 1. Rollback Firestore rules
firebase firestore:rules:release PREVIOUS_VERSION_ID

# 2. Rollback Storage rules (via Console)
# Firebase Console → Storage → Rules → "Show previous versions"

# 3. Delete Cloud Functions
firebase functions:delete autoDeleteExpiredVideos
firebase functions:delete certificationExpiryReminder
firebase functions:delete updateRecordingStatistics
firebase functions:delete cleanupOldVideoIncidents
firebase functions:delete monitorStorageUsage
firebase functions:delete onVideoIncidentCreated

# 4. Restore Firestore data (if migration caused issues)
gcloud firestore import gs://YOUR_BACKUP_BUCKET/backups/pre-video-migration
```

**Then:**
1. Investigate root cause
2. Fix issues locally
3. Test thoroughly in emulator
4. Re-deploy when ready

---

## 📝 Post-Deployment Notes

### Maintenance Schedule

| Task | Frequency | Command |
|------|-----------|---------|
| Review function logs | Daily (first week) | `firebase functions:log` |
| Check storage usage | Weekly | Firebase Console → Storage |
| Review incidents | Daily | Firebase Console → Firestore → videoIncidents |
| Update indexes (if needed) | As queries evolve | `firebase deploy --only firestore:indexes` |
| Backup data | Weekly | `gcloud firestore export ...` |

### Performance Optimization

After 1-2 weeks of production use:
1. Review query performance in Console
2. Add indexes for slow queries
3. Optimize Cloud Function execution time
4. Adjust retention periods based on actual usage
5. Monitor costs and adjust strategy

---

**Deployment Date**: _________________  
**Deployed By**: _________________  
**Production URL**: _________________  
**Version**: 1.0.0

---

✅ **Congratulations! Your video recording backend is now deployed.**

For UI implementation, see `VIDEO_RECORDING_FEATURE_IMPLEMENTATION_PLAN.md` Phase 2.

**Questions?** Contact the development team or refer to internal documentation.

