import { UserService } from "../core/firebase/index.js";
import { authManager } from "../core/utils/auth.js";
import { Validation } from "../core/utils/validation.js";
import { messageManager } from "../core/utils/messages.js";
import { FIREBASE_ERROR_MESSAGES, APP_CONSTANTS } from "../core/utils/constants.js";

const userService = new UserService();

class LoginPage {
  constructor() {
    this.tabs = null;
    this.loginForm = null;
    this.currentTab = 'login';
    this.isForgotPasswordMode = false;
    this.init();
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.tabs = document.querySelectorAll(".tab");
    this.loginForm = document.querySelector(".login-form");
    
    if (!this.tabs.length || !this.loginForm) {
      console.error('Login page: Required elements not found');
      return;
    }

    this.showLoginForm();
    this.bindEvents();
    this.checkAuthStatus();
  }

  bindEvents() {
    // Tab switching
    this.tabs.forEach((tab) => {
      tab.addEventListener("click", () => this.handleTabClick(tab));
    });

    // Form submission - use event delegation for dynamically added elements
    this.loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (this.isForgotPasswordMode) {
        this.handleForgotPassword();
      } else if (this.currentTab === 'register') {
        this.handleRegister();
      } else {
        this.handleLogin();
      }
    });

    // Forgot password link - use event delegation
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("forgot-password")) {
        e.preventDefault();
        this.showForgotPasswordForm();
      } else if (e.target.classList.contains("back-to-login")) {
        e.preventDefault();
        this.showLoginForm();
      }
    });
  }

  handleTabClick(tab) {
    this.tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    
    if (tab.id === "login") {
      this.currentTab = 'login';
      this.showLoginForm();
    } else if (tab.id === "register") {
      this.currentTab = 'register';
      this.showRegisterForm();
    }
  }

  showLoginForm() {
    this.isForgotPasswordMode = false;
    this.loginForm.innerHTML = `
      <div class="input-group">
        <label for="email">البريد الإلكتروني</label>
        <input type="email" id="email" name="email" placeholder="أدخل بريدك الإلكتروني" required>
      </div>
      <div class="input-group">
        <label for="password">كلمة المرور</label>
        <input type="password" id="password" name="password" placeholder="أدخل كلمة المرور" required>
      </div>
      <div class="input-group">
        <label class="checkbox-label">
          <input type="checkbox" id="remember">
          <span class="checkmark"></span>
          تذكرني
        </label>
      </div>
      <button type="submit" class="submit-btn">تسجيل الدخول</button>
      <div class="form-footer">
        <a href="#" class="forgot-password">نسيت كلمة المرور؟</a>
      </div>
    `;
  }

  showForgotPasswordForm() {
    this.isForgotPasswordMode = true;
    this.loginForm.innerHTML = `
      <div class="forgot-password-header">
        <h2>إعادة تعيين كلمة المرور</h2>
        <p>أدخل بريدك الإلكتروني وسنرسل لك رابط لإعادة تعيين كلمة المرور</p>
      </div>
      <div class="input-group">
        <label for="resetEmail">البريد الإلكتروني</label>
        <input type="email" id="resetEmail" name="resetEmail" placeholder="أدخل بريدك الإلكتروني" required>
      </div>
      <button type="submit" class="submit-btn">إرسال رابط إعادة التعيين</button>
      <div class="form-footer">
        <a href="#" class="back-to-login">العودة لتسجيل الدخول</a>
      </div>
    `;
  }

  showRegisterForm() {
    this.loginForm.innerHTML = `
      <div class="input-group">
        <label for="fullName">الاسم الكامل</label>
        <input type="text" id="fullName" name="fullName" placeholder="أدخل اسمك الكامل" required>
      </div>
      <div class="input-group">
        <label for="email">البريد الإلكتروني</label>
        <input type="email" id="email" name="email" placeholder="أدخل بريدك الإلكتروني" required>
      </div>
      <div class="input-group">
        <label for="password">كلمة المرور</label>
        <input type="password" id="password" name="password" placeholder="أدخل كلمة المرور" required>
      </div>
      <div class="input-group">
        <label for="confirmPassword">تأكيد كلمة المرور</label>
        <input type="password" id="confirmPassword" name="confirmPassword" placeholder="أكد كلمة المرور" required>
      </div>
      <div class="input-group">
        <label class="checkbox-label">
          <input type="checkbox" id="terms" required>
          <span class="checkmark"></span>
          أوافق على <a href="#" class="terms-link">شروط الاستخدام</a>
        </label>
      </div>
      <button type="submit" class="submit-btn">إنشاء حساب</button>
      <div class="form-footer">
        <p>لديك حساب بالفعل؟ <a href="#" class="switch-to-login">تسجيل الدخول</a></p>
      </div>
    `;

    // Switch to login link
    const switchToLogin = this.loginForm.querySelector(".switch-to-login");
    if (switchToLogin) {
      switchToLogin.addEventListener("click", (e) => {
        e.preventDefault();
        document.querySelector("#login").click();
      });
    }
  }

  async handleLogin() {
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    
    if (!emailInput || !passwordInput) {
      messageManager.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Validation
    const validation = Validation.validateForm(
      { email, password },
      {
        email: { required: true, email: true },
        password: { required: true, minLength: APP_CONSTANTS.MIN_PASSWORD_LENGTH }
      }
    );

    if (!validation.isValid) {
      messageManager.error(Object.values(validation.errors)[0]);
      return;
    }

    const submitBtn = document.querySelector(".submit-btn");
    const originalText = submitBtn.textContent;
    this.setButtonLoading(submitBtn, "جاري تسجيل الدخول...");

    try {
      const user = await userService.login(email, password);
      
      // Check if email is verified
      if (!user.emailVerified) {
        this.showEmailVerificationRequired(user, email);
        this.setButtonNormal(submitBtn, originalText);
        return;
      }
      
      authManager.saveLoginTimestamp();
      
      const userData = await userService.getUser(user.uid);
      const userName = userData?.name || user.displayName || user.email;
      
      messageManager.success(`تم تسجيل الدخول بنجاح ${userName}`);
      
      setTimeout(() => {
        authManager.redirectToDashboard();
      }, 1000);
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      messageManager.error(errorMessage);
      this.setButtonNormal(submitBtn, originalText);
    }
  }

  async handleForgotPassword() {
    const emailInput = document.getElementById("resetEmail");
    
    if (!emailInput) {
      messageManager.error("يرجى إدخال البريد الإلكتروني");
      return;
    }
    
    const email = emailInput.value.trim();

    // Validation
    const validation = Validation.validateForm(
      { email },
      {
        email: { required: true, email: true }
      }
    );

    if (!validation.isValid) {
      messageManager.error(Object.values(validation.errors)[0]);
      return;
    }

    const submitBtn = document.querySelector(".submit-btn");
    const originalText = submitBtn.textContent;
    this.setButtonLoading(submitBtn, "جاري إرسال الرسالة...");

    try {
      await userService.sendPasswordResetEmail(email);
      console.log("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني");
      messageManager.success("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني");
      
      // Show success message and option to go back
      setTimeout(() => {
        this.loginForm.innerHTML = `
          <div class="forgot-password-success">
            <div class="success-icon">✓</div>
            <h2>تم إرسال الرسالة</h2>
            <p>تم إرسال رابط إعادة تعيين كلمة المرور إلى <strong>${email}</strong></p>
            <p class="success-note">
              يرجى التحقق من بريدك الإلكتروني ومتابعة التعليمات لإعادة تعيين كلمة المرور.
              <br><br>
              <strong>⚠️ مهم:</strong> إذا لم تجد الرسالة، تحقق من:
              <br>• مجلد <strong>الرسائل غير المرغوب فيها (Spam)</strong>
              <br>• مجلد <strong>العروض الترويجية (Promotions)</strong>
            </p>
            <button type="button" class="submit-btn back-to-login-btn">العودة لتسجيل الدخول</button>
          </div>
        `;
        
        const backBtn = this.loginForm.querySelector(".back-to-login-btn");
        if (backBtn) {
          backBtn.addEventListener("click", () => {
            this.isForgotPasswordMode = false;
            this.showLoginForm();
          });
        }
      }, 500);
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      messageManager.error(errorMessage);
      this.setButtonNormal(submitBtn, originalText);
    }
  }

  async handleRegister() {
    const fullName = document.getElementById("fullName")?.value.trim();
    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value;
    const confirmPassword = document.getElementById("confirmPassword")?.value;
    const terms = document.getElementById("terms")?.checked;

    // Validation
    const validation = Validation.validateForm(
      { fullName, email, password, confirmPassword, terms },
      {
        fullName: { required: true },
        email: { required: true, email: true },
        password: { required: true, minLength: APP_CONSTANTS.MIN_PASSWORD_LENGTH },
        confirmPassword: { required: true, match: 'password' },
        terms: { required: true }
      }
    );

    if (!validation.isValid) {
      messageManager.error(Object.values(validation.errors)[0]);
      return;
    }

    const submitBtn = document.querySelector(".submit-btn");
    const originalText = submitBtn.textContent;
    this.setButtonLoading(submitBtn, "جاري إنشاء الحساب...");

    try {
      const user = await userService.registerUser({
        name: fullName,
        email,
        password,
        ai: "v1"
      });
      
      // Send email verification
      try {
        await userService.sendEmailVerification(user);
        this.showEmailVerificationMessage(email);
        this.setButtonNormal(submitBtn, originalText);
      } catch (verifyError) {
        console.error('[Register] Failed to send verification email:', verifyError);
        messageManager.warning('تم إنشاء الحساب بنجاح، لكن فشل إرسال رسالة التحقق. يمكنك إعادة إرسالها لاحقاً.');
        this.setButtonNormal(submitBtn, originalText);
      }
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      messageManager.error(errorMessage);
      this.setButtonNormal(submitBtn, originalText);
    }
  }

  getErrorMessage(error) {
    if (error.code && FIREBASE_ERROR_MESSAGES[error.code]) {
      return FIREBASE_ERROR_MESSAGES[error.code];
    }
    return error.message || "حدث خطأ غير متوقع";
  }

  setButtonLoading(button, text) {
    button.textContent = text;
    button.disabled = true;
  }

  setButtonNormal(button, text) {
    button.textContent = text;
    button.disabled = false;
  }

  showEmailVerificationMessage(email) {
    this.loginForm.innerHTML = `
      <div class="email-verification-message">
        <div class="verification-icon">✉️</div>
        <h2>تم إنشاء الحساب بنجاح</h2>
        <p>تم إرسال رسالة تحقق إلى <strong>${email}</strong></p>
        <p class="verification-note">
          يرجى التحقق من بريدك الإلكتروني والنقر على الرابط لتفعيل حسابك.
          <br><br>
          <strong>⚠️ مهم:</strong> إذا لم تجد الرسالة، تحقق من:
          <br>• مجلد <strong>الرسائل غير المرغوب فيها (Spam)</strong>
          <br>• مجلد <strong>العروض الترويجية (Promotions)</strong>
        </p>
        <div class="verification-actions">
          <button type="button" class="submit-btn resend-verification-btn" data-email="${email}">
            إعادة إرسال رسالة التحقق
          </button>
          <button type="button" class="submit-btn secondary-btn back-to-login-from-verify">
            العودة لتسجيل الدخول
          </button>
        </div>
      </div>
    `;
    
    // Bind events
    const resendBtn = this.loginForm.querySelector(".resend-verification-btn");
    const backBtn = this.loginForm.querySelector(".back-to-login-from-verify");
    
    if (resendBtn) {
      resendBtn.addEventListener("click", async () => {
        const email = resendBtn.dataset.email;
        this.resendVerificationEmail(email, resendBtn);
      });
    }
    
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        this.showLoginForm();
      });
    }
  }

  showEmailVerificationRequired(user, email) {
    this.loginForm.innerHTML = `
      <div class="email-verification-required">
        <div class="verification-icon warning">⚠️</div>
        <h2>البريد الإلكتروني غير مفعّل</h2>
        <p>يجب تفعيل بريدك الإلكتروني قبل تسجيل الدخول.</p>
        <p class="verification-note">
          لم يتم تفعيل البريد الإلكتروني <strong>${email}</strong> بعد.
          <br>
          يرجى التحقق من بريدك الإلكتروني والنقر على رابط التفعيل.
        </p>
        <div class="verification-actions">
          <button type="button" class="submit-btn resend-verification-btn" data-user-id="${user.uid}">
            إعادة إرسال رسالة التحقق
          </button>
          <button type="button" class="submit-btn secondary-btn back-to-login-from-verify">
            العودة لتسجيل الدخول
          </button>
        </div>
      </div>
    `;
    
    // Bind events
    const resendBtn = this.loginForm.querySelector(".resend-verification-btn");
    const backBtn = this.loginForm.querySelector(".back-to-login-from-verify");
    
    if (resendBtn) {
      resendBtn.addEventListener("click", async () => {
        await this.resendVerificationForUser(user, resendBtn);
      });
    }
    
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        this.showLoginForm();
      });
    }
  }

  async resendVerificationEmail(email, button) {
    if (!button) return;
    
    const originalText = button.textContent;
    this.setButtonLoading(button, "جاري الإرسال...");
    
    try {
      // Get current user from authManager
      const currentUser = authManager.getCurrentUser();
      
      if (currentUser && currentUser.email === email) {
        await userService.sendEmailVerification(currentUser);
        messageManager.success("تم إعادة إرسال رسالة التحقق بنجاح. يرجى التحقق من بريدك الإلكتروني.");
      } else {
        messageManager.error("يجب تسجيل الدخول أولاً لإعادة إرسال رسالة التحقق");
      }
    } catch (error) {
      console.error('[Resend Verification] Error:', error);
      const errorMessage = this.getErrorMessage(error);
      messageManager.error(errorMessage);
    } finally {
      this.setButtonNormal(button, originalText);
    }
  }

  async resendVerificationForUser(user, button) {
    if (!button || !user) return;
    
    const originalText = button.textContent;
    this.setButtonLoading(button, "جاري الإرسال...");
    
    try {
      await userService.sendEmailVerification(user);
      messageManager.success("تم إعادة إرسال رسالة التحقق بنجاح. يرجى التحقق من بريدك الإلكتروني.");
    } catch (error) {
      console.error('[Resend Verification] Error:', error);
      const errorMessage = this.getErrorMessage(error);
      messageManager.error(errorMessage);
    } finally {
      this.setButtonNormal(button, originalText);
    }
  }

  async checkAuthStatus() {
    // Prevent multiple redirects
    if (sessionStorage.getItem('auth_redirecting')) {
      sessionStorage.removeItem('auth_redirecting');
      return;
    }

    try {
      // Only check Firebase auth state, not cached user
      const currentUser = authManager.getCurrentUser();
      
      if (currentUser && currentUser.emailVerified) {
        // User is authenticated with Firebase, redirect to dashboard
        sessionStorage.setItem('auth_redirecting', 'true');
        authManager.redirectToDashboard();
        return;
      }

      // Wait for auth state to initialize (max 2 seconds)
      const user = await Promise.race([
        authManager.checkAuth(),
        new Promise(resolve => setTimeout(() => resolve(null), 2000))
      ]);

      if (user && user.emailVerified !== false) {
        // Double-check this is a real Firebase user, not just cached
        const firebaseUser = authManager.getCurrentUser();
        if (firebaseUser) {
          sessionStorage.setItem('auth_redirecting', 'true');
          authManager.redirectToDashboard();
          return;
        }
      }

      // No valid user, clear any stale cache
      authManager.clearUser();
    } catch (error) {
      console.warn('[Login] Auth check error:', error);
      authManager.clearUser();
    }
  }
}

// Initialize
const loginPage = new LoginPage();

export default LoginPage;
