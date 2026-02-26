import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// Emulator connections
import { connectAuthEmulator } from "firebase/auth";
import { connectFirestoreEmulator } from "firebase/firestore";
import { connectFunctionsEmulator } from "firebase/functions";

// Configuration switcher
const USE_EMULATOR = true;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services with persistent local cache for cross-tab sync (Safari ↔ PWA)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
export const auth = getAuth(app);
export const functions = getFunctions(app, "us-west1");
export const messaging = getMessaging(app);

// Connect to emulators if in development mode
if (USE_EMULATOR) {
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
}
export default app;
