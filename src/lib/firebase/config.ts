import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Explicitly define fallback values to ensure they are available even if env vars are empty strings
const FALLBACK_CONFIG = {
  apiKey: "AIzaSyDwFonu0V4hRkBVjq9OlxQ2RHGA-0sW6yo",
  authDomain: "basechanwiser.firebaseapp.com",
  databaseURL: "https://basechanwiser-default-rtdb.firebaseio.com",
  projectId: "basechanwiser",
  storageBucket: "basechanwiser.firebasestorage.app",
  messagingSenderId: "617583251187",
  appId: "1:617583251187:web:ec4000cd77c5fb5322f186",
  measurementId: "G-00TQ0389WL",
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || FALLBACK_CONFIG.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || FALLBACK_CONFIG.authDomain,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || FALLBACK_CONFIG.databaseURL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || FALLBACK_CONFIG.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || FALLBACK_CONFIG.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || FALLBACK_CONFIG.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || FALLBACK_CONFIG.appId,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || FALLBACK_CONFIG.measurementId,
};

if (!firebaseConfig.projectId || firebaseConfig.projectId === "undefined" || firebaseConfig.projectId === "") {
  firebaseConfig.projectId = FALLBACK_CONFIG.projectId;
}

const isNewApp = !getApps().length;
const app = isNewApp ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Enable Firestore persistent offline cache across multiple tabs for instant zero-delay loading
let db: ReturnType<typeof getFirestore>;
if (isNewApp && typeof window !== "undefined") {
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
  } catch (e) {
    db = getFirestore(app);
  }
} else {
  db = getFirestore(app);
}

const storage = getStorage(app);

export { app, auth, db, storage };
