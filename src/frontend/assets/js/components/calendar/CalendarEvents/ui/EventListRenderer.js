/**
 * EventListRenderer.js - عرض قائمة الأحداث الجانبية
 */
export class EventListRenderer {
    constructor(containerSelector = '#eventList') {
      this.containerSelector = containerSelector;
    }
    
    render(events, options = {}) {
      console.log(events);
      const container = document.querySelector(this.containerSelector);
      if (!container) return;
      
      container.innerHTML = '';
      
      if (!events || events.length === 0) {
        container.innerHTML = '<p class="no-events">لا توجد أحداث</p>';
        return;
      }
      
      // ترتيب حسب التاريخ
      const sorted = [...events].sort((a, b) => {
        const dateA = a.startTime?.toDate?.() || new Date(a.startTime);
        const dateB = b.startTime?.toDate?.() || new Date(b.startTime);
        return dateA - dateB;
      });
      
      // تجميع حسب اليوم
      const grouped = this.groupByDate(sorted);
      
      for (const [dateKey, dayEvents] of Object.entries(grouped)) {
        const daySection = this.createDaySection(dateKey, dayEvents);
        container.appendChild(daySection);
      }
    }
    
    groupByDate(events) {
      const groups = {};
      events.forEach(event => {
        const date = event.startTime?.toDate?.() || new Date(event.startTime);
        const key = date.toDateString();
        if (!groups[key]) groups[key] = [];
        groups[key].push(event);
      });
      return groups;
    }
    
    createDaySection(dateKey, events) {
      const section = document.createElement('div');
      section.className = 'day-section';
      
      const header = document.createElement('h4');
      header.textContent = this.formatDateHeader(new Date(dateKey));
      section.appendChild(header);
      
      events.forEach(event => {
        section.appendChild(this.createEventItem(event));
      });
      
      return section;
    }
    
    createEventItem(event) {
      const item = document.createElement('div');
      item.className = `event-item ${event.completed ? 'completed' : ''}`;
      item.dataset.eventId = event.id;
      
      const time = event.startTime?.toDate?.() || new Date(event.startTime);
      const timeStr = time.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
      
      item.innerHTML = `
        <span class="event-time">${timeStr}</span>
        <span class="event-title">${event.title}</span>
      `;
      
      return item;
    }
    
    formatDateHeader(date) {
      return date.toLocaleDateString('ar-SA', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
    }
  }