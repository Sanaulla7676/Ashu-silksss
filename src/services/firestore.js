import { collection, addDoc, doc, getDoc, getDocs, query, where, orderBy, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, firebaseReady } from '../firebase';

function requireFirebase() {
  if (!firebaseReady || !db) throw new Error('Firebase is not configured.');
}

export async function createOrder(orderData) {
  requireFirebase();
  const ordersRef = collection(db, 'orders');
  const docRef = await addDoc(ordersRef, {
    ...orderData,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: docRef.id, ...orderData };
}

export async function getOrder(orderId) {
  requireFirebase();
  const orderSnap = await getDoc(doc(db, 'orders', orderId));
  return orderSnap.exists() ? { id: orderSnap.id, ...orderSnap.data() } : null;
}

export async function getUserOrders(userId) {
  requireFirebase();
  const q = query(collection(db, 'orders'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
}

export async function updateOrderStatus(orderId, status) {
  requireFirebase();
  await updateDoc(doc(db, 'orders', orderId), { status, updatedAt: serverTimestamp() });
}

export async function createEnquiry(enquiryData) {
  requireFirebase();
  const docRef = await addDoc(collection(db, 'enquiries'), {
    ...enquiryData,
    status: 'new',
    createdAt: serverTimestamp(),
  });
  return { id: docRef.id, ...enquiryData };
}

export async function getEnquiries() {
  requireFirebase();
  const q = query(collection(db, 'enquiries'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
}
