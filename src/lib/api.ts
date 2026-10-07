import { auth } from './firebase';

export async function authenticatedFetch(url: string, init: RequestInit = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error('Inicia sesión para continuar.');
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${await user.getIdToken()}`);
  return fetch(url, { ...init, headers });
}

export async function accountRequest(path: string, body?: unknown, method = 'POST') {
  const response = await authenticatedFetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'No se pudo guardar la cuenta.');
  return result;
}
