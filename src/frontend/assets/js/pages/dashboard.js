// // Main dashboard functionality
// class DashboardManager {
//   constructor() {
//     this.init();
//   }

//   init() {
//     // Wait for DOM to be ready
//     if (document.readyState === 'loading') {
//       document.addEventListener('DOMContentLoaded', () => {
//         this.initializeDashboard();
//       });
//     } else {
//       this.initializeDashboard();
//     }
//   }

//   // Initialize dashboard
//   initializeDashboard() {
//     // Check authentication

//     // Update user info
//     window.authManager.updateUserInfo();

//     // Initialize all managers
//     this.initializeManagers();

//     // Bind global events
//     this.bindGlobalEvents();

//     // Load dashboard data
//     this.loadDashboardData();
//   }

//   // Initialize all component managers
//   initializeManagers() {
//     // Theme manager is already initialized
//     // Sidebar manager is already initialized
//     // Calendar manager is already initialized
//     // Actions manager is already initialized
    
//     console.log('Dashboard managers initialized');
//   }

//   // Bind global dashboard events
//   bindGlobalEvents() {
//     // Listen for date selection events
//     document.addEventListener('dateSelected', (e) => {
//       this.handleDateSelected(e.detail);
//     });

//     // Listen for action events
//     document.addEventListener('actionTriggered', (e) => {
//       this.handleActionTriggered(e.detail);
//     });

//     // Listen for window resize
//     window.addEventListener('resize', () => {
//       this.handleWindowResize();
//     });
//   }

//   // Handle date selection
//   handleDateSelected(detail) {
//     console.log('Date selected:', detail);
//     // Update any components that depend on selected date
//     this.updateDateDependentComponents(detail);
//   }

//   // Handle action triggered
//   handleActionTriggered(detail) {
//     console.log('Action triggered:', detail);
//     // Log activity or update UI based on action
//     this.logActivity(detail);
//   }

//   // Handle window resize
//   handleWindowResize() {
//     // Adjust layout for mobile/desktop
//     this.adjustLayoutForScreenSize();
//   }

//   // Update components that depend on selected date
//   updateDateDependentComponents(dateDetail) {
//     // Update events list for selected date
//     // Update statistics
//     // Update any other date-dependent components
//   }

//   // Log activity
//   logActivity(actionDetail) {
//     // Add to activity feed
//     const activityList = document.querySelector('.activity-list');
//     if (activityList) {
//       const activityItem = document.createElement('div');
//       activityItem.className = 'activity-item';
//       activityItem.innerHTML = `
//         <div class="activity-icon"><i class="fa-solid fa-bolt" aria-hidden="true"></i></div>
//         <div class="activity-content">
//           <div class="activity-text">${actionDetail.title}</div>
//           <div class="activity-time">الآن</div>
//         </div>
//       `;
      
//       // Insert at the beginning
//       activityList.insertBefore(activityItem, activityList.firstChild);
      
//       // Remove old items if too many
//       const items = activityList.querySelectorAll('.activity-item');
//       if (items.length > 10) {
//         items[items.length - 1].remove();
//       }
//     }
//   }

//   // Adjust layout for screen size
//   adjustLayoutForScreenSize() {
//     const isMobile = window.innerWidth <= 768;
//     const sidebar = document.querySelector('.sidebar');
    
//     if (isMobile && sidebar && !sidebar.classList.contains('collapsed')) {
//       // Auto-collapse sidebar on mobile
//       window.sidebarManager.collapseSidebar();
//     }
//   }

//   // Load dashboard data
//   loadDashboardData() {
//     // Load statistics
//     this.loadStatistics();
    
//     // Load upcoming events
//     this.loadUpcomingEvents();
    
//     // Load recent activity
//     this.loadRecentActivity();
//   }

//   // Load statistics
//   loadStatistics() {
//     // Simulate loading statistics
//     const stats = {
//       monthlyEvents: 24,
//       todayEvents: 8,
//       completedEvents: 156,
//       achievementRate: 89
//     };

//     // Update stat cards
//     const statNumbers = document.querySelectorAll('.stat-number');
//     if (statNumbers.length >= 4) {
//       statNumbers[0].textContent = stats.monthlyEvents;
//       statNumbers[1].textContent = stats.todayEvents;
//       statNumbers[2].textContent = stats.completedEvents;
//       statNumbers[3].textContent = `${stats.achievementRate}%`;
//     }
//   }

//   // Load upcoming events
//   loadUpcomingEvents() {
//     // Events are already in HTML, but you could load them dynamically here
//     console.log('Upcoming events loaded');
//   }

//   // Load recent activity
//   loadRecentActivity() {
//     // Activity items are already in HTML, but you could load them dynamically here
//     console.log('Recent activity loaded');
//   }

//   // Refresh dashboard data
//   refreshDashboard() {
//     this.loadDashboardData();
//   }

//   // Get dashboard statistics
//   getDashboardStats() {
//     return {
//       monthlyEvents: parseInt(document.querySelector('.stat-number')?.textContent) || 0,
//       todayEvents: parseInt(document.querySelectorAll('.stat-number')[1]?.textContent) || 0,
//       completedEvents: parseInt(document.querySelectorAll('.stat-number')[2]?.textContent) || 0,
//       achievementRate: parseInt(document.querySelectorAll('.stat-number')[3]?.textContent) || 0
//     };
//   }
// }

// // Initialize dashboard manager
// const dashboardManager = new DashboardManager();

// // Export for use in other modules
// window.dashboardManager = dashboardManager;
