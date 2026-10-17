import {
  doc, getDoc, onSnapshot, setDoc, serverTimestamp,
} from 'firebase/firestore';
import { db, firebaseReady } from '../firebase';

export const FALLBACK_CATEGORIES = [
  'New Arrivals', 'Festive Wear', 'Designer', 'Traditional Sarees',
  'Kanjeevaram Silk', 'Mysore Silk', 'Bridal', 'Cotton',
  'Handloom Cotton Ilkal', 'Tissue Silk',
];

export async function getCategorySettings() {
  if (!firebaseReady || !db) return null;
  const snapshot = await getDoc(doc(db, 'settings', 'categories'));
  const list = snapshot.exists() ? snapshot.data()?.list : null;
  return Array.isArray(list) && list.length ? list : null;
}

export async function saveCategorySettings(list) {
  if (!firebaseReady || !db) throw new Error('Firebase is not configured.');
  await setDoc(doc(db, 'settings', 'categories'), { list, updatedAt: serverTimestamp() }, { merge: true });
  return list;
}

export async function getCategoryImageSettings() {
  if (!firebaseReady || !db) return {};
  const snapshot = await getDoc(doc(db, 'settings', 'categoryImages'));
  const images = snapshot.exists() ? snapshot.data()?.images : null;
  return images && typeof images === 'object' && !Array.isArray(images) ? images : {};
}

export async function saveCategoryImageSettings(images) {
  if (!firebaseReady || !db) throw new Error('Firebase is not configured.');
  const cleaned = images && typeof images === 'object' && !Array.isArray(images) ? images : {};
  await setDoc(doc(db, 'settings', 'categoryImages'), { images: cleaned, updatedAt: serverTimestamp() }, { merge: true });
  return cleaned;
}

export function subscribeToCategorySettings(onChange, onError = () => {}) {
  if (!firebaseReady || !db) {
    onChange({ list: null, images: {} });
    return () => {};
  }
  let listReady = false;
  let imagesReady = false;
  let list = null;
  let images = {};
  const emit = () => { if (listReady && imagesReady) onChange({ list, images }); };
  const stopList = onSnapshot(doc(db, 'settings', 'categories'), snapshot => {
    const next = snapshot.exists() ? snapshot.data()?.list : null;
    list = Array.isArray(next) && next.length ? next : null;
    listReady = true;
    emit();
  }, error => { listReady = true; onError(error); emit(); });
  const stopImages = onSnapshot(doc(db, 'settings', 'categoryImages'), snapshot => {
    const next = snapshot.exists() ? snapshot.data()?.images : null;
    images = next && typeof next === 'object' && !Array.isArray(next) ? next : {};
    imagesReady = true;
    emit();
  }, error => { imagesReady = true; onError(error); emit(); });
  return () => { stopList(); stopImages(); };
}
