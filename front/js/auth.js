// Authentication functionality
class AuthManager {
  constructor() {
    this.userData = null;
    this.init();
  }

  init() {
    this.loadUserData();
  }

  // Check if user is logged in
  isLoggedIn() {
    return this.userData !== null;
  }

  // Load user data from localStorage
  loadUserData() {
    const storedData = localStorage.getItem('userData');
    if (storedData) {
      this.userData = JSON.parse(storedData);
      // Check if session is still valid (24 hours)
      const loginTime = new Date(this.userData.loginTime);
      const now = new Date();
      const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
      
      if (hoursDiff >= 24) {
        // Session expired
        this.logout();
        return false;
      }
      return true;
    }
    return false;
  }

  // Save user data to localStorage
  saveUserData(userData) {
    this.userData = userData;
    localStorage.setItem('userData', JSON.stringify(userData));
  }

  // Get current user data
  getUserData() {
    return this.userData;
  }

  // Update user info in UI
  updateUserInfo() {
    if (!this.userData) return;

    const userNameEl = document.querySelector('.user-name');
    const userEmailEl = document.querySelector('.user-email');
    
    if (userNameEl) userNameEl.textContent = this.userData.name || 'المستخدم';
    if (userEmailEl) userEmailEl.textContent = this.userData.email || '';
  }

  // Logout user
  logout() {
    this.userData = null;
    localStorage.removeItem('userData');
    window.location.href = 'index.html';
  }

  // Check authentication status and redirect if needed
  checkAuthStatus() {
    if (!this.isLoggedIn()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  }
}

// Initialize auth manager
const authManager = new AuthManager();

// Export for use in other modules
window.authManager = authManager;
