import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getAnalytics, isSupported } from "firebase/analytics";
import { initializeFirestore, doc, getDocFromServer, connectFirestoreEmulator } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyDZkCTczhrvxTzxGSTsPtENKWztKUdpe_M",
  authDomain: "mi-erp-nube.firebaseapp.com",
  projectId: import.meta.env?.DEV && import.meta.env?.VITE_USE_FIREBASE_EMULATORS === 'true' ? 'demo-fina-pyme' : 'mi-erp-nube',
  storageBucket: "mi-erp-nube.firebasestorage.app",
  messagingSenderId: "96182387469",
  appId: "1:96182387469:web:938520455ea1f073cf6644",
  measurementId: ""
};

export const firestoreDatabaseId = import.meta.env?.DEV && import.meta.env?.VITE_USE_FIREBASE_EMULATORS === 'true' ? '(default)' : 'ai-studio-nexuserpsalvador-619c5a84-1f5d-4833-aee7-65b2a99f4a3b';

// Initialize Firebase
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const firebaseApp = app;
export const auth = getAuth(app);

// Initialize Analytics safely for web environments
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      // Optional analytics initialization
    });
}

// Initialize Cloud Firestore database bound to the provisioned database ID
// ignoreUndefinedProperties: true prevents writes from silently throwing
// (and being swallowed by .catch()) whenever an optional field is empty
// and ends up as `undefined` (e.g. phone, notes, etc.). Without this,
// Firestore rejects the entire document write.
export const db = initializeFirestore(
  app,
  { ignoreUndefinedProperties: true },
  firestoreDatabaseId
);

if (import.meta.env?.DEV && import.meta.env?.VITE_USE_FIREBASE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}

// Connection test helper mandated by Firebase skill
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    if (!auth.currentUser) return false;
    const testDocRef = doc(db, 'users', auth.currentUser.uid);
    await getDocFromServer(testDocRef);
    console.log("✓ Firebase Firestore en la nube (mi-erp-nube) conectado exitosamente.");
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Firebase Firestore está en modo offline/cache.");
    } else {
      console.warn("Verificación de conexión Firestore en mi-erp-nube:", error);
    }
    return false;
  }
}
