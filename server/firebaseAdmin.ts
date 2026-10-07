import { cert, getApps, initializeApp } from 'firebase-admin/app';
export function getAdminApp() {
  if (getApps().length) return getApps()[0];
  const projectId = process.env.FIREBASE_PROJECT_ID || 'mi-erp-nube';
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (encoded) {
    let account: Record<string, string>;
    try { account = JSON.parse(encoded); } catch { throw new Error('La credencial privada del servidor no contiene JSON válido.'); }
    if (account.project_id !== projectId || !account.client_email || !account.private_key) throw new Error('La credencial del servidor no corresponde al proyecto Firebase.');
    return initializeApp({ projectId, credential: cert({ projectId, clientEmail: account.client_email, privateKey: account.private_key }) });
  }
  return initializeApp({ projectId });
}
