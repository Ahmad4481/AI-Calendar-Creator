// ----------------------
// Firebase Exports - جميع استيرادات Firebase من CDN
// هذا الملف يجمع جميع exports من Firebase لتقليل عدد الاستدعاءات من CDN
// ----------------------

// Firebase App
export { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";

// Firebase Auth
export {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// Firebase Firestore
export {
  getFirestore,
  enableIndexedDbPersistence,
  enableMultiTabIndexedDbPersistence, // إضافة هذا
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Firebase Functions
export {
  getFunctions,
  httpsCallable,
  connectFunctionsEmulator
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-functions.js";

