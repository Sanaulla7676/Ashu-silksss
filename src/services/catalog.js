import {
  collection, addDoc, deleteDoc, doc, getDocs, orderBy, query,
  serverTimestamp, updateDoc,
} from 'firebase/firestore';
import { db, firebaseReady } from '../firebase';
import { STATIC_IMPORT_PRODUCTS } from '../data/static-import-products';
import { LATEST_PHOTO_PRODUCTS } from '../data/latest-photo-drop';
import { mergeCatalogueProducts } from './catalogueMerge';
import { mediaUrls } from '../utils';

const productsRef = () => {
  if (!firebaseReady || !db) throw new Error('Firebase is not configured. Add the existing VITE_FIREBASE_* project variables to the deployment environment.');
  return collection(db, 'products');
};

export async function getCatalogProducts() {
  const snapshot = await getDocs(query(productsRef(), orderBy('createdAt', 'desc')));
  return snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
}

export async function getAdminCatalogProducts() {
  const stored = await getCatalogProducts();
  return mergeCatalogueProducts(stored, [...STATIC_IMPORT_PRODUCTS, ...LATEST_PHOTO_PRODUCTS]);
}

async function assertUniqueSku(sku, excludeId) {
  const cleaned = String(sku || '').trim();
  if (!cleaned) return;
  const snapshot = await getDocs(productsRef());
  const collision = snapshot.docs.find(item =>
    item.id !== excludeId &&
    String(item.data()?.sku || '').trim().toLowerCase() === cleaned.toLowerCase()
  );
  if (collision) {
    const error = new Error('SKU "' + cleaned + '" is already used by another product.');
    error.code = 'duplicate-sku';
    throw error;
  }
}

function persistablePayload(product) {
  const data = { ...product };
  delete data.id;
  delete data.isStaticFallback;
  delete data.isFallbackProduct;
  if (Object.prototype.hasOwnProperty.call(data, 'media')) {
    data.media = mediaUrls({ media: data.media });
  }
  // Keep assigned catalogue/atlas photos as supplemental product views.
  // Uploading new photos must not silently erase an existing gallery.
  delete data.imagePending;
  return data;
}

export async function createCatalogProduct(product) {
  const payload = persistablePayload(product || {});
  await assertUniqueSku(payload.sku);
  const reference = await addDoc(productsRef(), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: reference.id, ...payload };
}

export async function updateCatalogProduct(id, product) {
  if (!id) throw new Error('A product ID is required to update a record.');
  const payload = persistablePayload(product || {});
  if (Object.prototype.hasOwnProperty.call(payload, 'sku')) await assertUniqueSku(payload.sku, id);
  await updateDoc(doc(productsRef(), id), { ...payload, updatedAt: serverTimestamp() });
}

export async function deleteCatalogProduct(id) {
  if (!id) throw new Error('A product ID is required to delete a record.');
  await deleteDoc(doc(productsRef(), id));
}
