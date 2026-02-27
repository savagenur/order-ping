import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { connectAuthEmulator } from "firebase/auth";
import { connectFirestoreEmulator } from "firebase/firestore";
import { connectFunctionsEmulator } from "firebase/functions";
import { validateEnv } from "./envValidation";

// Validate environment variables
const env = validateEnv();

// Emulator configuration for development
const USE_EMULATOR = import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR !== 'false';

// Firebase configuration
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export const auth = getAuth(app);
export const functions = getFunctions(app, "us-west1");

// Initialize messaging with error handling
export let messaging: ReturnType<typeof getMessaging> | null = null;
try {
  messaging = getMessaging(app);
} catch (error) {
  console.warn('Firebase Messaging initialization failed:', error);
}

// Connect to emulators in development
if (USE_EMULATOR) {
  try {
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
    connectAuthEmulator(auth, "http://127.0.0.1:9099");
    console.log("🔧 Connected to Firebase emulators");
  } catch (error) {
    console.warn("⚠️ Failed to connect to emulators:", error);
  }
}

export default app;
