/**
 * Firebase Client SDK Configuration
 *
 * SECURITY NOTE:
 * These are public config values — they identify your Firebase project.
 * They are NOT secret. Firebase security is enforced by:
 *   1. Firestore Security Rules (server-side)
 *   2. Authentication state checks
 *   3. Our backend verifying the ID Token on every API call
 *
 * The Gemini API key and Firebase Admin service account are NEVER here.
 * Those stay on the backend server only.
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate config in development
if (import.meta.env.DEV) {
  const missing = Object.entries(firebaseConfig)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length) {
    console.warn('[Firebase] Missing env vars:', missing.join(', '));
    console.warn('[Firebase] Auth will use development mock mode');
  }
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);
export default app;
