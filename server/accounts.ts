import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { adminServices } from './firebaseAdmin';
import { canManageUser, publicProfile, rateLimit, requireSession } from './security';

const roles = ['admin_maestro', 'gerente', 'contador', 'cajero', 'vendedor', 'kiosko_asistencia'];
const editable = ['name', 'email', 'role', 'companyId', 'avatar', 'permissions', 'dui', 'nit', 'phone', 'address', 'department', 'municipality', 'jobTitle', 'systemArchetype', 'isConfigured', 'enabledServices'];
function clean(input: any) {
  const profile: Record<string, any> = {};
  for (const key of editable) if (input?.[key] !== undefined) profile[key] = input[key];
  return profile;
}
function validProfile(profile: any) {
  return typeof profile.name === 'string' && profile.name.trim().length > 0 &&
    typeof profile.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email) &&
    roles.includes(profile.role) && (!profile.companyId || typeof profile.companyId === 'string');
}

// Creates Auth first, then commits company/branch/profile together. Auth is rolled back on failure.
async function provision(input: any, companyInput?: any, branchInput?: any) {
  const { auth, db } = adminServices();
  const profile = clean(input);
  profile.email = profile.email?.trim().toLowerCase();
  if (!validProfile(profile) || typeof input.password !== 'string' || input.password.length < 12) {
    throw new Error('Ingresa nombre, correo, rol válido y una contraseña de al menos 12 caracteres.');
  }
  const id = randomUUID();
  let company: any;
  let branch: any;
  if (companyInput) {
    const companyId = `comp_${randomUUID()}`;
    company = { ...companyInput, id: companyId, primaryAdminUserId: id };
    profile.companyId = companyId;
    branch = { ...branchInput, id: `branch_${randomUUID()}`, companyId };
  } else if (profile.companyId && !(await db.doc(`companies/${profile.companyId}`).get()).exists) {
    throw new Error('La empresa no existe.');
  }
  const user = { ...profile, id, createdAt: new Date().toISOString(), storedInCloud: true };
  await auth.createUser({ uid: id, email: profile.email, password: input.password, displayName: profile.name });
  try {
    const batch = db.batch();
    batch.create(db.doc(`users/${id}`), user);
    if (company) {
      batch.create(db.doc(`companies/${company.id}`), company);
      batch.create(db.doc(`branches/${branch.id}`), branch);
    }
    await batch.commit();
  } catch (error) {
    await auth.deleteUser(id);
    throw error;
  }
  return { user, ...(company ? { company, branch } : {}) };
}

export const registrationRouter = Router();
registrationRouter.post('/', rateLimit(5, 60 * 60 * 1000, false), async (req, res) => {
  // Deliberate opt-in: anonymous clients cannot create paid accounts by default.
  if (process.env.ALLOW_SELF_REGISTRATION !== 'true') {
    res.status(403).json({ error: 'Solicita tu cuenta al administrador de la plataforma.' }); return;
  }
  try {
    const input = req.body.user || {};
    const user = { name: input.name, email: input.email, password: input.password, phone: input.phone,
      role: 'gerente', systemArchetype: req.body.company ? 'emprendedor_control_interno' : 'finanzas_personales', isConfigured: false };
    // Never accept tenant IDs, admin roles, subscription status or DTE capabilities from signup.
    const company = req.body.company ? { name: String(req.body.company.name || user.name), tradeName: String(req.body.company.name || user.name), currency: 'USD', fiscalYear: new Date().getFullYear(), systemArchetype: 'emprendedor_control_interno', subscriptionStatus: 'prueba', dteActive: false } : undefined;
    const branch = company ? { name: 'Casa Matriz', code: 'SUC-01', isMain: true, isActive: true } : undefined;
    res.status(201).json(await provision(user, company, branch));
  } catch {
    res.status(400).json({ error: 'No se pudo crear la cuenta. Verifica el correo y usa una contraseña de al menos 12 caracteres.' });
  }
});

export const accountsRouter = Router();
accountsRouter.use(requireSession, rateLimit(30, 60 * 1000));
accountsRouter.post('/', async (req, res) => {
  const actor = res.locals.profile;
  const input = req.body.user || {};
  if (!canManageUser(actor, input) || (req.body.company && actor.role !== 'admin_maestro')) {
    res.status(403).json({ error: 'No puedes crear cuentas con esos permisos o empresa.' }); return;
  }
  try {
    res.status(201).json(await provision(input, req.body.company, req.body.branch));
  } catch {
    res.status(400).json({ error: 'No se pudo crear la cuenta. Verifica correo, empresa y contraseña (mínimo 12 caracteres).' });
  }
});
accountsRouter.patch('/:id', async (req, res) => {
  try {
    const { db, auth } = adminServices();
    const target = (await db.doc(`users/${req.params.id}`).get()).data();
    const actor = res.locals.profile;
    if (!target) { res.status(404).json({ error: 'Cuenta no encontrada.' }); return; }
    const updates = clean(req.body);
    const proposed = { ...target, ...updates };
    if (!canManageUser(actor, target) || !canManageUser(actor, proposed) ||
        (actor.id === target.id && (proposed.role !== target.role || proposed.companyId !== target.companyId))) {
      res.status(403).json({ error: 'No puedes modificar esos permisos.' }); return;
    }
    if (!validProfile(proposed)) { res.status(400).json({ error: 'Datos de cuenta inválidos.' }); return; }
    if (updates.companyId && !(await db.doc(`companies/${updates.companyId}`).get()).exists) {
      res.status(400).json({ error: 'Empresa no encontrada.' }); return;
    }
    if (req.body.password && (typeof req.body.password !== 'string' || req.body.password.length < 12)) {
      res.status(400).json({ error: 'La contraseña debe tener al menos 12 caracteres.' }); return;
    }
    await auth.updateUser(target.id, { email: proposed.email, displayName: proposed.name,
      ...(req.body.password ? { password: req.body.password } : {}) });
    if (req.body.password) await auth.revokeRefreshTokens(target.id);
    await db.doc(`users/${target.id}`).update({ ...updates, password: FieldValue.delete() });
    res.json({ user: publicProfile(proposed) });
  } catch {
    res.status(400).json({ error: 'No se pudo actualizar la cuenta. Verifica los datos e intenta nuevamente.' });
  }
});
accountsRouter.delete('/:id', async (req, res) => {
  try {
    const { db, auth } = adminServices();
    const target = (await db.doc(`users/${req.params.id}`).get()).data();
    if (!target || !canManageUser(res.locals.profile, target) || target.id === res.locals.profile.id) {
      res.status(403).json({ error: 'No puedes eliminar esta cuenta.' }); return;
    }
    // Deny through both Auth and profile before acknowledging revocation.
    await auth.updateUser(target.id, { disabled: true });
    await auth.revokeRefreshTokens(target.id);
    await db.doc(`users/${target.id}`).delete();
    res.json({ success: true });
  } catch {
    res.status(400).json({ error: 'No se pudo revocar la cuenta.' });
  }
});
