import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { UserProfile } from '../types';

const AuthSession = createContext<{ profile: UserProfile | null; ready: boolean }>({ profile: null, ready: false });
export const useAuthSession = () => useContext(AuthSession);

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState({ profile: null as UserProfile | null, ready: false });
  useEffect(() => {
    let stopProfile: (() => void) | undefined;
    let version = 0;
    const stopAuth = onAuthStateChanged(auth, (user) => {
      const generation = ++version;
      stopProfile?.();
      setSession({ profile: null, ready: !user });
      if (!user) return;
      stopProfile = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
        if (generation !== version) return;
        const profile = snapshot.data();
        if (!profile || profile.id !== user.uid || profile.disabled === true) {
          setSession({ profile: null, ready: true });
          void signOut(auth);
          return;
        }
        const { password, ...safe } = profile;
        setSession({ profile: safe as UserProfile, ready: true });
      }, () => {
        if (generation !== version) return;
        setSession({ profile: null, ready: true });
        void signOut(auth);
      });
    });
    return () => { ++version; stopAuth(); stopProfile?.(); };
  }, []);
  return <AuthSession.Provider value={session}>{children}</AuthSession.Provider>;
}
