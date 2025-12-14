// Validation utilities - Arabic messages
const FIELD_NAMES = {
  email: 'البريد الإلكتروني',
  password: 'كلمة المرور',
  confirmPassword: 'تأكيد كلمة المرور',
  fullName: 'الاسم الكامل',
  terms: 'الموافقة على الشروط',
  title: 'العنوان',
  date: 'التاريخ',
  startTime: 'وقت البداية',
  endTime: 'وقت النهاية',
  description: 'الوصف'
};

export const Validation = {
  getFieldName(field) {
    return FIELD_NAMES[field] || field;
  },

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidPassword(password, minLength = 6) {
    return password && password.length >= minLength;
  },

  validateForm(formData, rules) {
    const errors = {};
    
    for (const [field, rule] of Object.entries(rules)) {
      const value = formData[field];
      const fieldName = this.getFieldName(field);
      
      if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        errors[field] = rule.message || `${fieldName} مطلوب`;
        continue;
      }
      
      if (rule.email && value && !this.isValidEmail(value)) {
        errors[field] = rule.message || 'صيغة البريد الإلكتروني غير صحيحة';
        continue;
      }
      
      if (rule.minLength && value && value.length < rule.minLength) {
        errors[field] = rule.message || `${fieldName} يجب أن يكون ${rule.minLength} أحرف على الأقل`;
        continue;
      }
      
      if (rule.match && value !== formData[rule.match]) {
        errors[field] = rule.message || 'الحقول غير متطابقة';
        continue;
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};

export default Validation;

