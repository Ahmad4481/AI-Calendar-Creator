/**
 * CalendarHandlers.js - معالجات أحداث التقويم
 */
export class CalendarHandlers {
  constructor(manager) {
    this.manager = manager;
  }
  
  handleSelect(info) {
    console.log('[CalendarHandlers] Handle select:', info);
    const fm = this.manager.eventFormManager;
    if (!fm) return;
    
    fm.resetFormState();
    
    // select event provides startStr
    const dateStr = info.startStr.split('T')[0];
    const dateObj = new Date(dateStr);
    
    if (fm.flatpickrInstances?.eventDate) {
      fm.flatpickrInstances.eventDate.setDate(dateObj, false);
    }
    
    fm.updateModalTitle('إضافة حدث');
    fm.openEventModal();
    
    this.manager.calendar?.unselect();
  }
  
  // يمكن حذف handleDateClick لأن select يقوم بنفس المهمة
  // handleDateClick(info) { ... }
  
  handleEventClick(info) {
    console.log('[CalendarHandlers] Handle event click:', info);
    
    const event = this.manager.events.find(e => e.id === info.event.id);
    if (event && this.manager.eventFormManager) {
      this.manager.eventFormManager.populateFormForEvent(event);
      console.log(this.manager.eventFormManager);
    }
  }
  
  handleEventMount(info) {
    // إضافة checkbox للإكمال
    const eventId = info.event.id;
    const event = this.manager.events.find(e => e.id === eventId);
    const completed = event?.completed || false;
    
    const el = info.el;
    if (!el) return;
    
    let container = el.querySelector('.event-completion-checkbox');
    if (!container) {
      container = document.createElement('div');
      container.className = 'event-completion-checkbox';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = completed;
      checkbox.dataset.eventId = eventId;
      
      checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        this.manager.toggleEventCompleted(eventId, e.target.checked, info.event.start);
      });
      
      container.appendChild(checkbox);
      container.addEventListener('click', e => e.stopPropagation());
      el.insertBefore(container, el.firstChild);
    }
  }
}