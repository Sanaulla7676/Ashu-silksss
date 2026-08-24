import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { app, firebaseReady } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(firebaseReady);

  useEffect(() => {
    if (!firebaseReady || !app) {
      setLoading(false);
      return undefined;
    }
    const auth = getAuth(app);
    return onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
      setLoading(false);
    });
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    firebaseReady,
    async signIn(email, password) {
      if (!firebaseReady || !app) throw new Error('Firebase authentication is not configured.');
      return signInWithEmailAndPassword(getAuth(app), email, password);
    },
    async signUp(name, email, password) {
      if (!firebaseReady || !app) throw new Error('Firebase authentication is not configured.');
      const credential = await createUserWithEmailAndPassword(getAuth(app), email, password);
      if (name) await updateProfile(credential.user, { displayName: name });
      return credential;
    },
    async logout() {
      if (firebaseReady && app) await signOut(getAuth(app));
      setUser(null);
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
