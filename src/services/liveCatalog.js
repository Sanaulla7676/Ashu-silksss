import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db, firebaseReady } from '../firebase';
import { demoProducts } from '../data';

export async function fetchLiveProducts() {
  if (!firebaseReady) return demoProducts;
  const snap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
  const live = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(p => (p.status || 'active') !== 'draft');
  return live.length ? live : demoProducts;
}

export async function fetchLiveProduct(id) {
  const products = await fetchLiveProducts();
  return products.find(product => product.id === id) || null;
}
