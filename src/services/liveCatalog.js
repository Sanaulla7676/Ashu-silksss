import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db, firebaseReady } from '../firebase';
import { LATEST_PHOTO_PRODUCTS } from '../data/latest-photo-drop';
import { STATIC_IMPORT_PRODUCTS } from '../data/static-import-products';

export async function fetchLiveProducts() {
  let live = [];
  // Firestore records override the static fallback by SKU; a read failure must
  // never turn the public catalogue into an empty page.
  if (firebaseReady && db) {
    try {
      const snap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
      live = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .filter(p => (p.status || 'active') !== 'draft');
    } catch (error) {
      console.warn('[catalogue] Using static catalogue because Firebase could not be read.', error);
    }
  }
  const liveSkus = new Set(live.map(p => p.sku).filter(Boolean));
  const fallback = [...STATIC_IMPORT_PRODUCTS, ...LATEST_PHOTO_PRODUCTS]
    .filter(p => !p.sku || !liveSkus.has(p.sku));
  return [...fallback, ...live];
}

export async function fetchLiveProduct(id) {
  const products = await fetchLiveProducts();
  return products.find(product => product.id === id || product.sku === id) || null;
}
