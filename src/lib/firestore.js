import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export async function addVisitor(visitor) {
  const col = collection(db, 'visitors');
  try {
    const docRef = await addDoc(col, visitor);
    // also store the generated id inside the document for easy reads
    try {
      await updateDoc(doc(db, 'visitors', docRef.id), { id: docRef.id });
    } catch (e) {
      // non-fatal: if update fails, still return id
      console.warn('Failed to write id into document', e);
    }
    console.log('addVisitor: created document', docRef.id);
    return docRef.id;
  } catch (err) {
    console.error('addVisitor: failed to add document', err);
    throw err;
  }
}

export async function getVisitors() {
  const q = query(collection(db, 'visitors'), orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function listenVisitorsRealtime(cb) {
  const q = query(collection(db, 'visitors'), orderBy('timestamp', 'desc'));
  const unsub = onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  return unsub;
}

export async function updateVisitor(id, changes) {
  const ref = doc(db, 'visitors', id);
  await updateDoc(ref, changes);
}

export async function deleteVisitor(id) {
  const ref = doc(db, 'visitors', id);
  await deleteDoc(ref);
}

export default null;
