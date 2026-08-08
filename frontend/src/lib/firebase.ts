import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    if (!firebaseConfig.apiKey || !firebaseConfig.appId || !firebaseConfig.projectId) {
      throw new Error(
        'Firebase web config is incomplete. Set VITE_FIREBASE_API_KEY and VITE_FIREBASE_APP_ID in frontend/.env.local',
      );
    }
    app = initializeApp(firebaseConfig);
  }
  return app;
}

export function getAuthInstance(): Auth {
  return getAuth(getFirebaseApp());
}

export const googleProvider = new GoogleAuthProvider();
