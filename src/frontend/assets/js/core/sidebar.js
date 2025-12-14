// Sidebar functionality
class SidebarManager {
  constructor() {
    this.isCollapsed = false;
    this.isMobileOpen = false;
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadSidebarState();
    this.handleResize();
  }

  // Toggle sidebar collapse state
  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
    const sidebar = document.querySelector(".sidebar");
    const toggleBtn = document.getElementById("sidebarToggle");

    if (sidebar) {
      sidebar.classList.toggle("collapsed", this.isCollapsed);
      this.saveSidebarState();
    }

    // Toggle active class for hamburger animation
    if (toggleBtn) {
      toggleBtn.classList.toggle("active", !this.isCollapsed);
    }
  }

  // Collapse sidebar
  collapseSidebar() {
    this.isCollapsed = true;
    const sidebar = document.querySelector(".sidebar");
    const toggleBtn = document.getElementById("sidebarToggle");

    if (sidebar) {
      sidebar.classList.add("collapsed");
      this.saveSidebarState();
    }

    if (toggleBtn) {
      toggleBtn.classList.remove("active");
    }
  }

  // Expand sidebar
  expandSidebar() {
    this.isCollapsed = false;
    const sidebar = document.querySelector(".sidebar");
    const toggleBtn = document.getElementById("sidebarToggle");

    if (sidebar) {
      sidebar.classList.remove("collapsed");
      this.saveSidebarState();
    }

    if (toggleBtn) {
      toggleBtn.classList.add("active");
    }
  }

  // Save sidebar state to localStorage
  saveSidebarState() {
    localStorage.setItem("sidebarCollapsed", this.isCollapsed.toString());
  }

  // Load sidebar state from localStorage
  loadSidebarState() {
    const savedState = localStorage.getItem("sidebarCollapsed");
    const sidebar = document.querySelector(".sidebar");
    const toggleBtn = document.getElementById("sidebarToggle");
    
    if (savedState === "true") {
      this.isCollapsed = true;
      if (sidebar) {
        sidebar.classList.add("collapsed");
      }
      if (toggleBtn) {
        toggleBtn.classList.remove("active");
      }
    } else {
      this.isCollapsed = false;
      if (sidebar) {
        sidebar.classList.remove("collapsed");
      }
      if (toggleBtn) {
        toggleBtn.classList.add("active");
      }
    }
  }

  // Bind sidebar events
  bindEvents() {
    // Sidebar toggle button (desktop)
    const sidebarToggle = document.getElementById("sidebarToggle");
    if (sidebarToggle) {
      sidebarToggle.addEventListener("click", () => {
        this.toggleSidebar();
      });
    }

    // Mobile menu toggle button
    const mobileMenuToggle = document.getElementById("mobileMenuToggle");
    if (mobileMenuToggle) {
      mobileMenuToggle.addEventListener("click", () => {
        this.openMobileSidebar();
      });
    }

    // Mobile close button
    const mobileCloseBtn = document.getElementById("mobileCloseBtn");
    if (mobileCloseBtn) {
      mobileCloseBtn.addEventListener("click", () => {
        this.closeMobileSidebar();
      });
    }

    // Overlay click to close
    const sidebarOverlay = document.getElementById("sidebarOverlay");
    if (sidebarOverlay) {
      sidebarOverlay.addEventListener("click", () => {
        this.closeMobileSidebar();
      });
    }

    // Close sidebar when clicking nav links on mobile
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach(link => {
      link.addEventListener("click", () => {
        if (window.innerWidth <= 768) {
          this.closeMobileSidebar();
        }
      });
    });

    // Handle window resize
    window.addEventListener("resize", () => {
      this.handleResize();
    });

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

  // Open mobile sidebar
  openMobileSidebar() {
    const sidebar = document.querySelector(".sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    const menuToggle = document.getElementById("mobileMenuToggle");
    
    this.isMobileOpen = true;
    
    if (sidebar) {
      sidebar.classList.add("mobile-open");
    }
    if (overlay) {
      overlay.classList.add("active");
    }
    if (menuToggle) {
      menuToggle.style.display = "none"; // Hide menu button when sidebar is open
    }
    
    // Prevent body scroll
    document.body.style.overflow = "hidden";
  }

  // Close mobile sidebar
  closeMobileSidebar() {
    const sidebar = document.querySelector(".sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    const menuToggle = document.getElementById("mobileMenuToggle");
    
    this.isMobileOpen = false;
    
    if (sidebar) {
      sidebar.classList.remove("mobile-open");
    }
    if (overlay) {
      overlay.classList.remove("active");
    }
    if (menuToggle) {
      menuToggle.style.display = "flex"; // Show menu button when sidebar is closed
    }
    if (menuToggle) {
      menuToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
    }
    
    // Restore body scroll
    document.body.style.overflow = "";
  }

  // Handle window resize
  handleResize() {
    if (window.innerWidth > 768) {
      // On desktop, close mobile menu if open
      this.closeMobileSidebar();
    }
  }

  // Get sidebar state
  isSidebarCollapsed() {
    return this.isCollapsed;
  }

  // Get mobile sidebar state
  isMobileSidebarOpen() {
    return this.isMobileOpen;
  }
}

// Initialize sidebar manager
const sidebarManager = new SidebarManager();

// Export for use in other modules
window.sidebarManager = sidebarManager;
