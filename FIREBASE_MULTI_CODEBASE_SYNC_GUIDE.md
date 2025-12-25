# Firebase Multi-Codebase Sync Guide
*Consolidating Cloud Functions, Rules, and Indexes Across Multiple Projects*

## 🎯 Problem

You have **3 separate codebases** deploying to the **same Firebase project**:
1. **rydeIQDriver** - Driver app with video recording functions
2. **Codebase B** - Payment/Stripe integration functions  
3. **Codebase C** - Scheduling/notification functions

Each codebase has its own `functions/index.js`, but they all deploy to the same project, causing:
- ⚠️ Risk of accidentally deleting other codebase's functions
- ⚠️ No single source of truth
- ⚠️ Manual coordination needed between teams
- ⚠️ Deployment conflicts

## ✅ Solution

Create a **master functions file** that contains ALL functions, then share it across all 3 codebases.

---

## 🚀 Quick Start (5 Steps)

### Step 1: Extract Current Deployed Functions

```bash
cd rydeIQDriver  # Or whichever codebase you're in
node scripts/extract-all-firebase-functions.js
```

**Output:**
- `.firebase-sync/functions-template-2024-10-17.js` - Template with all function names
- `.firebase-sync/CONSOLIDATION_INSTRUCTIONS.md` - Detailed instructions
- `.firebase-sync/functions-list-2024-10-17.json` - JSON list of all functions

**What it does**: Discovers all 21 functions currently deployed to your Firebase project.

---

### Step 2: Gather Source Code from All Codebases

**From Codebase A (rydeIQDriver):**
```bash
cp functions/index.js .firebase-sync/codebase-a-functions.js
cp functions/package.json .firebase-sync/codebase-a-package.json
```

**From Codebase B (Payments - if accessible):**
```bash
cd /path/to/payments-codebase/functions
cp index.js /path/to/rydeIQDriver/.firebase-sync/codebase-b-functions.js
cp package.json /path/to/rydeIQDriver/.firebase-sync/codebase-b-package.json
```

**From Codebase C (Scheduling - if accessible):**
```bash
cd /path/to/scheduling-codebase/functions
cp index.js /path/to/rydeIQDriver/.firebase-sync/codebase-c-functions.js
cp package.json /path/to/rydeIQDriver/.firebase-sync/codebase-c-package.json
```

**If you don't have access to other codebases yet:**
- You can proceed with just the current codebase
- The merge script will work with whatever files are available
- You can add missing functions later

---

### Step 3: Merge All Functions

```bash
node scripts/merge-firebase-functions.js
```

**Output:**
- `functions/index-master-2024-10-17.js` - Consolidated functions file
- `functions/package-master-2024-10-17.json` - Merged dependencies

**What it does:**
- Combines all functions from all codebases
- Detects and reports duplicates
- Organizes by category (video, payment, notification, etc.)
- Merges package.json dependencies (uses highest version)

---

### Step 4: Review and Apply Master File

```bash
# Backup existing files
cp functions/index.js functions/index.backup.js
cp functions/package.json functions/package.backup.json

# Apply master files
cp functions/index-master-2024-10-17.js functions/index.js
cp functions/package-master-2024-10-17.json functions/package.json

# Install merged dependencies
cd functions
npm install
cd ..
```

---

### Step 5: Deploy and Sync All Codebases

```bash
# Deploy from current codebase
firebase deploy --only functions

# Copy master file to other codebases
# (Replace paths with your actual paths)
cp functions/index.js /path/to/codebase-b/functions/index.js
cp functions/package.json /path/to/codebase-b/functions/package.json

cp functions/index.js /path/to/codebase-c/functions/index.js
cp functions/package.json /path/to/codebase-c/functions/package.json
```

**Now all 3 codebases have identical functions files!** ✅

---

## 📊 What You Currently Have Deployed

Based on your deployment output, you have these functions:

### Video Recording (6 functions) - NEW
- `autoDeleteExpiredVideos`
- `certificationExpiryReminder`
- `updateRecordingStatistics`
- `cleanupOldVideoIncidents`
- `monitorStorageUsage`
- `onVideoIncidentCreated`

### Payment/Stripe (5 functions)
- `confirmPayment`
- `createDriverConnectAccount`
- `createPaymentIntent`
- `createRefund`
- `stripeWebhook`

### Driver Management (2 functions)
- `onDriverApplicationApproved`
- `getDriverEarnings`

### Ride Management (2 functions)
- `onDriverLocationUpdate`
- `onNewRideRequest`
- `onRideAccepted`

### Notifications (3 functions)
- `sendNotification`
- `sendRatingReminders`
- `sendScheduledRideReminders`

### Other (2 functions)
- `getPaymentMethods`
- `onEmergencyAlert`

**Total: 21 functions**

---

## 🔄 Ongoing Sync Workflow

Once you have the master file set up, here's how to keep codebases in sync:

### When Adding a New Function

