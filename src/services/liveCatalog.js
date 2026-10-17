import { collection, getDocs, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db, firebaseReady } from '../firebase';
import { LATEST_PHOTO_PRODUCTS } from '../data/latest-photo-drop';
import { STATIC_IMPORT_PRODUCTS } from '../data/static-import-products';
import { mergeCatalogueProducts } from './catalogueMerge';

const fallbackProducts = () => [...STATIC_IMPORT_PRODUCTS, ...LATEST_PHOTO_PRODUCTS];
const productQuery = () => query(collection(db, 'products'), orderBy('createdAt', 'desc'));

export async function fetchLiveProducts() {
  const fallback = fallbackProducts();
  if (!firebaseReady || !db) return mergeCatalogueProducts([], fallback);
  try {
    const snapshot = await getDocs(productQuery());
    const stored = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
    return mergeCatalogueProducts(stored, fallback);
  } catch (error) {
    console.warn('[catalogue] Firestore read failed; rendering the approved fallback catalogue.', error);
    return mergeCatalogueProducts([], fallback);
  }
}

export function subscribeToLiveProducts(onProducts, onError = () => {}) {
  const fallback = fallbackProducts();
  if (!firebaseReady || !db) {
    onProducts(mergeCatalogueProducts([], fallback));
    return () => {};
  }
  return onSnapshot(productQuery(), snapshot => {
    const stored = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
    onProducts(mergeCatalogueProducts(stored, fallback));
  }, error => {
    onError(error);
    onProducts(mergeCatalogueProducts([], fallback));
  });
}

export async function fetchLiveProduct(id) {
  const products = await fetchLiveProducts();
  return products.find(product => product.id === id || product.sku === id) || null;
}
