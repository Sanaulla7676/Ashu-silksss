import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, firebaseReady } from '../firebase';

export async function getThemeSettings() {
  if (!firebaseReady) return null;
  const snap = await getDoc(doc(db, 'settings', 'theme'));
  return snap.exists() ? snap.data() : null;
}

export async function saveThemeSettings(theme) {
  if (!firebaseReady) throw new Error('Firebase is not configured.');
  await setDoc(doc(db, 'settings', 'theme'), { ...theme, updatedAt: serverTimestamp() });
}
