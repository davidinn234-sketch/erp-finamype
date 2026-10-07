import type { RequestHandler } from 'express';
import { adminServices } from './firebaseAdmin';

// Read the profile on every request: deleted/reassigned accounts lose access immediately.
export const requireSession: RequestHandler = async (req, res, next) => {
  const token = req.headers.authorization?.match(/^Bearer (\S+)$/)?.[1];
  if (!token) { res.status(401).json({ error: 'Inicia sesión para continuar.' }); return; }
  try {
    const { auth, db } = adminServices();
    const decoded = await auth.verifyIdToken(token, true);
    const profile = (await db.doc(`users/${decoded.uid}`).get()).data();
    if (!profile || profile.id !== decoded.uid || profile.disabled === true) {
      res.status(403).json({ error: 'Tu cuenta no tiene acceso al ERP.' }); return;
    }
    res.locals.profile = profile;
    next();
  } catch {
    res.status(401).json({ error: 'No se pudo validar la sesión. Inicia sesión nuevamente.' });
  }
};

export function rateLimit(limit: number, windowMs: number, byUser = true): RequestHandler {
  const buckets = new Map<string, { count: number; until: number }>();
  return (req, res, next) => {
    const now = Date.now();
    for (const [key, value] of buckets) if (value.until <= now) buckets.delete(key);
    const key = byUser ? res.locals.profile?.id : req.ip;
    if (!key) { res.status(401).json({ error: 'Sesión requerida.' }); return; }
    const bucket = buckets.get(key) || { count: 0, until: now + windowMs };
    if (bucket.count >= limit || (!buckets.has(key) && buckets.size >= 10000)) {
      res.setHeader('Retry-After', Math.ceil((bucket.until - now) / 1000));
      res.status(429).json({ error: 'Demasiadas solicitudes. Intenta más tarde.' }); return;
    }
    bucket.count++;
    buckets.set(key, bucket);
    next();
  };
}

export function canManageUser(actor: any, target: any): boolean {
  if (actor.role === 'admin_maestro') return true;
  return actor.role === 'gerente' && !!actor.companyId &&
    actor.companyId === target.companyId && target.role !== 'admin_maestro';
}

export function publicProfile(value: Record<string, any>) {
  const { password, ...profile } = value;
  return profile;
}
