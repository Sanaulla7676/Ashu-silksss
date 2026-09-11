import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, firebaseReady } from '../firebase';

// The categories the shop started with, used until the owner saves their own.
export const FALLBACK_CATEGORIES = [
  'Kanjeevaram Silk',
  'Mysore Silk',
  'Bridal',
  'Designer',
  'Cotton',
  'Handloom Cotton Ilkal',
  'Tissue Silk',
];

export async function getCategorySettings() {
  if (!firebaseReady) return null;
  const snap = await getDoc(doc(db, 'settings', 'categories'));
  const list = snap.exists() ? snap.data()?.list : null;
  return Array.isArray(list) && list.length ? list : null;
}

export async function saveCategorySettings(list) {
  if (!firebaseReady) throw new Error('Firebase is not configured.');
  await setDoc(doc(db, 'settings', 'categories'), { list, updatedAt: serverTimestamp() });
}
