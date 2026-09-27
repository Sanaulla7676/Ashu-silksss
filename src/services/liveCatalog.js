import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db, firebaseReady } from '../firebase';
import { LATEST_PHOTO_PRODUCTS } from '../data/latest-photo-drop';

export async function fetchLiveProducts() {
  let live = [];
  if (firebaseReady) {
    const snap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
    live = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(p => (p.status || 'active') !== 'draft');
  }

  // Keep the latest studio drop visible immediately, while still preferring a
  // real Firebase product if the owner later creates the same SKU in admin.
  const liveSkus = new Set(live.map(p => p.sku).filter(Boolean));
  const staticDrop = LATEST_PHOTO_PRODUCTS.filter(p => !liveSkus.has(p.sku));
  return [...staticDrop, ...live];
}

export async function fetchLiveProduct(id) {
  const products = await fetchLiveProducts();
  return products.find(product => product.id === id) || null;
}
