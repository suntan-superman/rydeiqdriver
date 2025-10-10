// Firebase Configuration
// All configuration values are loaded from environment variables
// See .env.example for required variables
export const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Validate required Firebase configuration
const validateFirebaseConfig = () => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missing = requiredFields.filter(field => !FIREBASE_CONFIG[field]);
  
  if (missing.length > 0) {
    console.error('❌ Firebase configuration error: Missing required fields:', missing);
    console.error('📝 Please create a .env file with the required EXPO_PUBLIC_FIREBASE_* variables');
    console.error('💡 See .env.example for template');
    throw new Error(`Firebase configuration incomplete. Missing: ${missing.join(', ')}`);
  }
};

// Run validation
validateFirebaseConfig(); 