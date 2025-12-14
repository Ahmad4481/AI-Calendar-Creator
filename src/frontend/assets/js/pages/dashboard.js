import { authManager } from "../core/utils/auth.js";
import { toDate } from "../core/firebase/helpers.js";
import { UserService, EventService, CalendarAI } from "../core/firebase/index.js";
import { APP_CONSTANTS, ROUTES } from "../core/utils/constants.js";
import { messageManager } from "../core/utils/messages.js";
import EventFormManager from "../components/calendar/EventForm/EventFormManager.js";

const SELECTORS = {
  logout: ".logout-btn",
  userName: ".user-name",
  userEmail: ".user-email",
  eventsContainer: ".event-list",
  viewAllEvents: ".events-widget .widget-btn",
  // New stats selectors
  todayTasks: "#todayTasks",
  completedTasks: "#completedTasks",
  overdueTasks: "#overdueTasks",
  streakDays: "#streakDays",
  dailyRate: "#dailyRate",
  weeklyRate: "#weeklyRate",
  weeklyChart: "#weeklyChart",
  suggestionsList: "#suggestionsList",
  refreshSuggestions: "#refreshSuggestions"
};

class Dashboard {
  constructor() {
    this.userService = new UserService();
    this.eventService = new EventService();
    this.calendarAI = new CalendarAI();
    this.currentUser = null;
    this.state = { user: null, events: [], streak: 0 };
    this.cache = {
      events: null,
      eventsTimestamp: 0,
      userData: null,
      userDataTimestamp: 0
    };
    this.loadingPromises = {};
    this.eventFormManager = null;
    this.weeklyChart = null;
    this.events = [];
  }

  setState(patch) {
    this.state = { ...this.state, ...patch };
    return this.state;
  }

  getFallbackUser() {
    return {
      name: this.currentUser?.displayName || this.currentUser?.email?.split("@")[0] || "مستخدم",
      email: this.currentUser?.email || ""
    };
  }

  getUpcomingEvents() {
    return this.events.filter(event => event.startTime >= new Date());
  }

  isCacheFresh(key) {
    const timestampKey = `${key}Timestamp`;
    const lastUpdated = this.cache[timestampKey];
    return lastUpdated && Date.now() - lastUpdated < APP_CONSTANTS.CACHE_DURATION_MS;
  }

  async remember(key, loader) {
    if (this.isCacheFresh(key) && this.cache[key]) {
      return this.cache[key];
    }

    if (this.loadingPromises[key]) {
      return this.loadingPromises[key];
    }

    const promise = Promise.resolve()
      .then(loader)
      .then((result) => {
        this.cache[key] = result;
        this.cache[`${key}Timestamp`] = Date.now();
        delete this.loadingPromises[key];
        return result;
      })
      .catch((error) => {
        delete this.loadingPromises[key];
        throw error;
      });

    this.loadingPromises[key] = promise;
    return promise;
  }

  normalizeEventTime(event) {
    const eventTime = toDate(event?.startTime);
    return { ...event, startTime: eventTime };
  }

  formatEventTime(date) {
    return date.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
  }

  getEventStatusClass(eventDate, now = new Date()) {
    const hoursUntilEvent = (eventDate - now) / (1000 * 60 * 60);
    if (hoursUntilEvent < APP_CONSTANTS.EVENT_STATUS_THRESHOLDS.urgent) return "urgent";
    if (hoursUntilEvent > APP_CONSTANTS.EVENT_STATUS_THRESHOLDS.low) return "low";
    return "normal";
  }

  mergeEvents(lists = []) {
    const map = new Map();
    lists.flat().forEach((event) => {
      if (event?.id) {
        map.set(event.id, this.normalizeEventTime(event));
      }
    });
    return Array.from(map.values()).sort((a, b) => {
      if (!a.startTime || !b.startTime) return 0;
      return a.startTime - b.startTime;
    });
  }

  async init() {
    try {
      await this.checkAuth();
      await this.loadDashboardData();
      this.initEventForm();
      this.initWeeklyChart();
      this.attachEvents();
      this.loadSuggestions();
    } catch (error) {
      console.error("Dashboard initialization error:", error);
      this.handleError(error);
    }
  }

  initEventForm() {
    this.eventFormManager = new EventFormManager({
      currentUserId: this.currentUser?.uid,
      onEventCreated: () => {
        this.loadDashboardData();
      },
      onEventUpdated: () => {
        this.loadDashboardData();
      },
      onEventDeleted: () => {
        this.loadDashboardData();
      }
    });
    
    if (window.calendarManager) {
      window.calendarManager.eventFormManager = this.eventFormManager;
    }
  }

