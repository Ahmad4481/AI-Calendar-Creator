/**
 * Calendar Events Manager
 * Manages calendar events with FullCalendar integration
 */
class CalendarEventsManager {
  constructor() {
    this.storageKey = 'ai-calendar-events';
    this.events = [];
    this.editingId = null;
    this.calendar = null;
    
    // DOM elements
    this.elements = {
      calendar: null,
      eventForm: null,
      openModalBtn: null,
      eventModal: null,
      closeModalBtn: null,
      modalTitle: null,
      eventList: null,
      clearEventsBtn: null,
      addSystemTrigger: null
    };
    
    this.categoryLabels = {
      meeting: 'اجتماع',
      task: 'مهمة',
      reminder: 'تذكير',
      personal: 'شخصي'
    };
    
    this.init();
  }

  /**
   * Initialize the calendar events manager
   */
  init() {
    this.loadElements();
    this.loadEvents();
    this.bindEvents();
    this.initCalendar();
    this.renderEventList();
  }

  /**
   * Load DOM elements
   */
  loadElements() {
    this.elements.calendar = document.getElementById('eventCalendar');
    this.elements.eventForm = document.getElementById('eventForm');
    this.elements.openModalBtn = document.getElementById('openEventModalBtn');
    this.elements.eventModal = document.getElementById('eventModal');
    this.elements.closeModalBtn = document.getElementById('closeEventModal');
    this.elements.modalTitle = this.elements.eventModal?.querySelector('h2');
    this.elements.eventList = document.getElementById('eventList');
    this.elements.clearEventsBtn = document.getElementById('clearEventsBtn');
    this.elements.addSystemTrigger = document.getElementById('addSystemTrigger');

    // Validate required elements
    if (!this.elements.calendar || !this.elements.eventForm || !window.FullCalendar) {
      console.error('Calendar Events Manager: Required elements not found');
      return false;
    }
    return true;
  }

