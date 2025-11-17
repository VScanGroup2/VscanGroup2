import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB6PHti3sm1PTikYpyH9C9Ki1sNMqe_fqo",
  authDomain: "vscan-fbbb6.firebaseapp.com",
  projectId: "vscan-fbbb6",
  storageBucket: "vscan-fbbb6.firebasestorage.app",
  messagingSenderId: "1088300905840",
  appId: "1:1088300905840:web:6a63bde41a253544cc4bb5",
  measurementId: "G-NZ8PV2M3LX"
};

const app = initializeApp(firebaseConfig);

let analytics;
(async () => {
  try {
    if (await isSupported()) {
      analytics = getAnalytics(app);
    }
  } catch (e) {
    // analytics not available
  }
})();

const db = getFirestore(app);

export { app, db, analytics };
