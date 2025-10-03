// Sidebar functionality
class SidebarManager {
  constructor() {
    this.isCollapsed = false;
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadSidebarState();
  }

  // Toggle sidebar collapse state
  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
    const sidebar = document.querySelector(".sidebar");

    if (sidebar) {
      sidebar.classList.toggle("collapsed", this.isCollapsed);
      this.saveSidebarState();
    }
  }

  // Collapse sidebar
  collapseSidebar() {
    this.isCollapsed = true;
    const sidebar = document.querySelector(".sidebar");

    if (sidebar) {
      sidebar.classList.add("collapsed");
      this.saveSidebarState();
    }
  }

  // Expand sidebar
  expandSidebar() {
    this.isCollapsed = false;
    const sidebar = document.querySelector(".sidebar");

    if (sidebar) {
      sidebar.classList.remove("collapsed");
      this.saveSidebarState();
    }
  }

  // Save sidebar state to localStorage
  saveSidebarState() {
    localStorage.setItem("sidebarCollapsed", this.isCollapsed.toString());
  }

  // Load sidebar state from localStorage
  loadSidebarState() {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState === "true") {
      this.collapseSidebar();
    }
  }

  // Bind sidebar events
  bindEvents() {
    // Sidebar toggle button
    const sidebarToggle = document.getElementById("sidebarToggle");
    if (sidebarToggle) {
      sidebarToggle.addEventListener("click", () => {
        this.toggleSidebar();
      });
    }

    // Logout button
    const logoutBtn = document.querySelector(".logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        if (confirm("هل أنت متأكد من تسجيل الخروج؟")) {
          open("index.html", "_self");
        }
      });
    }
  }

  // Get sidebar state
  isSidebarCollapsed() {
    return this.isCollapsed;
  }
}

// Initialize sidebar manager
const sidebarManager = new SidebarManager();

// Export for use in other modules
window.sidebarManager = sidebarManager;
