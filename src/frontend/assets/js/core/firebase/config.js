import { initializeApp, getAuth, getFirestore, enableMultiTabIndexedDbPersistence } from "./firebase-exports.js";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCnCVSXxViXVuAcDULcfNE8CoRK00qsaYo",
  authDomain: "calendar-builder-53b05.firebaseapp.com",
  projectId: "calendar-builder-53b05",
  storageBucket: "calendar-builder-53b05.firebasestorage.app",
  messagingSenderId: "772524694903",
  appId: "1:772524694903:web:30e82c47f84b1315fed572",
  measurementId: "G-Y23567EEGE"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// تفعيل الـ persistence مع دعم multi-tab للعمل offline
// هذا يحفظ البيانات محلياً في IndexedDB ويدعم عدة tabs في نفس الوقت
enableMultiTabIndexedDbPersistence(db)
  .then(() => {
    console.log('✅ Firebase Multi-Tab Persistence enabled successfully - Data will be cached locally');
  })
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time.
      // Fallback to single-tab persistence
      console.warn('⚠️ Firebase multi-tab persistence failed, falling back to single-tab');
      // يمكن إضافة fallback هنا إذا لزم الأمر
    } else if (err.code == 'unimplemented') {
      // The current browser does not support all of the features required for persistence
      console.warn('⚠️ Firebase persistence not supported in this browser');
    } else {
      console.error('❌ Firebase persistence error:', err);
    }
  });

export { app, auth, db };