  async checkAuth() {
    // Prevent redirect loop
    if (sessionStorage.getItem('auth_redirecting')) {
      sessionStorage.removeItem('auth_redirecting');
    }

    try {
    const user = await authManager.checkAuth();
    if (!user) {
        // Clear any stale cache before redirecting
        authManager.clearUser();
        sessionStorage.setItem('auth_redirecting', 'true');
      authManager.redirectToLogin();
        return null;
    }
          this.currentUser = user;
    return user;
    } catch (error) {
      console.error('[Dashboard] Auth check error:', error);
      authManager.clearUser();
      sessionStorage.setItem('auth_redirecting', 'true');
      authManager.redirectToLogin();
      return null;
    }
      }

  async loadDashboardData() {
    if (!this.currentUser?.uid) {
      this.setState({ user: this.getFallbackUser(), events: [] });
      this.updateUI();
      return;
    }

    const userId = this.currentUser.uid;
    try {
      const [userData, events] = await Promise.all([
        this.loadUserData(userId),
        this.loadUserEvents(userId)
      ]);
      
      const streak = this.calculateStreak(events);
      
      this.setState({
        user: userData,
        events: events || [],
        streak
      });
      this.updateUI();
      
      if (this.eventFormManager) {
        this.eventFormManager.setCurrentUserId(userId);
      }
      
      if (window.calendarManager) {
        window.calendarManager.eventFormManager = this.eventFormManager;
      }
    } catch (error) {
      console.warn("Dashboard data loading error:", error);
      this.setState({
        user: this.getFallbackUser(),
        events: []
      });
      this.updateUI();
    }
  }

  async loadUserData(userId) {
    return this.remember("userData", async () => {
      const user = await this.userService.getUser(userId).catch(() => null);
      return user || this.getFallbackUser();
    });
  }

  async loadUserEvents(userId) {
    return this.remember("events", async () => {
    const [upcoming, recent] = await Promise.all([
        this.getUpcomingEvents().catch(() => []),
      this.getRecentEvents().catch(() => [])
    ]);
      return this.mergeEvents([recent, upcoming]);
    });
  }

  getRecentEvents() {
    return this.events.filter(event => event.startTime < new Date());
  }

