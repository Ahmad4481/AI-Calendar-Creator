import { SettingsService, UserService, CalendarAI } from "../core/firebase/index.js";
import { authManager } from "../core/utils/auth.js";
import { messageManager } from "../core/utils/messages.js";

/**
 * Settings Page - صفحة التفضيلات
 */
class SettingsPage {
  constructor() {
    this.settingsService = new SettingsService();
    this.userService = new UserService();
    this.calendarAI = new CalendarAI();
    this.currentUser = null;

    this.formData = {
      unavailableTimes: [],
      goals: [],
      fixedTasks: [],
      personalInfo: {},
      aiQuestions: {} 
    };

    this.generatedQuestions = []; 
    
    this.init();
  }

  async init() {
    const user = await authManager.checkAuth();
    if (!user) {
      window.location.href = '/pages/index.html';
      return;
    }
    this.currentUser = user;
    await this.setUserInfo();
    await this.loadSettings();
    this.bindEvents();
  }

  async setUserInfo() {
    const userDoc = await this.userService.getUser(this.currentUser.uid);
    document.getElementById('userName').textContent = userDoc?.name || this.currentUser.displayName || 'مستخدم';
    document.getElementById('userEmail').textContent = this.currentUser.email || '';
  }

  async loadSettings() {
    try {
      const settings = await this.settingsService.getPreferencesCalendar(this.currentUser.uid);
      if (settings) {
        this.formData = {
          unavailableTimes: settings.unavailableTimes || [],
          goals: settings.goals || [],
          fixedTasks: settings.fixedTasks || [],
          personalInfo: settings.personalInfo || {},
          aiQuestions: settings.aiQuestions || {}
        };
        
        // إذا كان هناك أسئلة محفوظة مسبقاً، يمكن عرضها أو عرض زر التوليد
        // سنبدأ بعرض النموذج
        this.populateForm();
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  populateForm() {
    this.renderUnavailableTimes();
      this.renderGoals();
    this.renderFixedTasks();

    // personalInfo
    const p = this.formData.personalInfo;
    if (p.userType) {
      const r = document.querySelector(`input[name="userType"][value="${p.userType}"]`);
      if (r) r.checked = true;
    }
    if (p.sleepTime) document.getElementById('sleepTime').value = p.sleepTime;
    if (p.calendarDensity) document.getElementById('calendarDensity').value = p.calendarDensity;

    // إذا كانت هناك إجابات محفوظة، قد نرغب في عرضها، لكن بما أن الأسئلة ديناميكية
    // سنعتمد على إعادة التوليد أو عرض الإجابات المحفوظة كنص (تحسين مستقبلي)
  }

  bindEvents() {
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
      await this.userService.logout();
      window.location.href = '/pages/index.html';
    });

    document.getElementById('addUnavailableTime')?.addEventListener('click', () => this.addUnavailableTime());
    document.getElementById('addGoal')?.addEventListener('click', () => this.addGoal());
    document.getElementById('addFixedTask')?.addEventListener('click', () => this.addFixedTask());
    
    // زر توليد الأسئلة
    document.getElementById('generateQuestionsBtn')?.addEventListener('click', () => this.generateQuestions());
    
    document.getElementById('settingsForm')?.addEventListener('submit', (e) => this.handleSave(e));
  }

  // ========================
  // 1. Unavailable Times
  // ========================
  addUnavailableTime() {
    const startTime = document.getElementById('unavailStartTime').value;
    const endTime = document.getElementById('unavailEndTime').value;
    const days = Array.from(document.querySelectorAll('#unavailDays input:checked')).map(cb => cb.value);
    const reason = document.getElementById('unavailReason').value.trim();

    if (!startTime || !endTime || days.length === 0) {
      messageManager.error('حدد الوقت والأيام');
      return;
    }

    this.formData.unavailableTimes.push({ startTime, endTime, days, reason });
    this.renderUnavailableTimes();
    document.getElementById('unavailReason').value = '';
    document.querySelectorAll('#unavailDays input').forEach(cb => cb.checked = false);
  }

  renderUnavailableTimes() {
    const container = document.getElementById('unavailableTimesList');
    if (!container) return;
    if (this.formData.unavailableTimes.length === 0) { container.innerHTML = ''; return; }

    container.innerHTML = this.formData.unavailableTimes.map((item, i) => `
      <div class="item-card">
        <div class="item-info">
          <span class="item-time">${item.startTime} - ${item.endTime}</span>
          <span class="item-days">${this.formatDays(item.days)}</span>
          ${item.reason ? `<span class="item-reason">${item.reason}</span>` : ''}
        </div>
        <button type="button" class="item-remove" data-index="${i}" data-type="unavail"><i class="fa-solid fa-trash"></i></button>
      </div>
    `).join('');

    container.querySelectorAll('.item-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        this.formData.unavailableTimes.splice(parseInt(btn.dataset.index), 1);
        this.renderUnavailableTimes();
      });
    });
  }

  // ========================
  // 2. Goals
  // ========================
  addGoal() {
    const name = document.getElementById('goalName').value.trim();
    const description = document.getElementById('goalDescription').value.trim();
    const deadline = document.getElementById('goalDeadline').value;
    const estimatedHours = parseInt(document.getElementById('goalHours').value) || null;
    const priority = document.getElementById('goalPriority').value;

    if (!name) {
      messageManager.error('أدخل اسم الهدف');
      return;
    }

    this.formData.goals.push({ name, description, deadline, estimatedHours, priority, status: 'pending' });
    this.renderGoals();
    
    // Reset inputs
    document.getElementById('goalName').value = '';
    document.getElementById('goalDescription').value = '';
    document.getElementById('goalDeadline').value = '';
    document.getElementById('goalHours').value = '';
  }

  renderGoals() {
    const container = document.getElementById('goalsList');
    if (!container) return;
    if (this.formData.goals.length === 0) { container.innerHTML = ''; return; }

    const priorityLabel = { high: 'عالية', medium: 'متوسطة', low: 'منخفضة' };

    container.innerHTML = this.formData.goals.map((goal, i) => `
      <div class="item-card">
        <div class="item-info">
          <span class="item-name">${goal.name}</span>
          ${goal.description ? `<span class="item-desc">${goal.description}</span>` : ''}
          ${goal.deadline ? `<span class="item-deadline">📅 ${goal.deadline}</span>` : ''}
          ${goal.estimatedHours ? `<span class="item-hours">⏱️ ${goal.estimatedHours}س</span>` : ''}
          <span class="priority-${goal.priority}">${priorityLabel[goal.priority]}</span>
        </div>
        <button type="button" class="item-remove" data-index="${i}" data-type="goal"><i class="fa-solid fa-trash"></i></button>
      </div>
    `).join('');

    container.querySelectorAll('.item-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        this.formData.goals.splice(parseInt(btn.dataset.index), 1);
        this.renderGoals();
      });
    });
  }

  // ========================
  // 3. Fixed Tasks
  // ========================
  addFixedTask() {
    const name = document.getElementById('fixedTaskName').value.trim();
    const startTime = document.getElementById('fixedTaskStart').value;
    const endTime = document.getElementById('fixedTaskEnd').value;
    const days = Array.from(document.querySelectorAll('#fixedTaskDays input:checked')).map(cb => cb.value);
    const priority = document.getElementById('fixedTaskPriority').value;

    if (!name || !startTime || !endTime || days.length === 0) {
      messageManager.error('أكمل جميع الحقول');
      return;
    }

    this.formData.fixedTasks.push({ name, startTime, endTime, days, priority });
    this.renderFixedTasks();
    document.getElementById('fixedTaskName').value = '';
  }

  renderFixedTasks() {
    const container = document.getElementById('fixedTasksList');
    if (!container) return;
    if (this.formData.fixedTasks.length === 0) { container.innerHTML = ''; return; }

    const priorityLabel = { high: 'عالية', medium: 'متوسطة', low: 'منخفضة' };

    container.innerHTML = this.formData.fixedTasks.map((task, i) => `
      <div class="item-card">
        <div class="item-info">
          <span class="item-name">${task.name}</span>
          <span class="item-time">${task.startTime} - ${task.endTime}</span>
          <span class="item-days">${this.formatDays(task.days)}</span>
          <span class="priority-${task.priority}">${priorityLabel[task.priority]}</span>
        </div>
        <button type="button" class="item-remove" data-index="${i}" data-type="fixed"><i class="fa-solid fa-trash"></i></button>
      </div>
    `).join('');

    container.querySelectorAll('.item-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        this.formData.fixedTasks.splice(parseInt(btn.dataset.index), 1);
        this.renderFixedTasks();
      });
    });
  }

  // ========================
  // 4. AI Questions Generation
  // ========================
  async generateQuestions() {
    if (this.formData.goals.length === 0) {
      messageManager.warning('الرجاء إضافة أهداف أولاً لتوليد أسئلة مناسبة.');
      return;
    }

    const btn = document.getElementById('generateQuestionsBtn');
    const container = document.getElementById('aiQuestionsContainer');
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري توليد الأسئلة...';
    container.innerHTML = '';

    try {
      // إعداد البيانات للإرسال
      const personalInfo = {
        userType: document.querySelector('input[name="userType"]:checked')?.value,
        sleepTime: document.getElementById('sleepTime').value,
        calendarDensity: document.getElementById('calendarDensity').value
      };

      // استدعاء دالة الذكاء الاصطناعي
      // نرسل الأهداف والمعلومات الشخصية كـ content
      const content = JSON.stringify({
        goals: this.formData.goals,
        personalInfo: personalInfo
      });

      const result = await this.calendarAI.useAi({
        userId: this.currentUser.uid,
        type: "generate_questions",
        content: content
      });

      let questions = [];
      try {
        // محاولة استخراج JSON من النص العائد
        const text = result.answer || result.message || result;
        // البحث عن مصفوفة JSON في النص
        const jsonMatch = text.match(/\[.*\]/s);
        if (jsonMatch) {
            questions = JSON.parse(jsonMatch[0]);
        } else {
            // fallback if pure json returned
            questions = typeof text === 'object' ? text : JSON.parse(text);
        }
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        messageManager.error("حدث خطأ في معالجة رد الذكاء الاصطناعي");
        return;
      }

      if (Array.isArray(questions) && questions.length > 0) {
        this.generatedQuestions = questions;
        this.renderQuestions(questions);
        messageManager.success("تم توليد الأسئلة بنجاح!");
      } else {
        messageManager.warning("لم يتم توليد أي أسئلة. حاول مرة أخرى.");
      }

    } catch (error) {
      console.error('Error generating questions:', error);
      messageManager.error('فشل توليد الأسئلة');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> توليد أسئلة ذكية';
    }
  }

  renderQuestions(questions) {
    const container = document.getElementById('aiQuestionsContainer');
    if (!container) return;

    let html = '';
    questions.forEach(q => {
        html += `<div class="ai-question" data-id="${q.id}" data-type="${q.type}">`;
        html += `<label>${q.text}</label>`;

        if (q.type === 'choice' && q.options) {
            html += `<div class="radio-options">`;
            q.options.forEach((opt, idx) => {
                html += `
                <label>
                    <input type="radio" name="q_${q.id}" value="${opt}" ${idx === 0 ? 'checked' : ''}>
                    ${opt}
                </label>`;
            });
            html += `</div>`;
        } else if (q.type === 'boolean') {
            html += `<div class="radio-options">
                <label><input type="radio" name="q_${q.id}" value="yes"> نعم</label>
                <label><input type="radio" name="q_${q.id}" value="no" checked> لا</label>
            </div>`;
        } else {
            // text or default
            html += `<input type="text" class="form-input" name="q_${q.id}" placeholder="إجابتك...">`;
        }
        html += `</div>`;
    });

    container.innerHTML = html;
  }

  // ========================
  // Helpers
  // ========================
  formatDays(days) {
    const names = { sunday: 'أحد', monday: 'اثنين', tuesday: 'ثلاثاء', wednesday: 'أربعاء', thursday: 'خميس', friday: 'جمعة', saturday: 'سبت' };
    return days.map(d => names[d] || d).join('، ');
  }

  // ========================
  // Save
  // ========================
  async handleSave(e) {
    e.preventDefault();

    const btn = document.querySelector('.btn-save');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...';

    try {
      // personalInfo
      this.formData.personalInfo = {
        userType: document.querySelector('input[name="userType"]:checked')?.value || 'student',
        sleepTime: document.getElementById('sleepTime').value,
        calendarDensity: document.getElementById('calendarDensity').value
      };

      // Collect AI Questions Answers
      const answers = {};
      const questionDivs = document.querySelectorAll('.ai-question');
      questionDivs.forEach(div => {
        const id = div.dataset.id;
        const type = div.dataset.type;
        const name = `q_${id}`;
        
        if (type === 'choice' || type === 'boolean') {
            const checked = div.querySelector(`input[name="${name}"]:checked`);
            if (checked) answers[div.querySelector('label').innerText] = checked.value;
        } else {
            const input = div.querySelector(`input[name="${name}"]`);
            if (input && input.value) answers[div.querySelector('label').innerText] = input.value;
        }
      });
      
      this.formData.aiQuestions = answers;

      await this.settingsService.updatePreferencesCalendar(this.currentUser.uid, this.formData);
      messageManager.success('تم حفظ التفضيلات');
    } catch (error) {
      console.error('Error saving:', error);
      messageManager.error('فشل الحفظ');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-check"></i> حفظ التفضيلات';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => new SettingsPage());
