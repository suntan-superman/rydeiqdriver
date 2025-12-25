# AnyRyde Scripts Documentation

## 🔄 Multi-Codebase Sync Scripts (NEW - Video Recording Feature)

### Quick Start: Master Sync Tool
**`master-sync.js`** - Interactive menu-driven synchronization tool
```bash
node scripts/master-sync.js
```

One-stop solution with interactive menu for:
- 📊 Extracting deployed functions from Firebase
- 🔀 Merging functions from multiple codebases  
- 📦 Creating sync packages for distribution
- 🚀 Running complete automated workflow

### Individual Sync Scripts

#### 1. Extract All Firebase Functions
**`extract-all-firebase-functions.js`**
```bash
node scripts/extract-all-firebase-functions.js
```
Downloads and catalogs all Cloud Functions currently deployed to Firebase.
Creates template and function inventory.

#### 2. Merge Firebase Functions
**`merge-firebase-functions.js`**
```bash
node scripts/merge-firebase-functions.js
```
Consolidates functions from multiple codebases into a single master file.
Handles duplicates and organizes by category.

#### 3. Sync Firebase Backend
**`sync-firebase-backend.js`**
```bash
node scripts/sync-firebase-backend.js [command]

Commands:
  info     - Show current backend files
  download - Download rules from Firebase
  compare  - Compare local vs deployed
  package  - Create sync package
```
Syncs Firestore rules, indexes, and storage rules across codebases.

#### 4. Migrate Video Recording Capability
**`migrate-video-recording-capability.js`**
```bash
node scripts/migrate-video-recording-capability.js
```
Adds videoRecordingCapability field to all existing drivers.
Safe to re-run (skips already migrated drivers).

#### 5. Create Pilot Test Data
**`create-video-pilot-test-data.js`**
```bash
node scripts/create-video-pilot-test-data.js
```
Creates test data for video recording pilot program:
- 10 pilot drivers with video equipment
- 5 sample ride requests
- 1 sample video incident

### Complete Documentation
📖 **See**: `FIREBASE_MULTI_CODEBASE_SYNC_GUIDE.md` in project root for complete workflow guide.

---

## 🧹 Ride Cleanup Scripts

These scripts help you bulk delete test rides from your Firebase collections during development and testing.

## 🚀 Quick Start

### Option 1: Simple Script (Recommended for beginners)

1. **Edit the script**:
   ```bash
   # Open the simple script
   code scripts/cleanup-rides-simple.js
   ```

2. **Update the configuration**:
   ```javascript
   // Update these dates for your cleanup range
   const startDate = new Date('2025-01-01'); // Change this
   const endDate = new Date('2025-01-31');   // Change this
   
   // Update Firebase config with your project details
   const firebaseConfig = {
     apiKey: "your-api-key-here",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     // ... etc
   };
   
   // Uncomment collections you want to clean
   const collections = [
     'rideRequests',
     // 'medicalRideRequests',  // Uncomment to include
     // 'scheduledRides'        // Uncomment to include
   ];
   ```

3. **Run the script**:
   ```bash
   # Using npm script
   npm run cleanup:rides
   
   # Or directly
   node scripts/cleanup-rides-simple.js
   ```

### Option 2: Advanced Script (Full featured)

1. **Run with help**:
   ```bash
   npm run cleanup:rides:help
   ```

2. **Dry run first** (recommended):
   ```bash
   node scripts/cleanup-rides.js --start-date=2025-01-01 --end-date=2025-01-31 --dry-run
   ```

3. **Delete actual rides**:
   ```bash
   node scripts/cleanup-rides.js --start-date=2025-01-01 --end-date=2025-01-31
   ```

4. **Include all collections**:
   ```bash
   node scripts/cleanup-rides.js --start-date=2025-01-01 --end-date=2025-01-31 --include-medical --include-scheduled
   ```

## 📋 Available Collections

- `rideRequests` - Regular ride requests
- `medicalRideRequests` - Medical transportation requests  
- `scheduledRides` - Scheduled/future rides

## ⚠️ Safety Features

- **Dry run mode**: Test what will be deleted without actually deleting
- **Date range validation**: Ensures start date is before end date
- **Batch limits**: Prevents memory issues with large datasets
- **Error handling**: Continues processing even if some deletions fail
- **Progress feedback**: Shows what's being deleted in real-time

## 🔧 Setup Requirements

1. **Firebase SDK**: Make sure you have Firebase installed
   ```bash
   npm install firebase
   ```

2. **Firebase Config**: Update the configuration with your project details

3. **Permissions**: Ensure your Firebase project allows the operations

## 📝 Examples

### Delete all rides from January 2025
```bash
node scripts/cleanup-rides.js --start-date=2025-01-01 --end-date=2025-01-31
```

### Delete all test data including medical and scheduled rides
```bash
node scripts/cleanup-rides.js --start-date=2025-01-01 --end-date=2025-01-31 --include-medical --include-scheduled
```

### See what would be deleted (dry run)
```bash
node scripts/cleanup-rides.js --start-date=2025-01-01 --end-date=2025-01-31 --dry-run
```

## 🚨 Important Notes

- **Always run dry-run first** to see what will be deleted
- **Double-check your date ranges** - there's no undo!
- **Start with small date ranges** for testing
- **Backup important data** before running cleanup scripts
- **The scripts delete based on `createdAt` field** in your documents

## 🆘 Troubleshooting

### "Firebase config not found"
- Update the Firebase configuration in the script with your project details

### "Permission denied"
- Check your Firebase security rules
- Ensure you're authenticated properly

### "No rides found"
- Check if your date range is correct
- Verify the collection names match your Firebase setup
- Check if rides have `createdAt` field

### Script runs but no deletions
- Make sure you're not running in dry-run mode
- Check the console output for error messages
