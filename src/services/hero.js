import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, firebaseReady } from '../firebase';

export async function getHeroSettings() {
  if (!firebaseReady) return null;
  const snap = await getDoc(doc(db, 'settings', 'hero'));
  return snap.exists() ? snap.data() : null;
}

export async function saveHeroSettings(hero) {
  if (!firebaseReady) throw new Error('Firebase is not configured.');
  await setDoc(doc(db, 'settings', 'hero'), { ...hero, updatedAt: serverTimestamp() });
}
