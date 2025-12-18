import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

/**
 * Diagnostic function to test Firestore connection
 * Run this from browser console: await window.firestoreDiagnostic()
 */
export async function firestoreDiagnostic() {
  console.log('='.repeat(50));
  console.log('FIRESTORE DIAGNOSTIC TEST');
  console.log('='.repeat(50));

  try {
    console.log('1. Testing db object...');
    console.log('db object:', db);
    console.log('✓ DB initialized successfully');

    console.log('\n2. Testing connection to Firestore...');
    const visitorsCol = collection(db, 'visitors');
    console.log('✓ Collection reference created:', visitorsCol);

    console.log('\n3. Attempting to fetch data...');
    const snap = await getDocs(visitorsCol);
    console.log(`✓ Successfully fetched ${snap.docs.length} documents`);

    if (snap.docs.length === 0) {
      console.warn('⚠️ WARNING: No documents found in visitors collection!');
      console.log('This could mean:');
      console.log('  - The collection is empty');
      console.log('  - Security rules block read access');
      console.log('  - Collection does not exist');
    } else {
      console.log('\n4. Document data:');
      snap.docs.forEach((doc, idx) => {
        console.log(`  Document ${idx + 1}:`, {
          id: doc.id,
          data: doc.data()
        });
      });
    }

    console.log('\n' + '='.repeat(50));
    console.log('DIAGNOSTIC COMPLETE');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ DIAGNOSTIC FAILED:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
  }
}

// Make it available globally
window.firestoreDiagnostic = firestoreDiagnostic;

export default firestoreDiagnostic;
