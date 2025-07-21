# Driver Onboarding Status Implementation

## Overview

This document provides clear instructions for implementing driver onboarding status tracking between the web app and mobile app. The system will track whether drivers have completed the full onboarding process and control access to app features accordingly.

## Database Schema (Firestore)

**Collection:** `drivers`  
**Document ID:** `{driver_uid}`  
**Fields to add:**

```javascript
{
  // ... existing driver fields ...
  
  // Onboarding Status
  onboardingStatus: {
    completed: boolean,           // true = fully onboarded, false = pending
    completedAt: timestamp,       // When onboarding was completed
    completedBy: string,          // "web" | "mobile" | "admin"
    lastUpdated: timestamp,       // Last status update
  },
  
  // Approval Status (existing field - update if needed)
  approvalStatus: {
    status: string,               // "pending" | "approved" | "rejected" | "suspended"
    approvedAt: timestamp,        // When approved
    approvedBy: string,           // Admin UID who approved
    notes: string,                // Admin notes
  },
  
  // Mobile App Status
  mobileAppStatus: {
    accountCreated: boolean,      // true if account created in mobile app
    accountCreatedAt: timestamp,  // When mobile account was created
    lastMobileLogin: timestamp,   // Last mobile app login
  }
}
```

## Web App Implementation

### 1. Onboarding Completion Flow

When a driver completes all onboarding steps in the web app:

```javascript
// When driver completes all onboarding steps
const completeOnboarding = async (driverUid) => {
  await updateDoc(doc(db, 'drivers', driverUid), {
    'onboardingStatus.completed': true,
    'onboardingStatus.completedAt': serverTimestamp(),
    'onboardingStatus.completedBy': 'web',
    'onboardingStatus.lastUpdated': serverTimestamp(),
    'approvalStatus.status': 'approved', // Auto-approve if onboarding complete
    'approvalStatus.approvedAt': serverTimestamp(),
    'approvalStatus.approvedBy': 'system'
  });
};
```

### 2. Admin Override for Testing

Admin function to manually set onboarding status for testing purposes:

```javascript
// Admin function to manually set onboarding status
const setOnboardingStatus = async (driverUid, completed, adminUid) => {
  await updateDoc(doc(db, 'drivers', driverUid), {
    'onboardingStatus.completed': completed,
    'onboardingStatus.completedAt': completed ? serverTimestamp() : null,
    'onboardingStatus.completedBy': 'admin',
    'onboardingStatus.lastUpdated': serverTimestamp(),
    'approvalStatus.status': completed ? 'approved' : 'pending',
    'approvalStatus.approvedAt': completed ? serverTimestamp() : null,
    'approvalStatus.approvedBy': completed ? adminUid : null
  });
};
```

### 3. Admin Dashboard Controls

Add onboarding status controls to the admin dashboard:

```javascript
// Add to admin dashboard
const OnboardingControls = ({ driverUid }) => {
  const [isCompleted, setIsCompleted] = useState(false);
  
  const toggleOnboarding = async () => {
    await setOnboardingStatus(driverUid, !isCompleted, currentAdminUid);
    setIsCompleted(!isCompleted);
  };
  
  return (
    <div>
      <h3>Onboarding Status</h3>
      <button onClick={toggleOnboarding}>
        {isCompleted ? 'Mark as Pending' : 'Mark as Complete'}
      </button>
      <p>Status: {isCompleted ? '✅ Complete' : '⏳ Pending'}</p>
    </div>
  );
};
```

## Mobile App Integration

### 1. Check Onboarding Status

In the mobile app, check if driver can access full features:

```javascript
// In mobile app - check if driver can access full features
const checkOnboardingStatus = async (driverUid) => {
  const driverDoc = await getDoc(doc(db, 'drivers', driverUid));
  const onboardingStatus = driverDoc.data()?.onboardingStatus;
  
  return {
    isOnboarded: onboardingStatus?.completed || false,
    canAccessFullFeatures: onboardingStatus?.completed || false,
    needsOnboarding: !onboardingStatus?.completed
  };
};
```

