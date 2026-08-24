import { collection, getDocs, orderBy, query, updateDoc, doc } from 'firebase/firestore';
import { db, firebaseReady } from '../firebase';
export async function getAllOrders(){if(!firebaseReady)return [];const snap=await getDocs(query(collection(db,'orders'),orderBy('createdAt','desc')));return snap.docs.map(d=>({id:d.id,...d.data()}));}
export async function updateOrderStatusAdmin(id,status){if(!firebaseReady)throw new Error('Firebase is not configured.');await updateDoc(doc(db,'orders',id),{status,updatedAt:new Date()});}
export async function getAllEnquiries(){if(!firebaseReady)return [];const snap=await getDocs(query(collection(db,'enquiries'),orderBy('createdAt','desc')));return snap.docs.map(d=>({id:d.id,...d.data()}));}
