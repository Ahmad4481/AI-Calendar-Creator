import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  sendEmailVerification as firebaseSendEmailVerification,
  serverTimestamp
} from "../../firebase-exports.js";
import { auth } from "../../config.js";
import TimedCache from "../../cache.js";
import Repository from "../../Repository.js";

// ----------------------
// UserService
// - Standard Edition: Uses Firebase Client SDK Auth
// - Best balance of security and simplicity
// ----------------------
class UserService {
  constructor() {
    // Repository targets 'users' root collection
    this.repo = new Repository();
    this.cache = new TimedCache(60000);
  }

  // ----------------------------------------------------------------
  // User Document Management
  // ----------------------------------------------------------------

  // Creates a user document in Firestore using uid from Auth
  async createUserDoc(uid, { name = "", email = "", options = {} } = {}) {
      const payload = {
        name,
        email,
        createdAt: serverTimestamp(),
      ...options
      };

    // Use repository to set the document
    await this.repo.set(uid, null, payload);

    // Verify creation and cache
    const userDoc = await this.getUser(uid);
    if (!userDoc) {
        throw new Error("Document was not created in Firestore");
      }

    return userDoc;
  }

  // Get user data from Firestore by uid
  async getUser(uid) {
    return this.cache.remember(uid, async () => {
      return await this.repo.get(uid);
    });
  }

  // Update user data (partial)
  async updateUser(uid, updates = {}) {
    // Pass null as docId to indicate we are updating the user document itself
    await this.repo.update(uid, null, updates);
    
    // Invalidate cache and fetch fresh data
    this.cache.delete(uid);
    return await this.getUser(uid);
    }

  // Delete user document (does not delete Auth data)
  async deleteUserDoc(uid) {
    await this.repo.delete(uid);
    this.cache.delete(uid);
    return true;
  }

  // ----------------------------------------------------------------
  // Authentication & Registration
  // ----------------------------------------------------------------

  // Register a new user (Auth + Firestore doc)
  async registerUser({ name, email, password, ai = "v1", extra = {} }) {
    // 1. Create Auth User
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Create Firestore Document
      try {
      await this.createUserDoc(user.uid, { name, email, options: extra });
      } catch (docError) {
        console.error("[UserService] Failed to create user document:", docError);
      // Auth succeeded, but doc creation failed. 
    }

    return user;
  }

  async login(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  }

  async logout() {
    await firebaseSignOut(auth);
    this._clearLocalAuthData();
  }

  // ----------------------------------------------------------------
  // Account Recovery & Verification
  // ----------------------------------------------------------------

  async sendPasswordResetEmail(email) {
      await firebaseSendPasswordResetEmail(auth, email);
      return true;
  }

  async sendEmailVerification(user) {
    if (!user || user.emailVerified) {
      return false;
    }
        await firebaseSendEmailVerification(user);
        return true;
      }

  // ----------------------------------------------------------------
  // Auth State Listener
  // ----------------------------------------------------------------

  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  }

  // ----------------------------------------------------------------
  // Private Helpers
  // ----------------------------------------------------------------

  _clearLocalAuthData() {
    // Clear specific keys from storage
    const authKeys = [
      'cachedUser', 'loginTimestamp', 
      'events_cache_' // Clear events cache on logout
    ];
    
    Object.keys(localStorage).forEach(key => {
      if (authKeys.some(k => key.includes(k))) {
        localStorage.removeItem(key);
  }
    });
    
    // We do NOT clear firebase: keys manually anymore, 
    // let SDK handle its own cleanup to be safe.
    
    sessionStorage.clear();
  }
}

export default UserService;
