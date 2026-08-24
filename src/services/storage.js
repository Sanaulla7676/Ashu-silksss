import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage, firebaseReady } from '../firebase';

const MAX_SIZE = 8 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export async function uploadProductImage(file, productId = 'new') {
  if (!firebaseReady || !storage) throw new Error('Firebase Storage is not configured.');
  if (!file) throw new Error('Choose an image first.');
  if (!TYPES.includes(file.type)) throw new Error('Use JPG, PNG, WEBP or AVIF images.');
  if (file.size > MAX_SIZE) throw new Error('Image must be 8 MB or smaller.');
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.-]+/g, '-');
  const path = `products/${productId}/${Date.now()}-${safeName}`;
  const objectRef = ref(storage, path);
  await uploadBytes(objectRef, file, { contentType: file.type, cacheControl: 'public,max-age=31536000,immutable' });
  return getDownloadURL(objectRef);
}

export async function deleteProductImage(url) {
  if (!storage || !url || !url.includes('firebasestorage')) return;
  try { await deleteObject(ref(storage, url)); } catch { /* old/missing asset */ }
}
