import { collection, addDoc, doc, getDoc, getDocs, query, where, orderBy, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, firebaseReady } from '../firebase';

// Orders
export async function createOrder(orderData) {
  if (!firebaseReady) {
    console.warn('Firebase not configured');
    return { id: 'demo-' + Date.now(), ...orderData };
  }

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
  if (!firebaseReady) return null;

  const orderRef = doc(db, 'orders', orderId);
  const orderSnap = await getDoc(orderRef);

  if (orderSnap.exists()) {
    return { id: orderSnap.id, ...orderSnap.data() };
  }
  return null;
}

export async function getUserOrders(userId) {
  if (!firebaseReady) return [];

  const ordersRef = collection(db, 'orders');
  const q = query(
    ordersRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function updateOrderStatus(orderId, status) {
  if (!firebaseReady) return;

  const orderRef = doc(db, 'orders', orderId);
  await updateDoc(orderRef, {
    status,
    updatedAt: serverTimestamp(),
  });
}

// Enquiries
export async function createEnquiry(enquiryData) {
  if (!firebaseReady) {
    console.warn('Firebase not configured');
    return { id: 'demo-' + Date.now(), ...enquiryData };
  }

  const enquiriesRef = collection(db, 'enquiries');
  const docRef = await addDoc(enquiriesRef, {
    ...enquiryData,
    status: 'new',
    createdAt: serverTimestamp(),
  });

  return { id: docRef.id, ...enquiryData };
}

export async function getEnquiries() {
  if (!firebaseReady) return [];

  const enquiriesRef = collection(db, 'enquiries');
  const q = query(enquiriesRef, orderBy('createdAt', 'desc'));

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
