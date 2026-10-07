import { auth } from './firebase';

export async function authenticatedFetch(url: string, options: RequestInit) {
  if (!auth.currentUser) throw new Error('Inicia sesión para completar esta operación.');
  const token = await auth.currentUser.getIdToken();
  return fetch(url, { ...options, headers: { ...options.headers, Authorization: `Bearer ${token}` } });
}
