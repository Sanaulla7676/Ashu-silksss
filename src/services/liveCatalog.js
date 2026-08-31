import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db, firebaseReady } from '../firebase';

export async function fetchLiveProducts() {
  if (!firebaseReady) return [];
  const snap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(p => (p.status || 'active') !== 'draft');
}

export async function fetchLiveProduct(id) {
  const products = await fetchLiveProducts();
  return products.find(product => product.id === id) || null;
}