  /**
   * Load events from localStorage
   */
  loadEvents() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        this.events = [];
        return;
      }
      const parsed = JSON.parse(stored);
      this.events = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Failed to load events from storage:', error);
      this.events = [];
    }
  }

  /**
   * Save events to localStorage
   */
  saveEvents() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.events));
    } catch (error) {
      console.error('Failed to save events to storage:', error);
      this.showMessage('فشل في حفظ الأحداث', 'error');
    }
  }

  /**
   * Create unique event ID
   */
  createEventId() {
    return `evt-${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
  }

  /**
   * Format date label in Arabic
   */
  formatDateLabel(date, options = {}) {
    if (!date) return '';
    return new Intl.DateTimeFormat('ar', options).format(date);
  }

  /**
   * Get date from event object
   */
  getDateFromEvent(event) {
    if (!event) return null;
    const base = event.allDay ? `${event.start}T00:00` : event.start;
    return new Date(base);
  }

  /**
   * Build calendar event object for FullCalendar
   */
  buildCalendarEvent(event) {
    return {
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end || undefined,
      allDay: Boolean(event.allDay),
      extendedProps: {
        category: event.category,
        description: event.description || ''
      }
    };
  }

  /**
   * Initialize FullCalendar
   */
  initCalendar() {
    if (!this.elements.calendar) return;

    this.calendar = new FullCalendar.Calendar(this.elements.calendar, {
      initialView: 'dayGridMonth',
      height: 'auto',
      locale: 'ar',
      direction: 'rtl',
      selectable: true,
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,listWeek'
      },
      select: (info) => this.handleCalendarSelect(info),
      dateClick: (info) => this.handleDateClick(info),
      eventClick: (info) => this.handleEventClick(info),
      eventDidMount: (info) => this.handleEventMount(info)
    });

    // Add existing events to calendar
    this.events.forEach((event) => {
      this.calendar.addEvent(this.buildCalendarEvent(event));
    });

    this.calendar.render();
  }

  /**
   * Handle calendar date selection
   */
  handleCalendarSelect(info) {
    this.resetFormState();
    this.elements.eventForm.dataset.mode = 'create';
    this.updateSubmitButton('create');
    
    const dateValue = info.startStr;
    const [datePart] = dateValue.split('T');
    this.elements.eventForm.eventDate.value = datePart;
    this.elements.eventForm.eventStart.value = '';
    this.elements.eventForm.eventEnd.value = '';
    
    this.updateModalTitle('إضافة حدث');
    this.calendar.unselect();
    this.openEventModal();
  }

  /**
   * Handle date click
   */
  handleDateClick(info) {
    const [datePart] = info.dateStr.split('T');
    this.elements.eventForm.eventDate.value = datePart;
    this.elements.eventForm.eventStart.focus();
    this.updateModalTitle('إضافة حدث');
    this.openEventModal();
  }

  /**
   * Handle event click
   */
  handleEventClick(info) {
    const event = this.events.find((item) => item.id === info.event.id);
    if (event) {
      this.populateFormForEvent(event);
    }
  }

  /**
   * Handle event mount
   */
  handleEventMount(info) {
    const category = info.event.extendedProps.category;
    if (category) {
      info.el.classList.add(`event-category-${category}`);
    }
  }

  /**
   * Populate form with event data for editing
   */
  populateFormForEvent(event) {
    if (!event) return;

    this.elements.eventForm.eventTitle.value = event.title;
    this.elements.eventForm.eventDate.value = event.allDay ? event.start : event.start.split('T')[0];
    this.elements.eventForm.eventStart.value = event.allDay ? '' : (event.start.split('T')[1] || '').slice(0, 5);
    this.elements.eventForm.eventEnd.value = event.end ? (event.end.split('T')[1] || '').slice(0, 5) : '';
    this.elements.eventForm.eventCategory.value = event.category || 'meeting';
    this.elements.eventForm.eventDescription.value = event.description || '';
    
    this.editingId = event.id;
    this.elements.eventForm.dataset.mode = 'edit';
    this.updateSubmitButton('edit');
    this.updateModalTitle('تعديل حدث');
    this.elements.eventForm.eventTitle.focus();
    this.openEventModal();
  }

  /**
   * Update submit button text and icon
   */
  updateSubmitButton(mode) {
    const submitBtn = this.elements.eventForm.querySelector('button[type="submit"]');
    if (!submitBtn) return;

    if (mode === 'edit') {
      submitBtn.innerHTML = '<span class="btn-icon" aria-hidden="true"><i class="fa-solid fa-save"></i></span> حفظ التغييرات';
    } else {
      submitBtn.innerHTML = '<span class="btn-icon" aria-hidden="true"><i class="fa-solid fa-plus"></i></span> إضافة الحدث';
    }
  }

  /**
   * Update modal title
   */
  updateModalTitle(title) {
    if (this.elements.modalTitle) {
      this.elements.modalTitle.textContent = title;
    }
  }

  /**
   * Open event modal
   */
  openEventModal() {
    if (!this.elements.eventModal) return;
    this.elements.eventModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close event modal
   */
  closeEventModal() {
    if (!this.elements.eventModal) return;
    this.elements.eventModal.classList.remove('active');
    document.body.style.overflow = '';
    this.resetFormState();
  }

  /**
   * Reset form state
   */
  resetFormState() {
    this.editingId = null;
    this.elements.eventForm.dataset.mode = 'create';
    this.elements.eventForm.reset();
    this.updateSubmitButton('create');
    this.updateModalTitle('إضافة حدث');
  }

  /**
   * Render event list
   */
  renderEventList() {
    if (!this.elements.eventList) return;

    this.elements.eventList.innerHTML = '';
    
    if (!this.events.length) {
      this.elements.eventList.classList.add('empty');
      this.elements.eventList.innerHTML = '<p class="empty-placeholder">لا توجد أحداث بعد. قم بإضافة أول حدث لك!</p>';
      if (this.elements.clearEventsBtn) {
        this.elements.clearEventsBtn.disabled = true;
      }
      return;
    }

    this.elements.eventList.classList.remove('empty');
    if (this.elements.clearEventsBtn) {
      this.elements.clearEventsBtn.disabled = false;
    }

    const sortedEvents = [...this.events].sort((a, b) => {
      const dateA = this.getDateFromEvent(a)?.getTime() ?? 0;
      const dateB = this.getDateFromEvent(b)?.getTime() ?? 0;
      return dateA - dateB;
    });

    const timeFormatter = new Intl.DateTimeFormat('ar', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    sortedEvents.forEach((event) => {
      const eventElement = this.createEventElement(event, timeFormatter);
      this.elements.eventList.appendChild(eventElement);
    });
  }

  /**
   * Create event element for the list
   */
  createEventElement(event, timeFormatter) {
    const item = document.createElement('div');
    item.className = 'event-item';

    const startDate = this.getDateFromEvent(event);
    const endDate = event.end ? new Date(event.end) : null;
    const dateLabel = startDate ? this.formatDateLabel(startDate, { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    }) : '';
    
    const startTimeLabel = (!event.allDay && startDate) ? 
      timeFormatter.format(startDate) : 'طوال اليوم';
    const endTimeLabel = endDate ? timeFormatter.format(endDate) : '';

    // Header with title and badge
    const header = document.createElement('div');
    header.className = 'event-item-header';

    const title = document.createElement('div');
    title.className = 'event-item-title';
    title.textContent = event.title;
    header.appendChild(title);

    const badge = document.createElement('span');
    badge.className = `event-badge ${event.category || ''}`.trim();
    badge.innerHTML = `<i class="fa-solid fa-tag"></i> ${this.categoryLabels[event.category] || 'أخرى'}`;
    header.appendChild(badge);
    item.appendChild(header);

    // Meta information
    const meta = document.createElement('div');
    meta.className = 'event-item-meta';
    meta.innerHTML = `
      <span><i class="fa-regular fa-calendar"></i> ${dateLabel}</span>
      <span><i class="fa-regular fa-clock"></i> ${event.allDay ? 'طوال اليوم' : startTimeLabel}${endTimeLabel ? ' - ' + endTimeLabel : ''}</span>
    `;
    item.appendChild(meta);

    // Description
    if (event.description) {
      const description = document.createElement('p');
      description.textContent = event.description;
      description.style.fontSize = 'var(--text-sm)';
      description.style.color = 'var(--muted-foreground)';
      item.appendChild(description);
    }

    // Actions
    const actions = document.createElement('div');
    actions.className = 'event-actions';
    actions.innerHTML = `
      <button type="button" class="edit-event" data-id="${event.id}" title="تعديل">
        <i class="fa-solid fa-pen"></i>
      </button>
      <button type="button" class="delete-event" data-id="${event.id}" title="حذف">
        <i class="fa-solid fa-trash"></i>
      </button>
    `;
    item.appendChild(actions);

    return item;
  }

  /**
   * Handle form submission
   */
  handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = this.getFormData();
    if (!this.validateFormData(formData)) return;

    const eventData = this.buildEventData(formData);
    
    if (this.editingId) {
      this.updateEvent(eventData);
    } else {
      this.createEvent(eventData);
    }

    this.saveEvents();
    this.renderEventList();
    this.closeEventModal();
  }

  /**
   * Get form data
   */
  getFormData() {
    return {
      title: this.elements.eventForm.eventTitle.value.trim(),
      date: this.elements.eventForm.eventDate.value,
      startTime: this.elements.eventForm.eventStart.value,
      endTime: this.elements.eventForm.eventEnd.value,
      category: this.elements.eventForm.eventCategory.value,
      description: this.elements.eventForm.eventDescription.value.trim()
    };
  }

  /**
   * Validate form data
   */
  validateFormData(data) {
    if (!data.title || !data.date) {
      this.showMessage('يرجى ملء العنوان والتاريخ', 'error');
      return false;
    }

    if (data.startTime && data.endTime) {
      const startDate = new Date(`${data.date}T${data.startTime}`);
      const endDate = new Date(`${data.date}T${data.endTime}`);
      if (endDate <= startDate) {
        this.showMessage('يجب أن يكون وقت النهاية بعد وقت البداية', 'error');
        return false;
      }
    }

    return true;
  }

  /**
   * Build event data object
   */
  buildEventData(formData) {
    const allDay = !formData.startTime;
    const start = allDay ? formData.date : `${formData.date}T${formData.startTime}`;
    const end = formData.endTime ? `${formData.date}T${formData.endTime}` : null;

    return {
      title: formData.title,
      start,
      end,
      allDay,
      category: formData.category,
      description: formData.description
    };
  }

  /**
   * Create new event
   */
  createEvent(eventData) {
    const newEvent = {
      id: this.createEventId(),
      ...eventData
    };
    
    this.events.push(newEvent);
    this.calendar.addEvent(this.buildCalendarEvent(newEvent));
    this.showMessage('تم إضافة الحدث بنجاح', 'success');
  }

  /**
   * Update existing event
   */
  updateEvent(eventData) {
    this.events = this.events.map((event) => {
      if (event.id !== this.editingId) return event;
      return { ...event, ...eventData };
    });

    const existingEvent = this.calendar.getEventById(this.editingId);
    if (existingEvent) {
      existingEvent.setProp('title', eventData.title);
      existingEvent.setStart(eventData.start, { maintainDuration: false });
      if (eventData.end) {
        existingEvent.setEnd(eventData.end);
      } else {
        existingEvent.setEnd(null);
      }
      existingEvent.setAllDay(eventData.allDay);
      existingEvent.setExtendedProp('category', eventData.category);
      existingEvent.setExtendedProp('description', eventData.description);
    }
    
    this.showMessage('تم تحديث الحدث بنجاح', 'success');
  }

  /**
   * Handle event list click
   */
  handleEventListClick(e) {
    const button = e.target.closest('button[data-id]');
    if (!button) return;

    const { id } = button.dataset;
    const targetEvent = this.events.find((event) => event.id === id);
    if (!targetEvent) return;

    if (button.classList.contains('delete-event')) {
      this.deleteEvent(id);
    } else if (button.classList.contains('edit-event')) {
      this.populateFormForEvent(targetEvent);
    }
  }

  /**
   * Delete event
   */
  deleteEvent(id) {
    if (!confirm('هل تريد حذف هذا الحدث؟')) return;
    
    this.events = this.events.filter((event) => event.id !== id);
    const calendarEvent = this.calendar.getEventById(id);
    calendarEvent?.remove();
    
    this.saveEvents();
    this.renderEventList();
    
    if (this.editingId === id) {
      this.closeEventModal();
    }
    
    this.showMessage('تم حذف الحدث بنجاح', 'success');
  }

  /**
   * Clear all events
   */
  clearAllEvents() {
    if (!this.events.length) return;
    if (!confirm('سيتم مسح جميع الأحداث. هل أنت متأكد؟')) return;
    
    this.events = [];
    this.saveEvents();
    this.calendar.getEvents().forEach((event) => event.remove());
    this.renderEventList();
    this.closeEventModal();
    
    this.showMessage('تم مسح جميع الأحداث', 'success');
  }

  /**
   * Show message to user
   */
  showMessage(message, type = 'info') {
    // Remove existing messages
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
      existingMessage.remove();
    }
    
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.textContent = message;
    
    // Add to page
    document.body.appendChild(messageEl);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      messageEl.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        if (messageEl.parentNode) {
          messageEl.remove();
        }
      }, 300);
    }, 3000);
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Modal events
    this.elements.openModalBtn?.addEventListener('click', () => {
      this.resetFormState();
      this.openEventModal();
    });

    this.elements.closeModalBtn?.addEventListener('click', () => {
      this.closeEventModal();
    });

    this.elements.eventModal?.addEventListener('click', (e) => {
      if (e.target === this.elements.eventModal) {
        this.closeEventModal();
      }
    });

    // Form submission
    this.elements.eventForm?.addEventListener('submit', (e) => {
      this.handleFormSubmit(e);
    });

    // Event list interactions
    this.elements.eventList?.addEventListener('click', (e) => {
      this.handleEventListClick(e);
    });

    // Clear all events
    this.elements.clearEventsBtn?.addEventListener('click', () => {
      this.clearAllEvents();
    });

    // Add system trigger
    this.elements.addSystemTrigger?.addEventListener('click', () => {
      const addBtn = document.getElementById('addCalendarBtn');
      if (addBtn) {
        addBtn.click();
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.elements.eventModal?.classList.contains('active')) {
        this.closeEventModal();
      }
    });
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new CalendarEventsManager();
});