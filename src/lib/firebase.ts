import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { initializeFirestore, doc, setDoc, getDocFromServer } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyDZkCTczhrvxTzxGSTsPtENKWztKUdpe_M",
  authDomain: "mi-erp-nube.firebaseapp.com",
  projectId: "mi-erp-nube",
  storageBucket: "mi-erp-nube.firebasestorage.app",
  messagingSenderId: "96182387469",
  appId: "1:96182387469:web:938520455ea1f073cf6644",
  measurementId: ""
};

export const firestoreDatabaseId = "ai-studio-nexuserpsalvador-619c5a84-1f5d-4833-aee7-65b2a99f4a3b";

// Initialize Firebase
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const firebaseApp = app;

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

// Connection test helper mandated by Firebase skill
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    const testDocRef = doc(db, "test", "connection");
    await setDoc(
      testDocRef,
      {
        timestamp: new Date().toISOString(),
        status: "online",
        project: "mi-erp-nube",
        source: "FINAMIPE SV Cloud ERP"
      },
      { merge: true }
    );
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