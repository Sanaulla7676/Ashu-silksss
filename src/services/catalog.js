import { collection, addDoc, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, firebaseReady } from '../firebase';

const productsRef = () => collection(db, 'products');
export async function getCatalogProducts() {
  if (!firebaseReady) return [];
  const snap = await getDocs(query(productsRef(), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function createCatalogProduct(product) {
  if (!firebaseReady) throw new Error('Firebase is not configured.');
  const ref = await addDoc(productsRef(), { ...product, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return { id: ref.id, ...product };
}
export async function updateCatalogProduct(id, product) {
  if (!firebaseReady) throw new Error('Firebase is not configured.');
  await updateDoc(doc(db, 'products', id), { ...product, updatedAt: serverTimestamp() });
}
export async function deleteCatalogProduct(id) {
  if (!firebaseReady) throw new Error('Firebase is not configured.');
  await deleteDoc(doc(db, 'products', id));
}