  // Calculate streak days (consecutive days with completed tasks)
  calculateStreak(events) {
    if (!events || events.length === 0) return 0;
    
    const completedByDay = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    events.forEach(event => {
      if (event.checked) {
        const eventDate = toDate(event.startTime);
        if (eventDate) {
          const dateKey = eventDate.toISOString().split('T')[0];
          completedByDay[dateKey] = true;
        }
      }
    });
    
    let streak = 0;
    let currentDate = new Date(today);
    
    // Check backwards from today
    for (let i = 0; i < 365; i++) {
      const dateKey = currentDate.toISOString().split('T')[0];
      if (completedByDay[dateKey]) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (i === 0) {
        // If today has no completed tasks, check yesterday
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  }

  updateUI() {
    this.updateUserInfo();
    this.updateAdvancedStats();
    this.updateUpcomingEvents();
    this.updateWeeklyChart();
  }

  updateUserInfo(user = this.state.user) {
    const resolvedUser = user || this.getFallbackUser();
    const userNameEl = document.querySelector(SELECTORS.userName);
    const userEmailEl = document.querySelector(SELECTORS.userEmail);
    
    if (userNameEl) userNameEl.textContent = resolvedUser.name || "مستخدم";
    if (userEmailEl) userEmailEl.textContent = resolvedUser.email || "";
  }

  updateAdvancedStats(events = this.state.events) {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    // Today's tasks
    const todayEvents = events.filter(event => {
      const eventDate = toDate(event.startTime);
      return eventDate && eventDate >= todayStart && eventDate <= todayEnd;
    });
    
    // Completed tasks (all time)
    const completedEvents = events.filter(event => event.checked);
    
    // Overdue tasks (past events not completed)
    const overdueEvents = events.filter(event => {
      const eventDate = toDate(event.startTime);
      return eventDate && eventDate < now && !event.checked;
    });
    
    // This week's events
    const weekEvents = events.filter(event => {
      const eventDate = toDate(event.startTime);
      return eventDate && eventDate >= weekStart && eventDate <= todayEnd;
    });
    
    // Calculate rates
    const todayCompleted = todayEvents.filter(e => e.checked).length;
    const dailyRate = todayEvents.length > 0 
      ? Math.round((todayCompleted / todayEvents.length) * 100) 
      : 0;
    
    const weekCompleted = weekEvents.filter(e => e.checked).length;
    const weeklyRate = weekEvents.length > 0 
      ? Math.round((weekCompleted / weekEvents.length) * 100) 
      : 0;
    
    // Update DOM
    this.updateStatElement(SELECTORS.todayTasks, todayEvents.length);
    this.updateStatElement(SELECTORS.completedTasks, completedEvents.length);
    this.updateStatElement(SELECTORS.overdueTasks, overdueEvents.length);
    this.updateStatElement(SELECTORS.streakDays, this.state.streak);
    this.updateStatElement(SELECTORS.dailyRate, `${dailyRate}%`);
    this.updateStatElement(SELECTORS.weeklyRate, `${weeklyRate}%`);
  }

  updateStatElement(selector, value) {
    const element = document.querySelector(selector);
    if (element) {
      element.textContent = value;
      // Add animation
      element.classList.add('stat-updated');
      setTimeout(() => element.classList.remove('stat-updated'), 300);
    }
  }

  initWeeklyChart() {
    const canvas = document.querySelector(SELECTORS.weeklyChart);
    if (!canvas || typeof Chart === 'undefined') return;
    
    const ctx = canvas.getContext('2d');
    
    this.weeklyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
        datasets: [
          {
            label: 'مكتملة',
            data: [0, 0, 0, 0, 0, 0, 0],
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderColor: 'rgb(34, 197, 94)',
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: 'غير مكتملة',
            data: [0, 0, 0, 0, 0, 0, 0],
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            borderColor: 'rgb(239, 68, 68)',
            borderWidth: 1,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            rtl: true,
            labels: {
              font: {
                family: 'inherit'
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  updateWeeklyChart() {
    if (!this.weeklyChart) return;
    
    const events = this.state.events;
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const completedByDay = [0, 0, 0, 0, 0, 0, 0];
    const incompleteByDay = [0, 0, 0, 0, 0, 0, 0];
    
    events.forEach(event => {
      const eventDate = toDate(event.startTime);
      if (eventDate && eventDate >= weekStart) {
        const dayIndex = eventDate.getDay();
        if (event.checked) {
          completedByDay[dayIndex]++;
        } else {
          incompleteByDay[dayIndex]++;
        }
      }
    });
    
    this.weeklyChart.data.datasets[0].data = completedByDay;
    this.weeklyChart.data.datasets[1].data = incompleteByDay;
    this.weeklyChart.update();
  }

  async loadSuggestions() {
    const container = document.querySelector(SELECTORS.suggestionsList);
    if (!container || !this.currentUser?.uid) return;
    
    try {
      // Generate suggestions based on user data
      const suggestions = await this.generateSuggestions();
      this.renderSuggestions(suggestions);
    } catch (error) {
      console.warn("Failed to load suggestions:", error);
      this.renderSuggestions(this.getDefaultSuggestions());
    }
  }

  async generateSuggestions() {
    const events = this.state.events;
    const now = new Date();
    const suggestions = [];
    
    // Check for overdue tasks
    const overdue = events.filter(e => {
      const d = toDate(e.startTime);
      return d && d < now && !e.checked;
    });
    
    if (overdue.length > 0) {
      suggestions.push({
        icon: 'fa-solid fa-exclamation-triangle',
        iconClass: 'priority-high',
        text: `لديك ${overdue.length} مهام متأخرة. هل تريد إعادة جدولتها؟`,
        action: 'reschedule',
        priority: 'high'
      });
    }
    
    // Check today's completion rate
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    
    const todayEvents = events.filter(e => {
      const d = toDate(e.startTime);
      return d && d >= todayStart && d <= todayEnd;
    });
    
    const todayCompleted = todayEvents.filter(e => e.checked).length;
    
    if (todayEvents.length > 0 && todayCompleted < todayEvents.length / 2) {
      suggestions.push({
        icon: 'fa-solid fa-clock',
        iconClass: 'priority-medium',
        text: `أكملت ${todayCompleted} من ${todayEvents.length} مهام اليوم. استمر! 💪`,
        action: 'focus',
        priority: 'medium'
      });
    }
    
    // Check streak
    if (this.state.streak > 0) {
      suggestions.push({
        icon: 'fa-solid fa-fire',
        iconClass: 'priority-low',
        text: `رائع! لديك ${this.state.streak} أيام التزام متتالية 🔥`,
        action: 'celebrate',
        priority: 'low'
      });
    }
    
    // Add productivity tip
    const tips = [
      'جرب تقنية بومودورو: 25 دقيقة عمل، 5 دقائق راحة',
      'ابدأ يومك بأصعب مهمة وأنت في قمة تركيزك',
      'خذ فترات راحة قصيرة لتجديد طاقتك',
      'رتب مهامك حسب الأولوية لزيادة إنتاجيتك'
    ];
    
    suggestions.push({
      icon: 'fa-solid fa-lightbulb',
      iconClass: 'priority-low',
      text: tips[Math.floor(Math.random() * tips.length)],
      action: 'tip',
      priority: 'low'
    });
    
    return suggestions.length > 0 ? suggestions : this.getDefaultSuggestions();
  }

  getDefaultSuggestions() {
    return [
      {
        icon: 'fa-solid fa-plus-circle',
        iconClass: 'priority-medium',
        text: 'ابدأ بإضافة مهامك الأولى لهذا الأسبوع',
        action: 'add',
        priority: 'medium'
      },
      {
        icon: 'fa-solid fa-calendar-check',
        iconClass: 'priority-low',
        text: 'أنشئ نظامك الخاص لتحصل على تقويم مخصص',
        action: 'system',
        priority: 'low'
      }
    ];
  }

  renderSuggestions(suggestions) {
    const container = document.querySelector(SELECTORS.suggestionsList);
    if (!container) return;
    
    container.innerHTML = '';
    
    suggestions.forEach(suggestion => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.innerHTML = `
        <div class="suggestion-icon ${suggestion.iconClass}">
          <i class="${suggestion.icon}"></i>
        </div>
        <div class="suggestion-content">
          <div class="suggestion-text">${suggestion.text}</div>
        </div>
      `;
      
      item.addEventListener('click', () => this.handleSuggestionClick(suggestion));
      container.appendChild(item);
    });
  }

  handleSuggestionClick(suggestion) {
    switch (suggestion.action) {
      case 'reschedule':
        window.location.href = ROUTES.CALENDAR;
        break;
      case 'add':
        window.location.href = ROUTES.CALENDAR;
        break;
      case 'system':
        window.location.href = ROUTES.CALENDAR + '#addSystem';
        break;
      case 'focus':
      case 'celebrate':
      case 'tip':
        messageManager.success(suggestion.text);
        break;
    }
  }

  updateUpcomingEvents(events = this.state.events) {
    const list = document.querySelector(SELECTORS.eventsContainer);
    if (!list) return;
    
    const now = new Date();
    const upcoming = events
      .map((event) => this.normalizeEventTime(event))
      .filter((event) => event.startTime && event.startTime >= now)
      .slice(0, 5); // Limit to 5 events
    
    list.innerHTML = "";
    
    if (!upcoming.length) {
      list.innerHTML = `<p style="text-align: center; padding: 1rem; color: var(--muted-foreground);">لا توجد أحداث قادمة</p>`;
      return;
    }

    const fragment = document.createDocumentFragment();
    upcoming.forEach((event) => {
      const eventTime = event.startTime;
      const location = event.description || event.extra?.location || "لا يوجد موقع";
      const statusClass = this.getEventStatusClass(eventTime, now);

      const wrapper = document.createElement("div");
      wrapper.className = "event-item";
      wrapper.style.cursor = "pointer";
      wrapper.innerHTML = `
        <div class="event-time">${this.formatEventTime(eventTime)}</div>
      <div class="event-details">
          <div class="event-title">${event.title || "حدث"}</div>
        <div class="event-location">${location}</div>
      </div>
      <div class="event-status ${statusClass}"></div>
    `;
      
      wrapper.addEventListener('click', () => {
        if (this.eventFormManager) {
          this.eventFormManager.populateFormForEvent(event);
        }
      });
      
      fragment.appendChild(wrapper);
    });

    list.appendChild(fragment);
  }

  attachEvents() {
    document.querySelector(SELECTORS.logout)?.addEventListener("click", () => this.handleLogout());
    
    const viewAllBtn = document.querySelector(SELECTORS.viewAllEvents);
    if (viewAllBtn) {
      viewAllBtn.addEventListener("click", () => {
        window.location.href = ROUTES.CALENDAR;
      });
    }
    
    // Refresh suggestions button
    const refreshBtn = document.querySelector(SELECTORS.refreshSuggestions);
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        this.loadSuggestions();
      });
    }
  }

  async handleLogout() {
    try {
      await this.userService.logout();
      messageManager.success("تم تسجيل الخروج بنجاح");
    } catch (error) {
      console.error("[Dashboard] Logout error:", error);
      messageManager.error("حدث خطأ أثناء تسجيل الخروج");
    } finally {
      setTimeout(() => {
        authManager.redirectToLogin();
      }, 500);
    }
  }

  handleError(err) {
    console.error("Dashboard error:", err);
    messageManager.error("حدث خطأ في تحميل البيانات");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const dashboard = new Dashboard();
    await dashboard.init();
});

export default Dashboard;
