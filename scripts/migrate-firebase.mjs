import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Audit by default. Credentials must be configured outside the repository.
const args = process.argv.slice(2);
const value = flag => args[args.indexOf(flag) + 1];
const apply = args.includes('--apply');
const grantAdmin = args.includes('--grant-admin');
const adminEmail = args.includes('--admin-email') ? value('--admin-email').trim().toLowerCase() : undefined;
if (grantAdmin && !adminEmail) throw new Error('--grant-admin requires --admin-email.');
if (apply && !args.includes('--backup-dir')) throw new Error('Migration requires --backup-dir for an automatic private backup before changes.');
const projectId = process.env.FIREBASE_PROJECT_ID || 'mi-erp-nube';
const databaseId = process.env.FIRESTORE_DATABASE_ID || 'ai-studio-nexuserpsalvador-619c5a84-1f5d-4833-aee7-65b2a99f4a3b';
const app = initializeApp({ projectId });
const auth = getAuth(app), db = getFirestore(app, databaseId);
const names = ['users', 'companies', 'personal_finances', 'personal_finance_meta', 'branches', 'products', 'customers', 'invoices', 'customer_payments', 'suppliers', 'purchases', 'supplier_payments', 'kardex_movements', 'employees', 'payrolls', 'attendance_directory', 'attendance', 'leave_requests', 'professional_services', 'candidate_folders', 'candidates', 'bank_accounts', 'treasury_movements', 'other_incomes', 'journal_entries', 'dynamic_widgets', 'company_settings'];
const snapshots = await Promise.all(names.map(name => db.collection(name).get()));
const records = Object.fromEntries(snapshots.map((snapshot, index) => [names[index], snapshot.docs.map(document => ({ documentId: document.id, data: document.data() }))]));
const emailOwners = new Map();
for (const record of records.users) {
  const email = record.data.email?.trim().toLowerCase();
  if (!email || !email.includes('@')) throw new Error('A profile has an invalid email. Resolve it before migration.');
  if (emailOwners.has(email)) throw new Error('There are duplicate profile emails. Resolve duplicate ownership before migration; no data was changed.');
  emailOwners.set(email, record.documentId);
}
const userIds = new Set(records.users.map(record => record.documentId));
const unownedPersonal = records.personal_finances.filter(record => !userIds.has(record.data.userId));
console.log(JSON.stringify({ mode: apply ? 'apply' : 'audit', profiles: records.users.length, companies: records.companies.length, legacyPlaintextProfiles: records.users.filter(record => 'password' in record.data).length, personalRecordsWithUnknownOwner: unownedPersonal.length, sharedPersonalMetadata: records.personal_finance_meta.some(record => record.documentId === 'data'), grantAdmin: !!grantAdmin }, null, 2));
if (!apply) process.exit(0);

const backupDirectory = path.resolve(value('--backup-dir'));
await mkdir(backupDirectory, { recursive: true });
await writeFile(path.join(backupDirectory, `firebase-before-migration-${Date.now()}.json`), JSON.stringify({ projectId, databaseId, records }, null, 2), { flag: 'wx' });
const mappings = new Map();
for (const record of records.users) {
  const email = record.data.email.trim().toLowerCase();
  const identity = await auth.getUserByEmail(email).catch(error => {
    if (error.code !== 'auth/user-not-found') throw error;
    // Existing plaintext passwords are never reused. The owner sets a new
    // password through Firebase's password reset flow.
    return auth.createUser({ email, displayName: record.data.name });
  });
  mappings.set(record.documentId, identity.uid);
}
const operations = [];
for (const record of records.users) {
  const { password, platformAdmin, ...safe } = record.data;
  const uid = mappings.get(record.documentId);
  operations.push(batch => batch.set(db.doc(`users/${uid}`), { ...safe, id: uid, email: safe.email.trim().toLowerCase(), role: safe.role === 'admin_maestro' ? 'gerente' : safe.role }));
  if (record.documentId !== uid) operations.push(batch => batch.delete(db.doc(`users/${record.documentId}`)));
}
for (const record of records.companies) {
  const { dtePrivateKey, dteApiPassword, ...safe } = record.data;
  const owner = mappings.get(safe.primaryAdminUserId) || safe.primaryAdminUserId;
  operations.push(batch => batch.set(db.doc(`companies/${record.documentId}`), { ...safe, id: record.documentId, ...(owner ? { primaryAdminUserId: owner } : {}) }));
}
for (const record of records.personal_finances) {
  const uid = mappings.get(record.data.userId);
  if (uid) operations.push(batch => batch.update(db.doc(`personal_finances/${record.documentId}`), { id: record.documentId, userId: uid }));
}
for (const record of records.personal_finance_meta) {
  // Never attribute the old shared document to an arbitrary owner.
  const uid = mappings.get(record.documentId);
  if (record.documentId !== 'data' && uid) {
    operations.push(batch => batch.set(db.doc(`personal_finance_meta/${uid}`), { ...record.data, userId: uid }));
    if (record.documentId !== uid) operations.push(batch => batch.delete(db.doc(`personal_finance_meta/${record.documentId}`)));
  }
}
for (const record of records.employees) {
  const employee = { ...record.data, id: record.documentId };
  if (!employee.companyId) continue;
  const directory = Object.fromEntries(['id', 'companyId', 'firstName', 'lastName', 'position', 'pinCode', 'isActive', 'branchId', 'branchName', 'avatar'].filter(key => employee[key] !== undefined).map(key => [key, employee[key]]));
  operations.push(batch => batch.set(db.doc(`attendance_directory/${record.documentId}`), directory));
}
for (let offset = 0; offset < operations.length; offset += 400) {
  const batch = db.batch();
  operations.slice(offset, offset + 400).forEach(operation => operation(batch));
  await batch.commit();
}
if (grantAdmin) {
  const identity = await auth.getUserByEmail(adminEmail);
  await auth.setCustomUserClaims(identity.uid, { ...identity.customClaims, platformAdmin: true });
}
console.log('Migration completed. Unknown-owner transactions and shared personal metadata were preserved for manual review. Owners must reset passwords; the administrator must sign in again to refresh permissions.');
