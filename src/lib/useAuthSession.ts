import { useEffect, useState } from 'react';
import { onIdTokenChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { UserProfile } from '../types';
import { authErrorMessage } from './authService';
import { isPlatformOwner } from './accessPolicy';

export function useAuthSession() {
  const [state, setState] = useState<{ loading: boolean; profile: UserProfile | null; platformAdmin: boolean; error?: string }>({
    loading: true, profile: null, platformAdmin: false,
  });
  useEffect(() => {
    let generation = 0;
    let unsubscribeProfile: (() => void) | undefined;
    const unsubscribeAuth = onIdTokenChanged(auth, async (identity) => {
      const version = ++generation;
      unsubscribeProfile?.();
      setState(previous => identity && previous.profile?.id === identity.uid
        ? previous
        : { loading: !!identity, profile: null, platformAdmin: false });
      if (!identity) return;
      try {
        const token = await identity.getIdTokenResult();
        if (version !== generation) return;
        unsubscribeProfile = onSnapshot(doc(db, 'users', identity.uid), (snapshot) => {
          if (version !== generation) return;
          if (!snapshot.exists()) {
            setState({ loading: false, profile: null, platformAdmin: false, error: 'Tu cuenta no tiene un perfil habilitado. Pide al administrador de Fina Pyme que revise tu acceso.' });
            return;
          }
          const { password: _legacyPassword, ...data } = snapshot.data() as UserProfile;
          const platformAdmin = isPlatformOwner(identity.email, token.claims);
          setState({ loading: false, platformAdmin, profile: {
            ...data, id: identity.uid, email: identity.email || data.email,
            role: platformAdmin ? 'admin_maestro' : data.role === 'admin_maestro' ? 'gerente' : data.role,
          } });
        }, (error) => {
          if (version === generation) setState({ loading: false, profile: null, platformAdmin: false, error: authErrorMessage(error) });
        });
      } catch (error) {
        if (version === generation) setState({ loading: false, profile: null, platformAdmin: false, error: authErrorMessage(error) });
      }
    });
    return () => { generation++; unsubscribeAuth(); unsubscribeProfile?.(); };
  }, []);
  return state;
}
