import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export async function addVisitor(visitor) {
  const col = collection(db, 'visitors');
  try {
    console.log('[Firestore] Adding visitor:', visitor);
    const docRef = await addDoc(col, visitor);
    // also store the generated id inside the document for easy reads
    try {
      await updateDoc(doc(db, 'visitors', docRef.id), { id: docRef.id });
    } catch (e) {
      // non-fatal: if update fails, still return id
      console.warn('[Firestore] Failed to write id into document', e);
    }
    console.log('[Firestore] Successfully created document:', docRef.id);
    return docRef.id;
  } catch (err) {
    console.error('[Firestore] Error adding visitor:', err);
    throw err;
  }
}

export async function getVisitors() {
  try {
    console.log('[Firestore] Attempting to fetch visitors with orderBy timestamp...');
    const q = query(collection(db, 'visitors'), orderBy('timestamp', 'desc'));
    const snap = await getDocs(q);
    console.log('[Firestore] Successfully fetched', snap.docs.length, 'visitors with orderBy');
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    // If orderBy fails (e.g., some documents lack 'timestamp'), fetch without ordering
    console.warn('[Firestore] orderBy timestamp failed:', err.message);
    console.log('[Firestore] Trying fallback: fetching all visitors without ordering...');
    try {
      const snap = await getDocs(collection(db, 'visitors'));
      console.log('[Firestore] Successfully fetched', snap.docs.length, 'visitors without orderBy');
      const sorted = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA; // descending order
      });
      return sorted;
    } catch (fallbackErr) {
      console.error('[Firestore] CRITICAL ERROR - Failed to fetch visitors:', fallbackErr);
      throw fallbackErr;
    }
  }
}

export function listenVisitorsRealtime(cb) {
  console.log('[Firestore] Setting up real-time listener for visitors...');
  
  try {
    const q = query(collection(db, 'visitors'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log('[Firestore] Real-time update received:', data.length, 'visitors');
        cb(data);
      },
      (err) => {
        console.warn('[Firestore] Real-time query error (trying fallback):', err.message);
        // Fallback: fetch without ordering
        console.log('[Firestore] Setting up fallback real-time listener without orderBy...');
        try {
          const unsubFallback = onSnapshot(
            collection(db, 'visitors'),
            (snap) => {
              const sorted = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => {
                const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                return timeB - timeA;
              });
              console.log('[Firestore] Fallback real-time update received:', sorted.length, 'visitors');
              cb(sorted);
            },
            (fallbackErr) => {
              console.error('[Firestore] CRITICAL ERROR - Fallback listener also failed:', fallbackErr.message);
            }
          );
          return unsubFallback;
        } catch (setupErr) {
          console.error('[Firestore] Error setting up fallback listener:', setupErr);
          cb([]); // Return empty array
        }
      }
    );
    return unsub;
  } catch (err) {
    console.error('[Firestore] Error setting up real-time listener:', err);
    // Return a no-op unsubscribe function
    return () => {};
  }
}

export async function updateVisitor(id, changes) {
  const ref = doc(db, 'visitors', id);
  await updateDoc(ref, changes);
}

export async function deleteVisitor(id) {
  const ref = doc(db, 'visitors', id);
  await deleteDoc(ref);
}

// Record visitor attendance (scan-in event)
export async function recordAttendance(visitorId, visitorName, scanDate, scanTime) {
  const col = collection(db, 'attendance');
  try {
    console.log('[Firestore] Recording attendance for:', visitorId, visitorName, scanDate, scanTime);
    const attendanceRecord = {
      visitorId: visitorId,
      visitorName: visitorName,
      scanDate: scanDate, // Format: MM-DD-YY
      scanTime: scanTime, // Format: HH:MM:SS AM/PM
      timestamp: new Date().toISOString(),
      recordedAt: new Date()
    };
    
    const docRef = await addDoc(col, attendanceRecord);
    console.log('[Firestore] Attendance recorded successfully:', docRef.id);
    return docRef.id;
  } catch (err) {
    console.error('[Firestore] Error recording attendance:', err);
    throw err;
  }
}

// Get attendance records for a specific date
export async function getAttendanceByDate(date) {
  try {
    console.log('[Firestore] Fetching attendance records for date:', date);
    const q = query(
      collection(db, 'attendance'),
      orderBy('scanTime', 'asc')
    );
    const snap = await getDocs(q);
    
    // Filter records by date
    const recordsForDate = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(record => record.scanDate === date);
    
    console.log('[Firestore] Found', recordsForDate.length, 'attendance records for date:', date);
    return recordsForDate;
  } catch (err) {
    console.warn('[Firestore] Error fetching attendance records:', err.message);
    // Fallback: fetch all without orderBy
    try {
      const snap = await getDocs(collection(db, 'attendance'));
      const recordsForDate = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(record => record.scanDate === date)
        .sort((a, b) => {
          const timeA = a.scanTime || '';
          const timeB = b.scanTime || '';
          return timeA.localeCompare(timeB);
        });
      console.log('[Firestore] Fallback: Found', recordsForDate.length, 'attendance records for date:', date);
      return recordsForDate;
    } catch (fallbackErr) {
      console.error('[Firestore] Failed to fetch attendance records:', fallbackErr);
      return [];
    }
  }
}

// Get all attendance records
export async function getAllAttendance() {
  try {
    console.log('[Firestore] Fetching all attendance records...');
    const q = query(collection(db, 'attendance'), orderBy('recordedAt', 'desc'));
    const snap = await getDocs(q);
    console.log('[Firestore] Found', snap.docs.length, 'total attendance records');
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('[Firestore] orderBy failed, trying fallback:', err.message);
    try {
      const snap = await getDocs(collection(db, 'attendance'));
      const sorted = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const timeA = a.recordedAt ? new Date(a.recordedAt).getTime() : 0;
          const timeB = b.recordedAt ? new Date(b.recordedAt).getTime() : 0;
          return timeB - timeA;
        });
      console.log('[Firestore] Fallback: Found', sorted.length, 'total attendance records');
      return sorted;
    } catch (fallbackErr) {
      console.error('[Firestore] Failed to fetch all attendance records:', fallbackErr);
      return [];
    }
  }
}

export default null;
