import {
  collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc,
} from 'firebase/firestore';
import { db, firebaseReady } from '../firebase';

function requireFirebase() {
  if (!firebaseReady || !db) throw new Error('Firebase is not configured. The admin cannot verify records until the database connection is available.');
}

export async function getAllOrders() {
  requireFirebase();
  const snapshot = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
  return snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
}

export async function updateOrderStatusAdmin(id, status) {
  requireFirebase();
  const allowed = new Set(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']);
  if (!id || !allowed.has(String(status || '').toLowerCase())) throw new Error('Choose a valid order and status.');
  await updateDoc(doc(db, 'orders', id), {
    status: String(status).toLowerCase(),
    updatedAt: serverTimestamp(),
  });
}

export async function getAllEnquiries() {
  requireFirebase();
  const snapshot = await getDocs(query(collection(db, 'enquiries'), orderBy('createdAt', 'desc')));
  return snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
}


export async function updateEnquiryStatusAdmin(id, status) {
  requireFirebase();
  const allowed = new Set(['new', 'contacted', 'resolved', 'spam']);
  const normalized = String(status || '').toLowerCase();
  if (!id || !allowed.has(normalized)) throw new Error('Choose a valid enquiry and status.');
  await updateDoc(doc(db, 'enquiries', id), {
    status: normalized,
    updatedAt: serverTimestamp(),
  });
}
