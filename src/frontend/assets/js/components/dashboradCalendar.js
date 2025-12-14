import { EventService, auth, onAuthStateChanged } from '../core/firebase/index.js';
import { toDate } from '../core/firebase/helpers.js';

// Constants
const MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const SELECTORS = {
  calendarGrid: '.calendar-grid',
  calendarHeader: '.calendar-header h4',
  calendarGridContent: '.calendar-grid-content',
  calendarNav: '.calendar-nav',
  calendarDay: '.calendar-day',
  calendarDaySelected: '.calendar-day.selected',
  calendarDayEmpty: '.calendar-day.empty',
  calendarDayHeader: '.calendar-day-header'
};

const URGENT_EVENT_HOURS = 24;
const EVENT_LIMIT = 100;

class CalendarManager {
  constructor(options = {}) {
    this.eventService = new EventService();
    this.currentDate = new Date();
    this.events = [];
    this.currentUserId = null;
    this.state = {
      selectedDate: null,
      selectedMonth: null,
      selectedYear: null
    };
    
    // DOM element cache
    this.elements = {};
    
    // Event listeners cleanup
    this.listeners = [];
    
    // Event form manager (can be set externally)
    this.eventFormManager = options.eventFormManager || null;
  }

  // ==================== Initialization ====================

  async init() {
    try {
      await this.initializeUser();
      this.cacheElements();
    this.bindEvents();
      this.setupPageFocusListener();
    this.updateCalendarDisplay();
    await this.loadUserEvents();
    } catch (error) {
      console.error('[CalendarManager] Initialization error:', error);
      this.events = [];
    }
  }

