import { Router } from 'express';
import { getAdminApp } from './firebaseAdmin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export const userAccessRouter = Router();

userAccessRouter.post('/:uid/password', async (req, res) => {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) { res.status(401).json({ error: 'Inicia sesión para administrar accesos.' }); return; }
  let app;
  try { app = getAdminApp(); } catch { res.status(503).json({ error: 'Configura las credenciales privadas de Firebase en el servidor.' }); return; }
  const auth = getAuth(app);
  let identity;
  try { identity = await auth.verifyIdToken(token, true); }
  catch { res.status(401).json({ error: 'Tu sesión no es válida. Vuelve a iniciar sesión.' }); return; }
  try {
    const db = getFirestore(app, process.env.FIRESTORE_DATABASE_ID || 'ai-studio-nexuserpsalvador-619c5a84-1f5d-4833-aee7-65b2a99f4a3b');
    const uid = req.params.uid;
    if (!uid || uid.includes('/') || uid.length > 128) { res.status(400).json({ error: 'Usuario no válido.' }); return; }
    const [caller, target] = await Promise.all([db.doc(`users/${identity.uid}`).get(), db.doc(`users/${uid}`).get()]);
    if (!caller.exists || !target.exists) { res.status(403).json({ error: 'El acceso no está disponible.' }); return; }
    const callerProfile = caller.data()!, targetProfile = target.data()!;
    const isMaster = identity.platformAdmin === true;
    const managesCompany = callerProfile.role === 'gerente' && !!callerProfile.companyId &&
      callerProfile.companyId === targetProfile.companyId;
    if (!isMaster && !managesCompany) { res.status(403).json({ error: 'Solo puedes administrar los accesos autorizados de tu empresa.' }); return; }
    const targetIdentity = await auth.getUser(uid);
    if (!isMaster && targetIdentity.customClaims?.platformAdmin === true) {
      res.status(403).json({ error: 'Solo el administrador principal puede cambiar este acceso.' }); return;
    }
    const password = req.body?.password;
    if (typeof password !== 'string' || password.length < 6 || password.length > 128) {
      res.status(400).json({ error: 'Usa una contraseña de entre 6 y 128 caracteres.' }); return;
    }
    await auth.updateUser(uid, { password });
    // No password is written to a profile, audit log, or response.
    await auth.revokeRefreshTokens(uid);
    res.json({ success: true });
  } catch (error) {
    const code = (error as { code?: string }).code;
    res.status(code === 'auth/invalid-password' ? 400 : 503).json({ error: code === 'auth/invalid-password'
      ? 'La contraseña no cumple los requisitos de Firebase.'
      : 'No se pudo actualizar el acceso. Comprueba la conexión y las credenciales del servidor.' });
  }
});
