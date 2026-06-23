import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;
let isRealFirebase = false;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)') as Firestore;
  auth = getAuth(app);

  if (firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('Dummy_Key')) {
    isRealFirebase = true;
  }
} catch (error) {
  console.warn('Firebase failed to initialize. Running in LocalStorage Sandbox mode.', error);
}

export { app, db, auth, isRealFirebase };
export default app;
