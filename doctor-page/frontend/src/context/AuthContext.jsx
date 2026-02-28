import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged,
  createUserWithEmailAndPassword, updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { setTokenProvider } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [doctor, setDoctor] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDoctorProfile = useCallback(async (user) => {
    try {
      const snap = await getDoc(doc(db, 'doctors', user.uid));
      if (snap.exists()) return { uid: user.uid, email: user.email, ...snap.data() };
      const profile = {
        uid: user.uid, email: user.email,
        name: user.displayName || user.email.split('@')[0],
        specialization: 'General Practice', hospitalId: 'DEFAULT',
        createdAt: serverTimestamp(), role: 'doctor',
      };
      await setDoc(doc(db, 'doctors', user.uid), profile);
      return profile;
    } catch {
      return {
        uid: user.uid, email: user.email,
        name: user.displayName || user.email.split('@')[0],
        specialization: 'General Practice', hospitalId: 'DEFAULT', role: 'doctor',
      };
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) setDoctor(await loadDoctorProfile(user));
      else setDoctor(null);
      setLoading(false);
    });
    return unsub;
  }, [loadDoctorProfile]);

  const getToken = useCallback(async () => {
    if (!firebaseUser) return null;
    try { return await firebaseUser.getIdToken(true); } catch { return null; }
  }, [firebaseUser]);

  useEffect(() => {
    setTokenProvider(getToken);
  }, [getToken]);

  const login = async (email, password) => {
    setError(null);
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      const profile = await loadDoctorProfile(user);
      setDoctor(profile); return profile;
    } catch (err) {
      const msg = {
        'auth/user-not-found': 'No account with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/too-many-requests': 'Account temporarily locked.',
        'auth/network-request-failed': 'Network error.',
      }[err.code] || 'Login failed. Please try again.';
      setError(msg); throw new Error(msg);
    }
  };

  const register = async (email, password, name, specialization, hospitalId) => {
    setError(null);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName: name });
      const profile = {
        uid: user.uid, email, name,
        specialization: specialization || 'General Practice',
        hospitalId: hospitalId || 'DEFAULT', role: 'doctor',
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'doctors', user.uid), profile);
      setDoctor(profile); return profile;
    } catch (err) {
      const msg = {
        'auth/email-already-in-use': 'Email already registered.',
        'auth/weak-password': 'Password must be at least 6 characters.',
      }[err.code] || 'Registration failed.';
      setError(msg); throw new Error(msg);
    }
  };

  const logout = async () => { await signOut(auth); setDoctor(null); setFirebaseUser(null); };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-navy-200 border-t-navy-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading MediRx...</p>
      </div>
    </div>
  );

  return (
    <AuthContext.Provider value={{
      doctor, firebaseUser, loading, error, isAuthenticated: !!doctor,
      login, register, logout, getToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
