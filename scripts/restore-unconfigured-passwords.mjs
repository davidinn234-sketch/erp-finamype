import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { readFile } from 'node:fs/promises';

// One-time recovery for existing accounts whose address has no mailbox.
// Existing configured passwords are preserved. Passwords never leave memory.
const args = process.argv.slice(2);
const index = args.indexOf('--backup-file');
if (index < 0 || !args[index + 1]) throw new Error('--backup-file is required.');
const backup = JSON.parse(await readFile(args[index + 1], 'utf8'));
const projectId = process.env.FIREBASE_PROJECT_ID || 'mi-erp-nube';
const databaseId = process.env.FIRESTORE_DATABASE_ID || 'ai-studio-nexuserpsalvador-619c5a84-1f5d-4833-aee7-65b2a99f4a3b';
if (backup.projectId !== projectId || backup.databaseId !== databaseId) throw new Error('Backup project or database mismatch.');
const app = initializeApp({ projectId }), auth = getAuth(app), db = getFirestore(app, databaseId);
let restored = 0, alreadyConfigured = 0, unavailable = 0;
const eligible = [];
for (const record of backup.records.users) {
  const { email, password } = record.data;
  const identity = await auth.getUserByEmail(email.trim().toLowerCase());
  const profile = await db.doc(`users/${identity.uid}`).get();
  if (!profile.exists || profile.data().email !== identity.email) throw new Error('A migrated profile cannot be verified.');
  if (identity.providerData.some(provider => provider.providerId === 'password')) { alreadyConfigured++; continue; }
  if (typeof password !== 'string' || password.length < 6 || password.length > 128) { unavailable++; continue; }
  eligible.push({ uid: identity.uid, password });
}
if (args.includes('--apply')) for (const { uid, password } of eligible) {
  await auth.updateUser(uid, { password });
  restored++;
}
console.log(JSON.stringify({ mode: args.includes('--apply') ? 'apply' : 'audit', eligible: eligible.length, restored, alreadyConfigured, unavailable }, null, 2));
