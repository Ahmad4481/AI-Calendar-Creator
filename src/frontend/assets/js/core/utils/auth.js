import { auth, UserService } from '../firebase/index.js';
import { STORAGE_KEYS, APP_CONSTANTS, ROUTES } from './constants.js';

// Authentication utilities
export class AuthManager {
  constructor() {
    this.userService = new UserService();
  }

  getCurrentUser() {
    return auth.currentUser;
  }

  getCachedUser() {
    const cached = localStorage.getItem(STORAGE_KEYS.CACHED_USER);
    if (!cached) return null;
    
    try {
      const parsed = JSON.parse(cached);
      return parsed?.uid ? parsed : null;
    } catch {
      localStorage.removeItem(STORAGE_KEYS.CACHED_USER);
      return null;
    }
  }

  persistUser(user) {
    if (!user) return;
    const snapshot = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    };
    localStorage.setItem(STORAGE_KEYS.CACHED_USER, JSON.stringify(snapshot));
  }

  clearUser() {
    localStorage.removeItem(STORAGE_KEYS.CACHED_USER);
    localStorage.removeItem(STORAGE_KEYS.LOGIN_TIMESTAMP);
  }

  isSessionValid() {
    const loginTimestamp = parseInt(localStorage.getItem(STORAGE_KEYS.LOGIN_TIMESTAMP) || '0', 10);
    if (!loginTimestamp) return false;
    
    const sessionAge = Date.now() - loginTimestamp;
    return sessionAge < APP_CONSTANTS.SESSION_MAX_AGE_MS;
  }

  saveLoginTimestamp() {
    localStorage.setItem(STORAGE_KEYS.LOGIN_TIMESTAMP, Date.now().toString());
  }

  async checkAuth() {
    // Wait for Firebase auth state to initialize
    return new Promise((resolve) => {
      // Check immediately if auth is already initialized
      const currentUser = this.getCurrentUser();
      if (currentUser) {
        this.persistUser(currentUser);
        this.saveLoginTimestamp();
        resolve(currentUser);
        return;
      }
      console.log('no current user');

      // Wait for auth state change (Firebase may not be ready yet)
      let resolved = false;
      const unsubscribe = this.userService.onAuthStateChanged((user) => {
        if (resolved) return;
        resolved = true;
        unsubscribe();

        if (user) {
          // Firebase user exists, persist and update timestamp
          this.persistUser(user);
          this.saveLoginTimestamp();
          resolve(user);
        } else {
          // No Firebase user, check cached user only if session is valid
          if (this.isSessionValid()) {
            const cachedUser = this.getCachedUser();
            if (cachedUser?.uid) {
              resolve(cachedUser);
            } else {
              resolve(null);
            }
          } else {
            // Session expired and no Firebase user, clear cache
            this.clearUser();
            resolve(null);
          }
        }
      });

      // Timeout after 1 second if auth state doesn't change
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          unsubscribe();
          
          // Check cached user as fallback
          if (this.isSessionValid()) {
            const cachedUser = this.getCachedUser();
            if (cachedUser?.uid) {
              resolve(cachedUser);
            } else {
              resolve(null);
            }
          } else {
            this.clearUser();
            resolve(null);
          }
        }
      }, 1000);
    });
  }

  async requireAuth(redirectTo = ROUTES.INDEX) {
    const user = await this.checkAuth();
    if (!user) {
      window.location.replace(redirectTo);
      return null;
    }
    return user;
  }

  redirectToLogin() {
    // window.location.replace(ROUTES.INDEX);
    console.log('redirectToLogin');
  }

  redirectToDashboard() {
    // window.location.replace(ROUTES.DASHBOARD);
    console.log('redirectToDashboard');
  }

  onAuthStateChanged(callback) {
    return this.userService.onAuthStateChanged(callback);
  }
}

// Global instance
export const authManager = new AuthManager();

export default authManager;

