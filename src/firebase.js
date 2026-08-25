import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Product images go through Cloudinary (see src/services/cloudinary.js), so
// Firebase Storage — which now requires the Blaze plan — isn't needed here.
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
export const firebaseReady = requiredKeys.every(key => {
  const value = firebaseConfig[key];
  return typeof value === 'string' && value.length > 0 && !value.includes('your_');
});

export const app = firebaseReady ? initializeApp(firebaseConfig) : null;
export const db = firebaseReady ? getFirestore(app) : null;
