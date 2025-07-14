import { initializeApp, getApps } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import messaging from '@react-native-firebase/messaging';
import functions from '@react-native-firebase/functions';
import Constants from 'expo-constants';

// Firebase configuration from app.json extra
const firebaseConfig = Constants.expoConfig?.extra?.firebaseConfig || {
  apiKey: "your-firebase-api-key",
  authDomain: "rydeiq-production.firebaseapp.com",
  projectId: "rydeiq-production",
  storageBucket: "rydeiq-production.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase only if it hasn't been initialized already
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase services
const firebaseAuth = auth();
const firebaseFirestore = firestore();
const firebaseStorage = storage();
const firebaseMessaging = messaging();
const firebaseFunctions = functions();

// Enable offline persistence for Firestore
firebaseFirestore.settings({
  persistence: true,
  cacheSizeBytes: 100 * 1024 * 1024, // 100MB cache
});

// Configure Firestore for offline support
firebaseFirestore.enableNetwork();

export {
  app as firebaseApp,
  firebaseAuth,
  firebaseFirestore,
  firebaseStorage,
  firebaseMessaging,
  firebaseFunctions
};

export default app; 