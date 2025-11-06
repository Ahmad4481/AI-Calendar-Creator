// Calendar functionality
class CalendarManager {
  constructor() {
    this.currentDate = new Date();
    this.selectedDate = null;
    this.init();
  }

  init() {
    this.bindEvents();
    this.highlightToday();
  }

  // Highlight today's date
  highlightToday() {
    const today = new Date().getDate();
    document.querySelectorAll('.calendar-day').forEach(day => {
      if (parseInt(day.textContent) === today) {
        day.classList.add('today');
      }
    });
  }

  // Handle calendar day click
  handleDayClick(event) {
    // Remove selected class from all days
    document.querySelectorAll('.calendar-day').forEach(day => {
      day.classList.remove('selected');
    });
    
    // Add selected class to clicked day
    event.target.classList.add('selected');
    this.selectedDate = parseInt(event.target.textContent);
    
    // Trigger custom event for other components
    this.dispatchDateSelectedEvent();
  }

  // Dispatch custom event when date is selected
  dispatchDateSelectedEvent() {
    const event = new CustomEvent('dateSelected', {
      detail: {
        date: this.selectedDate,
        month: this.currentDate.getMonth(),
        year: this.currentDate.getFullYear()
      }
    });
    document.dispatchEvent(event);
  }

  // Navigate calendar months
  navigateMonth(direction) {
    if (direction === 'prev') {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    } else if (direction === 'next') {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    }
    
    this.updateCalendarDisplay();
  }

  // Update calendar display
  updateCalendarDisplay() {
    const monthNames = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    
    
    const monthYear = document.querySelector('.calendar-header h4');
    if (monthYear) {
      monthYear.textContent = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
    }
    
    // Update calendar days (simplified - in real app, you'd generate the full calendar)
    this.generateCalendarDays();
  }

  // Generate calendar days (simplified version)
  generateCalendarDays() {
    const calendarGrid = document.querySelector('.calendar-grid');
    if (!calendarGrid) return;
    
    // Clear existing days (keep headers)
    const dayHeaders = calendarGrid.querySelectorAll('.calendar-day-header');
    calendarGrid.innerHTML = '';
    
    // Add headers back
    dayHeaders.forEach(header => {
      calendarGrid.appendChild(header);
    });
    
    // Generate days for current month
    const daysInMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement('div');
      dayElement.className = 'calendar-day';
      dayElement.textContent = day;
      dayElement.addEventListener('click', (e) => this.handleDayClick(e));
      
      // Highlight today
      if (day === new Date().getDate() && 
          this.currentDate.getMonth() === new Date().getMonth() &&
          this.currentDate.getFullYear() === new Date().getFullYear()) {
        dayElement.classList.add('today');
      }
      
      calendarGrid.appendChild(dayElement);
    }
  }

  // Bind calendar events
  bindEvents() {
    // Calendar navigation buttons
    document.querySelectorAll('.calendar-nav').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const direction = e.target.textContent.includes('‹') ? 'prev' : 'next';
        this.navigateMonth(direction);
      });
    });

    // Calendar day clicks
    document.querySelectorAll('.calendar-day').forEach(day => {
      day.addEventListener('click', (e) => {
        this.handleDayClick(e);
      });
    });
  }

  // Get selected date
  getSelectedDate() {
    return this.selectedDate;
  }

  // Get current date
  getCurrentDate() {
    return this.currentDate;
  }
}

// Initialize calendar manager
const calendarManager = new CalendarManager();
calendarManager.generateCalendarDays();

// Export for use in other modules
window.calendarManager = calendarManager;