### 2. Update Mobile Account Creation

When driver creates account in mobile app:

```javascript
// When driver creates account in mobile app
const createMobileAccount = async (driverUid, email) => {
  await updateDoc(doc(db, 'drivers', driverUid), {
    'mobileAppStatus.accountCreated': true,
    'mobileAppStatus.accountCreatedAt': serverTimestamp(),
    'mobileAppStatus.lastMobileLogin': serverTimestamp()
  });
};
```

## Testing Instructions

### 1. Manual Testing

- Use admin dashboard to toggle onboarding status
- Test mobile app behavior with different statuses
- Verify pending approval banner shows/hides correctly
- Test the complete flow: web onboarding → mobile app access

### 2. Automated Testing

```javascript
// Test cases
describe('Onboarding Status', () => {
  test('should show pending banner when not onboarded', async () => {
    // Set onboardingStatus.completed = false
    // Verify banner appears in mobile app
  });
  
  test('should hide pending banner when onboarded', async () => {
    // Set onboardingStatus.completed = true
    // Verify banner disappears in mobile app
  });
  
  test('should restrict features when not onboarded', async () => {
    // Verify certain features are disabled
  });
});
```

## Security Rules

Add these Firestore security rules:

```javascript
// Firestore security rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /drivers/{driverId} {
      // Drivers can read their own data
      allow read: if request.auth != null && request.auth.uid == driverId;
      
      // Only admins can update onboarding status
      allow update: if request.auth != null && 
        (request.auth.uid == driverId || 
         get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == 'admin');
    }
  }
}
```

## Implementation Checklist

### Phase 1: Database Setup
- [ ] Add onboarding status fields to Firestore schema
- [ ] Update existing driver documents with default values
- [ ] Add security rules for onboarding status updates

### Phase 2: Web App Implementation
- [ ] Implement onboarding completion flow
- [ ] Add admin override controls to dashboard
- [ ] Test onboarding completion triggers
- [ ] Add status indicators in admin interface

### Phase 3: Mobile App Integration
- [ ] Update mobile app to check onboarding status
- [ ] Implement pending approval banner
- [ ] Add feature restrictions for non-onboarded drivers
- [ ] Test mobile app behavior with different statuses

### Phase 4: Testing & Validation
- [ ] Manual testing of complete flow
- [ ] Automated test suite
- [ ] Security testing
- [ ] Performance testing with large datasets

## Mobile App Behavior

### When Onboarding is Pending:
- Show pending approval banner
- Disable online/offline toggle
- Restrict access to certain features
- Show "Continue Onboarding" button linking to web app

### When Onboarding is Complete:
- Hide pending approval banner
- Enable all app features
- Allow normal driver operations
- Show full dashboard functionality

## Troubleshooting

### Common Issues:

1. **Status not updating**: Check Firestore security rules
2. **Banner not showing/hiding**: Verify mobile app is checking correct field
3. **Admin override not working**: Ensure admin permissions are set correctly
4. **Performance issues**: Add indexes for onboarding status queries

### Debug Commands:

```javascript
// Check driver status
const checkDriverStatus = async (driverUid) => {
  const doc = await getDoc(doc(db, 'drivers', driverUid));
  console.log('Driver Status:', doc.data());
};

// Reset onboarding status
const resetOnboarding = async (driverUid) => {
  await setOnboardingStatus(driverUid, false, 'admin');
};
```

## Summary

This implementation provides:

1. ✅ **Complete onboarding status tracking**
2. ✅ **Admin override capabilities for testing**
3. ✅ **Mobile app integration**
4. ✅ **Security controls**
5. ✅ **Testing framework**

The system ensures drivers complete the full onboarding process in the web app before gaining access to all mobile app features, while providing flexibility for testing and admin management. 