```bash
# 1. Edit functions/index.js in ANY codebase
# Add your new function

# 2. Test locally
firebase emulators:start --only functions

# 3. Deploy
firebase deploy --only functions

# 4. Sync to other codebases
node scripts/sync-firebase-backend.js package
# Then copy to other codebases
```

### When Updating Firestore Rules

```bash
# 1. Edit firestore.rules
# 2. Deploy
firebase deploy --only firestore

# 3. Sync to other codebases
cp firestore.rules /path/to/other-codebases/
```

### When Adding Firestore Indexes

```bash
# 1. Edit firestore.indexes.json
# 2. Deploy
firebase deploy --only firestore:indexes

# 3. Sync to other codebases
cp firestore.indexes.json /path/to/other-codebases/
```

---

## 🛠️ Available Scripts

### 1. Extract Functions from Firebase
```bash
node scripts/extract-all-firebase-functions.js
```
**Use when**: You want to see what's currently deployed

### 2. Merge Functions from Multiple Codebases
```bash
node scripts/merge-firebase-functions.js
```
**Use when**: You want to consolidate functions into a master file

### 3. Sync Backend Files
```bash
node scripts/sync-firebase-backend.js [command]

Commands:
  info     - Show current backend files
  download - Download rules from Firebase
  compare  - Compare local vs deployed
  package  - Create sync package for other codebases
```
**Use when**: You want to share rules/indexes with other codebases

---

## 📁 File Organization

After running the scripts, your project will have:

```
rydeIQDriver/
├── functions/
│   ├── index.js                    ← Master functions (consolidated)
│   ├── index-master-2024-10-17.js  ← Timestamped backup
│   ├── package.json                ← Master dependencies
│   └── package-master-2024-10-17.json
│
├── .firebase-sync/                 ← Sync directory
│   ├── codebase-a-functions.js     ← Functions from codebase A
│   ├── codebase-b-functions.js     ← Functions from codebase B
│   ├── codebase-c-functions.js     ← Functions from codebase C
│   ├── functions-template-*.js     ← Generated templates
│   ├── functions-list-*.json       ← Function inventory
│   ├── CONSOLIDATION_INSTRUCTIONS.md
│   └── temp-sync/                  ← Package for sharing
│
├── firestore.rules                 ← Shared across all
├── firestore.indexes.json          ← Shared across all
├── storage.rules                   ← Shared across all
│
└── scripts/
    ├── extract-all-firebase-functions.js
    ├── merge-firebase-functions.js
    └── sync-firebase-backend.js
```

---

## ⚠️ Important Notes

### Avoiding Function Deletion

When deploying, if Firebase asks:
```
The following functions are found in your project but do not exist 
in your local source code. Would you like to proceed with deletion?
```

**Always answer "N" (No)** until you've consolidated all functions!

### Handling Duplicates

If the merge script finds duplicate function names:
1. Review which implementation to keep
2. Manually combine if both have unique logic
3. Update all codebases with the final version

### Environment Variables

Functions using environment variables need them set:
```bash
# View current config
firebase functions:config:get

# Set new variables
firebase functions:config:set stripe.secret="sk_..."
firebase functions:config:set sendgrid.key="SG...."

# After setting, redeploy
firebase deploy --only functions
```

---

## 🧪 Testing Before Deployment

Always test the merged functions locally:

```bash
# Start Firebase emulators
firebase emulators:start --only functions

# In another terminal, test a function
curl http://localhost:5001/ryde-9d4bf/us-central1/yourFunction
```

---

## 🔍 Troubleshooting

### Issue: "Functions not found after merge"

**Check:**
```bash
# Verify function is exported
grep "exports.functionName" functions/index.js

# Check for syntax errors
cd functions
npm run lint
```

### Issue: "Dependency conflicts"

**Solution:**
```bash
cd functions
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Can't access other codebases"

**Solution:**
1. Use the extract script to see what's deployed
2. Work with current codebase only for now
3. Ask other teams to share their functions/index.js
4. Run merge again when you have all files

---

## 📞 Support & Resources

- **Firebase Console**: https://console.firebase.google.com/project/ryde-9d4bf
- **Cloud Functions Logs**: `firebase functions:log`
- **Cloud Scheduler**: https://console.cloud.google.com/cloudscheduler
- **Firestore Rules**: https://console.firebase.google.com/project/ryde-9d4bf/firestore/rules

---

## ✅ Verification Checklist

After consolidation:
- [ ] All 21+ functions present in master file
- [ ] No duplicate function names
- [ ] All dependencies in package.json
- [ ] Local emulator testing successful
- [ ] Deployed to Firebase without errors
- [ ] All 3 codebases updated with master files
- [ ] Team members notified of changes
- [ ] Documentation updated

---

## 🎉 Success!

Once you've completed these steps:
- ✅ All functions consolidated into one master file
- ✅ All codebases have identical functions
- ✅ No more accidental deletions during deployment
- ✅ Single source of truth for backend logic
- ✅ Easy to sync changes across projects

---

**Generated**: October 17, 2024  
**Project**: ryde-9d4bf  
**Total Functions**: 21  
**Version**: 1.0

