import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export function adminServices() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const databaseId = process.env.FIREBASE_DATABASE_ID;
  if (!projectId || !databaseId) throw new Error('Configura FIREBASE_PROJECT_ID y FIREBASE_DATABASE_ID en el servidor.');
  const app = getApps()[0] || initializeApp({ projectId, credential: applicationDefault() });
  return { auth: getAuth(app), db: getFirestore(app, databaseId) };
}
