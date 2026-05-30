import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let app;
let db: any;
let auth: any;
let isRealFirebase = false;

try {
  // If the apiKey is the default dummy key, we can still initialize or flag as demo mode
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
  auth = getAuth(app);
  
  if (firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('Dummy_Key')) {
    isRealFirebase = true;
  }
} catch (error) {
  console.warn('Firebase failed to initialize. Running in LocalStorage Sandbox mode.', error);
}

export { app, db, auth, isRealFirebase };
export default app;