  async initializeUser() {
    // Wait for Firebase auth to be ready
    return new Promise((resolve, reject) => {
      // Check immediately if auth is already initialized
      const currentUser = auth.currentUser;
      if (currentUser) {
        this.currentUserId = currentUser.uid;
        resolve();
        return;
  }

      // Wait for auth state change
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        if (user) {
          this.currentUserId = user.uid;
          resolve();
        } else {
          // Check cached user as fallback
          const cachedUser = localStorage.getItem("cachedUser");
          if (cachedUser) {
            try {
              const parsed = JSON.parse(cachedUser);
              if (parsed?.uid) {
                this.currentUserId = parsed.uid;
                resolve();
                return;
              }
            } catch {
              localStorage.removeItem("cachedUser");
            }
          }
          reject(new Error("No authenticated user found"));
        }
      });

      // Timeout after 2 seconds
      setTimeout(() => {
        unsubscribe();
        const cachedUser = localStorage.getItem("cachedUser");
        if (cachedUser) {
          try {
          const parsed = JSON.parse(cachedUser);
            if (parsed?.uid) {
          this.currentUserId = parsed.uid;
              resolve();
          return;
        }
          } catch {
            localStorage.removeItem("cachedUser");
          }
        }
        reject(new Error("No authenticated user found"));
      }, 2000);
    });
  }

  cacheElements() {
    this.elements.grid = document.querySelector(SELECTORS.calendarGrid);
    this.elements.header = document.querySelector(SELECTORS.calendarHeader);
    this.elements.content = document.querySelector(SELECTORS.calendarGridContent);
  }

  // ==================== Event Loading ====================

  async loadUserEvents() {
    if (!this.currentUserId) {
      this.events = [];
      return;
      }
      
    try {
      const fetchedEvents = await this.eventService.getUserEvents(this.currentUserId, EVENT_LIMIT);
      this.events = Array.isArray(fetchedEvents) ? fetchedEvents : [];
        this.renderEventsOnCalendar();
    } catch (error) {
      console.error('[CalendarManager] Error loading events:', error);
      this.events = [];
    }
  }

  // ==================== Calendar Rendering ====================

  updateCalendarDisplay() {
    this.updateHeader();
    this.generateCalendarDays();
      }

  updateHeader() {
    if (this.elements.header) {
      const month = MONTH_NAMES[this.currentDate.getMonth()];
      const year = this.currentDate.getFullYear();
      this.elements.header.textContent = `${month} ${year}`;
      }
  }

  generateCalendarDays() {
    if (!this.elements.grid) return;

    const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0).getDate();
    const today = new Date();

    // Clear and preserve headers
    const dayHeaders = this.elements.grid.querySelectorAll(SELECTORS.calendarDayHeader);
    this.elements.grid.innerHTML = '';
    dayHeaders.forEach(header => this.elements.grid.appendChild(header));

    // Add empty days for alignment
    for (let i = 0; i < firstDayOfWeek; i++) {
      this.elements.grid.appendChild(this.createEmptyDay());
  }

    // Generate month days
    const fragment = document.createDocumentFragment();
    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = this.createDayElement(day, today);
      fragment.appendChild(dayElement);
    }
    this.elements.grid.appendChild(fragment);
    
    // Render events after days are created
    this.renderEventsOnCalendar();
  }

  createEmptyDay() {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'calendar-day empty';
    return emptyDay;
    }
    
  createDayElement(day, today) {
      const dayElement = document.createElement('div');
      dayElement.className = 'calendar-day';
      dayElement.textContent = String(day);
      dayElement.setAttribute('data-day', day);
      dayElement.setAttribute('data-month', this.currentDate.getMonth());
      dayElement.setAttribute('data-year', this.currentDate.getFullYear());
      dayElement.addEventListener('click', (e) => this.handleDayClick(e));
      
      // Highlight today
    if (this.isToday(day, today)) {
      dayElement.classList.add('today', 'selected');
      this.state.selectedDate = day;
      this.state.selectedMonth = this.currentDate.getMonth();
      this.state.selectedYear = this.currentDate.getFullYear();
    }

    return dayElement;
  }

  isToday(day, today) {
    return day === today.getDate() &&
          this.currentDate.getMonth() === today.getMonth() &&
           this.currentDate.getFullYear() === today.getFullYear();
    }
    
  // ==================== Events Rendering ====================

  renderEventsOnCalendar() {
    if (!this.events?.length || !this.elements.grid) {
      this.clearSelectedDayEvents();
      return;
    }
    
    const calendarDays = this.elements.grid.querySelectorAll(`${SELECTORS.calendarDay}:not(${SELECTORS.calendarDayEmpty})`);
    if (!calendarDays.length) return;

    const eventsByDay = this.groupEventsByDay();
    this.renderEventIndicators(calendarDays, eventsByDay);
    this.renderSelectedDayEvents(eventsByDay);
  }

  groupEventsByDay() {
    const eventsByDay = {};
    const now = new Date();

    this.events.forEach((event) => {
      try {
        const eventTime = toDate(event?.startTime);
        if (!eventTime || isNaN(eventTime.getTime())) return;

        const eventKey = this.getEventKey(eventTime);
        if (!eventsByDay[eventKey]) {
          eventsByDay[eventKey] = [];
        }
        eventsByDay[eventKey].push(event);
      } catch (error) {
        console.warn('[CalendarManager] Error processing event:', error, event);
      }
    });

    return eventsByDay;
  }

  getEventKey(date) {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  getDayKey(dayElement) {
    const year = dayElement.getAttribute('data-year');
    const month = dayElement.getAttribute('data-month');
    const day = dayElement.getAttribute('data-day');
    return `${year}-${month}-${day}`;
  }

  renderEventIndicators(calendarDays, eventsByDay) {
    const now = new Date();

    calendarDays.forEach(day => {
      this.clearDayIndicators(day);
      
      const dayKey = this.getDayKey(day);
      const dayEvents = eventsByDay[dayKey] || [];
      
      if (dayEvents.length > 0) {
        day.classList.add('has-events');
        if (this.hasUrgentEvents(dayEvents, now)) {
          day.classList.add('has-urgent-events');
        }
        this.addEventIndicator(day, dayEvents.length);
      }
    });
  }

  clearDayIndicators(day) {
    day.classList.remove('has-events', 'has-urgent-events');
    const indicator = day.querySelector('.event-indicator');
    if (indicator) indicator.remove();
  }

  hasUrgentEvents(events, now) {
    return events.some(event => {
      const eventTime = toDate(event.startTime);
      if (!eventTime) return false;
          const hoursUntilEvent = (eventTime - now) / (1000 * 60 * 60);
      return hoursUntilEvent >= 0 && hoursUntilEvent <= URGENT_EVENT_HOURS;
        });
  }

  addEventIndicator(day, eventCount) {
    // Clean text nodes
        const textNodes = Array.from(day.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
        textNodes.forEach(node => node.remove());
        
    // Add day number
    const dayNum = day.getAttribute('data-day');
    day.appendChild(document.createTextNode(dayNum));
        
    // Add indicator
        const indicator = document.createElement('span');
        indicator.className = 'event-indicator';
    indicator.setAttribute('data-event-count', eventCount);
    indicator.title = `${eventCount} حدث`;
        indicator.textContent = eventCount > 9 ? '9+' : String(eventCount);
    indicator.style.display = 'flex';
        day.appendChild(indicator);   
  }

  renderSelectedDayEvents(eventsByDay) {
    if (!this.elements.content) return;

    const selectedDay = document.querySelector(SELECTORS.calendarDaySelected);
    if (!selectedDay) {
      this.elements.content.innerHTML = '';
      return;
    }

    const dayKey = this.getDayKey(selectedDay);
    const dayEvents = eventsByDay[dayKey] || [];

    this.elements.content.innerHTML = '';
    const fragment = document.createDocumentFragment();
    dayEvents.forEach(event => {
      const eventElement = document.createElement('div');
      eventElement.className = 'event-item';
      eventElement.style.cursor = 'pointer';
      
      // Add click handler to open edit form
      eventElement.addEventListener('click', () => {
        if (this.eventFormManager) {
          this.eventFormManager.populateFormForEvent(event);
        }
      });
      eventElement.textContent = event.title || 'حدث';
      fragment.appendChild(eventElement);
    });
    this.elements.content.appendChild(fragment);
  }

  clearSelectedDayEvents() {
    if (this.elements.content) {
      this.elements.content.innerHTML = '';
    }
  }

  // ==================== Event Handlers ====================

  handleDayClick(event) {
    const dayElement = event.target.closest(SELECTORS.calendarDay);
    if (!dayElement || dayElement.classList.contains('empty')) return;

    const dayNum = parseInt(dayElement.getAttribute('data-day'));
    const month = parseInt(dayElement.getAttribute('data-month'));
    const year = parseInt(dayElement.getAttribute('data-year'));

    if (isNaN(dayNum) || isNaN(month) || isNaN(year)) return;

    this.selectDay(dayElement, dayNum, month, year);
    this.renderEventsOnCalendar();
  }

  selectDay(dayElement, dayNum, month, year) {
    // Remove selection from all days
    document.querySelectorAll(SELECTORS.calendarDay).forEach(day => {
      day.classList.remove('selected');
    });

    // Add selection to clicked day
    dayElement.classList.add('selected');
    this.state.selectedDate = dayNum;
    this.state.selectedMonth = month;
    this.state.selectedYear = year;
  }

  navigateMonth(direction) {
    if (direction === 'prev') {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    } else if (direction === 'next') {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    }
    this.updateCalendarDisplay();
  }

  // ==================== Event Binding ====================

  bindEvents() {
    this.bindNavigationEvents();
    this.bindDayClickEvents();
  }

  bindNavigationEvents() {
    const navButtons = document.querySelectorAll(SELECTORS.calendarNav);
    navButtons.forEach(btn => {
      const handler = (e) => {
        const direction = e.target.textContent.includes('‹') ? 'prev' : 'next';
        this.navigateMonth(direction);
      };
      btn.addEventListener('click', handler);
      this.listeners.push({ element: btn, event: 'click', handler });
    });
  }

  bindDayClickEvents() {
    // Day clicks are handled via event delegation in handleDayClick
    // Individual listeners are added in createDayElement
  }

  setupPageFocusListener() {
    const visibilityHandler = () => {
      if (!document.hidden && this.currentUserId) {
        this.loadUserEvents();
      }
    };

    const focusHandler = () => {
      if (this.currentUserId) {
        this.loadUserEvents();
      }
    };

    document.addEventListener('visibilitychange', visibilityHandler);
    window.addEventListener('focus', focusHandler);

    this.listeners.push(
      { element: document, event: 'visibilitychange', handler: visibilityHandler },
      { element: window, event: 'focus', handler: focusHandler }
    );
  }

  // ==================== Cleanup ====================

  destroy() {
    this.listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
      });
    this.listeners = [];
    this.events = [];
    this.elements = {};
  }

  // ==================== Getters ====================

  getSelectedDate() {
    return {
      date: this.state.selectedDate,
      month: this.state.selectedMonth,
      year: this.state.selectedYear
    };
  }

  getCurrentDate() {
    return new Date(this.currentDate);
  }

  getEvents() {
    return [...this.events];
  }
}

// Initialize calendar manager when DOM is ready
let calendarManager = null;

document.addEventListener('DOMContentLoaded', async () => {
  calendarManager = new CalendarManager();
  window.calendarManager = calendarManager;
  await calendarManager.init();
});

export default CalendarManager;
