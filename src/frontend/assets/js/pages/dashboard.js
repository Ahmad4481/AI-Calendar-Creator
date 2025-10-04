/**
 * Dashboard Manager - Main dashboard functionality
 */
class DashboardManager {
  constructor() {
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.initializeDashboard();
      });
    } else {
      this.initializeDashboard();
    }
  }

  /**
   * Initialize dashboard
   */
  initializeDashboard() {
    // Check authentication
    this.checkAuthentication();

    // Update user info
    this.updateUserInfo();

    // Initialize all managers
    this.initializeManagers();

    // Bind global events
    this.bindGlobalEvents();

    // Load dashboard data
    this.loadDashboardData();
  }

  /**
   * Check user authentication
   */
  

  /**
   * Update user information in the header
   */
  updateUserInfo() {
    const userName = localStorage.getItem('userName') || 'مستخدم';
    const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
    
    // Update user name in header
    const userNameElement = document.querySelector('.user-name');
    if (userNameElement) {
      userNameElement.textContent = userName;
    }

    // Update user email in header
    const userEmailElement = document.querySelector('.user-email');
    if (userEmailElement) {
      userEmailElement.textContent = userEmail;
    }
  }

  /**
   * Initialize all dashboard managers
   */
  initializeManagers() {
    // Initialize theme manager
    if (typeof ThemeManager !== 'undefined') {
      this.themeManager = new ThemeManager();
    }

    // Initialize sidebar manager
    if (typeof SidebarManager !== 'undefined') {
      this.sidebarManager = new SidebarManager();
    }

    // Initialize calendar manager
    if (typeof CalendarManager !== 'undefined') {
      this.calendarManager = new CalendarManager();
    }
  }

  /**
   * Bind global dashboard events
   */
  bindGlobalEvents() {
    // Theme toggle
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        this.themeManager?.toggleTheme();
      });
    }

    // Sidebar toggle
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        this.sidebarManager?.toggleSidebar();
      });
    }

    // Logout button
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.handleLogout();
      });
    }

    // Search functionality
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.handleSearch(e.target.value);
      });
    }
  }

  /**
   * Load dashboard data
   */
  loadDashboardData() {
    // Load user statistics
    this.loadUserStats();

    // Load recent activities
    this.loadRecentActivities();

    // Load upcoming events
    this.loadUpcomingEvents();
  }

  /**
   * Load user statistics
   */
  loadUserStats() {
    // Mock data - replace with actual API calls
    const stats = {
      totalEvents: 25,
      completedTasks: 18,
      upcomingMeetings: 7,
      productivity: 85
    };

    // Update stats cards
    this.updateStatsCard('total-events', stats.totalEvents);
    this.updateStatsCard('completed-tasks', stats.completedTasks);
    this.updateStatsCard('upcoming-meetings', stats.upcomingMeetings);
    this.updateStatsCard('productivity', stats.productivity);
  }

  /**
   * Update stats card
   * @param {string} cardId - Card ID
   * @param {number} value - Value to display
   */
  updateStatsCard(cardId, value) {
    const card = document.querySelector(`#${cardId}`);
    if (card) {
      const valueElement = card.querySelector('.stat-value');
      if (valueElement) {
        valueElement.textContent = value;
      }
    }
  }

  /**
   * Load recent activities
   */
  loadRecentActivities() {
    // Mock data - replace with actual API calls
    const activities = [
      { type: 'event', text: 'تم إنشاء حدث جديد', time: 'منذ 5 دقائق' },
      { type: 'task', text: 'تم إكمال مهمة', time: 'منذ 15 دقيقة' },
      { type: 'meeting', text: 'اجتماع قادم', time: 'منذ ساعة' }
    ];

    this.renderActivities(activities);
  }

  /**
   * Render activities list
   * @param {Array} activities - Activities array
   */
  renderActivities(activities) {
    const activitiesList = document.querySelector('.activities-list');
    if (!activitiesList) return;

    activitiesList.innerHTML = activities.map(activity => `
      <div class="activity-item">
        <div class="activity-icon">
          <i class="fa-solid fa-${this.getActivityIcon(activity.type)}"></i>
        </div>
        <div class="activity-content">
          <p class="activity-text">${activity.text}</p>
          <span class="activity-time">${activity.time}</span>
        </div>
      </div>
    `).join('');
  }

  /**
   * Get activity icon based on type
   * @param {string} type - Activity type
   * @returns {string} Icon class
   */
  getActivityIcon(type) {
    const icons = {
      event: 'calendar-plus',
      task: 'check-circle',
      meeting: 'users',
      reminder: 'bell'
    };
    return icons[type] || 'circle';
  }

  /**
   * Load upcoming events
   */
  loadUpcomingEvents() {
    // Mock data - replace with actual API calls
    const events = [
      { title: 'اجتماع فريق العمل', time: '10:00', location: 'قاعة الاجتماعات' },
      { title: 'موعد طبي', time: '14:30', location: 'عيادة الدكتور أحمد' },
      { title: 'تسليم المشروع', time: '16:00', location: 'المكتب' }
    ];

    this.renderEvents(events);
  }

  /**
   * Render events list
   * @param {Array} events - Events array
   */
  renderEvents(events) {
    const eventsList = document.querySelector('.events-list');
    if (!eventsList) return;

    eventsList.innerHTML = events.map(event => `
      <div class="event-item">
        <div class="event-time">${event.time}</div>
        <div class="event-details">
          <h4 class="event-title">${event.title}</h4>
          <p class="event-location">${event.location}</p>
        </div>
      </div>
    `).join('');
  }

  /**
   * Handle search functionality
   * @param {string} query - Search query
   */
  handleSearch(query) {
    if (query.length < 2) return;

    // Mock search - replace with actual API calls
    console.log('Searching for:', query);
    
    // Implement search logic here
    this.performSearch(query);
  }

  /**
   * Perform search
   * @param {string} query - Search query
   */
  performSearch(query) {
    // Mock search results
    const results = [
      { type: 'event', title: 'اجتماع فريق العمل', date: '2024-01-15' },
      { type: 'task', title: 'تسليم المشروع', date: '2024-01-16' }
    ];

    this.displaySearchResults(results);
  }

  /**
   * Display search results
   * @param {Array} results - Search results
   */
  displaySearchResults(results) {
    // Implement search results display
    console.log('Search results:', results);
  }

  /**
   * Handle user logout
   */
  handleLogout() {
    // Clear authentication data
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');

    // Redirect to login page
    window.location.href = 'index.html';
  }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new DashboardManager();
});