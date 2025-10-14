# Ride Cleanup Scripts

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
