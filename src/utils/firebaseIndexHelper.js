/**
 * Firebase Index Helper
 * 
 * This utility helps manage Firebase Firestore indexes and provides
 * guidance for creating required composite indexes.
 */

class FirebaseIndexHelper {
  constructor() {
    this.requiredIndexes = [
      {
        collection: 'rideRequests',
        fields: ['driverId', 'status', 'timestamp'],
        description: 'For querying ride requests by driver with status and timestamp ordering',
        url: 'https://console.firebase.google.com/v1/r/project/ryde-9d4bf/firestore/indexes?create_composite=Ck9wcm9qZWN0cy9yeWRlLTlkNGJmL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9yaWRlUmVxdWVzdHMvaW5kZXhlcy9fEAEaDAoIZHJpdmVySWQQARoKCgZzdGF0dXMQARoNCgl0aW1lc3RhbXAQAhoMCghfX25hbWVfXxAC'
      },
      {
        collection: 'rideRequests',
        fields: ['driverId', 'status'],
        description: 'For querying ride requests by driver and status',
        url: 'https://console.firebase.google.com/v1/r/project/ryde-9d4bf/firestore/indexes?create_composite=Ck9wcm9qZWN0cy9yeWRlLTlkNGJmL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9yaWRlUmVxdWVzdHMvaW5kZXhlcy9fEAEaDAoIZHJpdmVySWQQARoKCgZzdGF0dXMQARoMCghfX25hbWVfXxAC'
      }
    ];
  }

  // Get all required indexes
  getRequiredIndexes() {
    return this.requiredIndexes;
  }

  // Get index creation URL for a specific collection and fields
  getIndexUrl(collection, fields) {
    const index = this.requiredIndexes.find(idx => 
      idx.collection === collection && 
      JSON.stringify(idx.fields) === JSON.stringify(fields)
    );
    return index?.url || null;
  }

  // Log index requirements
  logIndexRequirements() {
    // Console logging removed for cleaner output
  }

  // Check if we're in development mode and log index info
  checkIndexRequirements() {
    if (__DEV__) {
      // Indexes are now created and enabled
      // Performance optimized queries are being used
    }
  }

  // Get optimized query suggestions
  getOptimizedQuerySuggestions() {
    return {
      current: {
        description: 'Current simplified query (no composite index required)',
        query: `
          query(
            rideRequestsRef,
            where('driverId', '==', driverId)
          )
        `,
        pros: ['No composite index required', 'Works immediately'],
        cons: ['Filters in memory', 'May fetch more data than needed']
      },
      optimized: {
        description: 'Optimized query (requires composite index)',
        query: `
          query(
            rideRequestsRef,
            where('driverId', '==', driverId),
            where('status', '==', 'pending'),
            orderBy('timestamp', 'desc')
          )
        `,
        pros: ['Server-side filtering', 'Better performance', 'Less data transfer'],
        cons: ['Requires composite index', 'More complex setup']
      }
    };
  }
}

// Export singleton instance
export default new FirebaseIndexHelper(); 