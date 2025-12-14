/**
 * CalendarInitializer.js - تهيئة FullCalendar
 */
import { Calendar } from '@fullcalendar/core';

export class CalendarInitializer {
  constructor(plugins) {
    this.plugins = plugins;
  }
  
  create(element, handlers) {
    console.log(handlers);
    console.log(element);
    if (!element) {
      console.error('Calendar element not found');
      return null;
    }
    
    const calendar = new Calendar(element, {
      plugins: this.plugins,
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
      select: (info) => handlers.handleSelect(info),
      eventClick: (info) => handlers.handleEventClick(info),
      eventDidMount: (info) => handlers.handleEventMount(info)
    });
    
    calendar.render();
    return calendar;
  }
  
  addEvents(calendar, events, converter) {
    events.forEach(evt => {
      const calendarEvent = converter.toFullCalendar(evt);
      calendar.addEvent(calendarEvent);
    });
  }
}