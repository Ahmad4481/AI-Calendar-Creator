// Dashboard functionality and authentication
document.addEventListener("DOMContentLoaded", function () {
  // Tab switching functionality
  const tabs = document.querySelectorAll(".tab");
  const loginForm = document.querySelector(".login-form");

  // Initialize with login form
  showLoginForm();

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      // Remove active class from all tabs
      tabs.forEach((t) => t.classList.remove("active"));
      // Add active class to clicked tab
      this.classList.add("active");

      // Show appropriate form based on tab
      if (this.id === "login") {
        showLoginForm();
      } else if (this.id === "register") {
        showRegisterForm();
      }
    });
  });

  // Form submission handling
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    let email = document.querySelector("#email").value;
    if (isValidEmail(email)) {
      open("calendar.html","_self");
    }
  });
});

function showLoginForm() {
  const form = document.querySelector(".login-form");
  form.innerHTML = `
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

  // Re-attach event listener
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    handleLogin();
  });
}

function showRegisterForm() {
  const form = document.querySelector(".login-form");
  form.innerHTML = `
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

  // Re-attach event listener
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    handleRegister();
  });

  // Add switch to login functionality
  const switchToLogin = form.querySelector(".switch-to-login");
  if (switchToLogin) {
    switchToLogin.addEventListener("click", function (e) {
      e.preventDefault();
      document.querySelector(".tab").click();
    });
  }
}

function handleLogin() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const remember = document.getElementById("remember").checked;

  // Basic validation
  if (!email || !password) {
    showMessage("يرجى ملء جميع الحقول المطلوبة", "error");
    return;
  }

  if (!isValidEmail(email)) {
    showMessage("يرجى إدخال بريد إلكتروني صحيح", "error");
    return;
  }

  // Show loading state
  const submitBtn = document.querySelector(".submit-btn");
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "جاري تسجيل الدخول...";
  submitBtn.disabled = true;

  // Simulate API call
  setTimeout(() => {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }, 0);
}

function handleRegister() {
  const fullName = document.getElementById("fullName").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const terms = document.getElementById("terms").checked;

  // Basic validation
  if (!fullName || !email || !password || !confirmPassword) {
    showMessage("يرجى ملء جميع الحقول المطلوبة", "error");
    return;
  }

  if (!isValidEmail(email)) {
    showMessage("يرجى إدخال بريد إلكتروني صحيح", "error");
    return;
  }

  if (password.length < 6) {
    showMessage("كلمة المرور يجب أن تكون 6 أحرف على الأقل", "error");
    return;
  }

  if (password !== confirmPassword) {
    showMessage("كلمات المرور غير متطابقة", "error");
    return;
  }

  if (!terms) {
    showMessage("يجب الموافقة على شروط الاستخدام", "error");
    return;
  }

  // Show loading state
  const submitBtn = document.querySelector(".submit-btn");
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "جاري إنشاء الحساب...";
  submitBtn.disabled = true;

  // Simulate API call
  setTimeout(() => {
    // Check if user already exists (demo check)

    // Reset button
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }, 0);
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function showMessage(message, type) {
  // Remove existing messages
  const existingMessage = document.querySelector(".message");
  if (existingMessage) {
    existingMessage.remove();
  }

  // Create message element
  const messageEl = document.createElement("div");
  messageEl.className = `message message-${type}`;
  messageEl.textContent = message;

  // Add to page
  document.body.appendChild(messageEl);

  // Auto remove after 5 seconds
  setTimeout(() => {
    messageEl.style.animation = "slideOut 0.3s ease";
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.remove();
      }
    }, 300);
  }, 5000);
}

// Check if user is already logged in
function checkAuthStatus() {}

// Run auth check on page load
checkAuthStatus();
