import { collection, addDoc, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db, firebaseReady } from '../firebase';

const teamRef = () => collection(db, 'team');

export async function getTeamMembers() {
  if (!firebaseReady) return [];
  const snap = await getDocs(query(teamRef(), orderBy('addedAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addTeamMember(member) {
  if (!firebaseReady) throw new Error('Firebase is not configured.');
  const ref = await addDoc(teamRef(), { ...member, addedAt: serverTimestamp() });
  return { id: ref.id, ...member };
}

export async function removeTeamMember(id) {
  if (!firebaseReady) throw new Error('Firebase is not configured.');
  await deleteDoc(doc(db, 'team', id));
}
