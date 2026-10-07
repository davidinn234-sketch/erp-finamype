/** Offline operator tool. Never run against production without backup + reviewed manifest. */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { adminServices } from '../server/firebaseAdmin';

const args = process.argv.slice(2);
const manifestPath = args.find((arg) => !arg.startsWith('--'));
if (!manifestPath) throw new Error('Uso: npm run migrate:auth -- /ruta/manifest.json [--apply]');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as { users: Array<{ id: string; email: string; role: string; companyId?: string }>; personalMetaOwnerId?: string };
if (!manifest.users?.length || new Set(manifest.users.map((u) => u.id)).size !== manifest.users.length) throw new Error('Manifiesto inválido o IDs repetidos.');
const { auth, db } = adminServices();
const planned = [];
// Preflight every account before writing any account. Roles/tenants come from a reviewed manifest,
// never from the formerly world-writable legacy profiles alone.
for (const approved of manifest.users) {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(approved.id) || !['admin_maestro', 'gerente', 'contador', 'cajero', 'vendedor', 'kiosko_asistencia'].includes(approved.role)) throw new Error(`ID/rol inválido: ${approved.id}`);
  const snap = await db.doc(`users/${approved.id}`).get();
  if (!snap.exists || snap.data()?.email?.toLowerCase() !== approved.email.toLowerCase()) throw new Error(`Revisa identidad ${approved.id}.`);
  if (approved.companyId && !(await db.doc(`companies/${approved.companyId}`).get()).exists) throw new Error(`Empresa ausente para ${approved.id}.`);
  const existing = await auth.getUser(approved.id).catch((e) => { if (e.code === 'auth/user-not-found') return null; throw e; });
  if (existing && existing.email?.toLowerCase() !== approved.email.toLowerCase()) throw new Error(`UID de Auth ocupado: ${approved.id}`);
  const emailOwner = await auth.getUserByEmail(approved.email).catch((e) => { if (e.code === 'auth/user-not-found') return null; throw e; });
  if (emailOwner && emailOwner.uid !== approved.id) throw new Error(`El correo de ${approved.id} ya usa otro UID. No se vincula automáticamente.`);
  planned.push({ approved, existing });
}
if (manifest.personalMetaOwnerId && !manifest.users.some((u) => u.id === manifest.personalMetaOwnerId)) throw new Error('El dueño de las metas debe figurar en el manifiesto.');
console.log(`Prevalidación completada: ${planned.length} cuentas. ${args.includes('--apply') ? 'Aplicando.' : 'Sin cambios (agrega --apply para aplicar).'}`);
if (args.includes('--apply')) {
  for (const { approved, existing } of planned) {
    const newPassword = randomBytes(48).toString('base64url');
    if (!existing) await auth.createUser({ uid: approved.id, email: approved.email, password: newPassword });
    else await auth.updateUser(approved.id, { password: newPassword, disabled: false });
    await db.doc(`users/${approved.id}`).update({ id: approved.id, email: approved.email.toLowerCase(), role: approved.role,
      companyId: approved.companyId || FieldValue.delete(), password: FieldValue.delete(), disabled: false });
    await auth.revokeRefreshTokens(approved.id);
    console.log(`Migrada: ${approved.id}. Restablece su contraseña en Firebase Authentication.`);
  }
  const approvedIds = new Set(manifest.users.map((u) => u.id));
  for (const record of (await db.collection('users').get()).docs) {
    if (!approvedIds.has(record.id)) await record.ref.update({ disabled: true, password: FieldValue.delete() });
  }
  if (manifest.personalMetaOwnerId) {
    const shared = await db.doc('personal_finance_meta/data').get();
    const target = db.doc(`personal_finance_meta/${manifest.personalMetaOwnerId}`);
    if (shared.exists && !(await target.get()).exists) await target.create(shared.data()!);
    // Keep the old document blocked by rules for manual review, never broadcast it to every account.
  }
  console.log('No se enviaron correos. Las cuentas omitidas quedaron bloqueadas en los perfiles ERP.');
}
