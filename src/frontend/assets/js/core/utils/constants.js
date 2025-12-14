// Application-wide constants
export const APP_CONSTANTS = {
  CACHE_DURATION_MS: 60 * 1000,
  SESSION_MAX_AGE_MS: 24 * 60 * 60 * 1000,
  EVENT_LIMIT: 100,
  EVENT_STATUS_THRESHOLDS: { urgent: 2, low: 24 },
  URGENT_EVENT_HOURS: 24,
  MIN_PASSWORD_LENGTH: 6,
  MESSAGE_DISPLAY_DURATION: 5000
};

export const STORAGE_KEYS = {
  CACHED_USER: 'cachedUser',
  LOGIN_TIMESTAMP: 'loginTimestamp',
  CALENDARS: 'calendars',
  EVENTS_CACHE: (userId) => `events_cache_${userId}`
};

export const ROUTES = {
  INDEX: '/index.html',
  DASHBOARD: '/pages/dashborad.html',
  CALENDAR: './calendar.html'
};

export const MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export const FIREBASE_ERROR_MESSAGES = {
  // Authentication errors
  'auth/user-not-found': 'البريد الإلكتروني غير مسجل',
  'auth/wrong-password': 'كلمة المرور غير صحيحة',
  'auth/invalid-email': 'البريد الإلكتروني غير صحيح',
  'auth/email-already-in-use': 'البريد الإلكتروني مستخدم بالفعل',
  'auth/weak-password': 'كلمة المرور ضعيفة جداً. يجب أن تكون 6 أحرف على الأقل',
  'auth/too-many-requests': 'تم تجاوز عدد المحاولات المسموح بها. يرجى المحاولة لاحقاً',
  'auth/operation-not-allowed': 'طريقة التسجيل غير مفعلة. يرجى التحقق من إعدادات Firebase',
  'auth/configuration-not-found': 'طريقة تسجيل الدخول غير مفعلة. يرجى تفعيل Email/Password في Firebase Console',
  'auth/network-request-failed': 'خطأ في الاتصال بالإنترنت',
  'auth/invalid-credential': 'بيانات تسجيل الدخول غير صحيحة',
  'auth/user-disabled': 'تم تعطيل هذا الحساب',
  'auth/requires-recent-login': 'يرجى تسجيل الدخول مجدداً للمتابعة',
  'auth/expired-action-code': 'انتهت صلاحية الرابط. يرجى طلب رابط جديد',
  'auth/invalid-action-code': 'الرابط غير صالح أو تم استخدامه مسبقاً',
  
  // Firestore errors
  'permission-denied': 'ليس لديك صلاحية للكتابة. يرجى التحقق من Firebase Rules',
  'unavailable': 'الخدمة غير متاحة حالياً. يرجى المحاولة لاحقاً',
  'not-found': 'البيانات المطلوبة غير موجودة'
};

