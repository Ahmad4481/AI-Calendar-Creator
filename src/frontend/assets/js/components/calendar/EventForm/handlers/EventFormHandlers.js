/**
 * src/features/events/handlers/EventFormHandlers.js
 * يربط UI events بالحالة والمنطق
 */
const EventFormHandlers = {
    bindAll({ manager, ui, service, rruleBuilder }) {
      // ensure elements loaded
      if (!ui || !ui.elements) ui.loadElements();
  
      // Bind repeat select toggles
      document.getElementById('eventRepeat')?.addEventListener('change', (e) => {
        const customOptions = document.getElementById('customRepeatOptions');
        if (customOptions) {
          customOptions.style.display = e.target.value === 'custom' ? 'block' : 'none';
        }
      });
  
      document.getElementById('repeatFrequency')?.addEventListener('change', (e) => {
        const weeklyContainer = document.getElementById('weeklyDaysContainer');
        const monthlyContainer = document.getElementById('monthlyDayContainer');
  
        if (weeklyContainer) weeklyContainer.style.display = e.target.value === 'WEEKLY' ? 'block' : 'none';
        if (monthlyContainer) monthlyContainer.style.display = e.target.value === 'MONTHLY' ? 'block' : 'none';
      });
  
      document.getElementById('repeatEndType')?.addEventListener('change', (e) => {
        const countContainer = document.getElementById('repeatCountContainer');
        const untilContainer = document.getElementById('repeatUntilContainer');
  
        if (countContainer) countContainer.style.display = e.target.value === 'count' ? 'block' : 'none';
        if (untilContainer) untilContainer.style.display = e.target.value === 'until' ? 'block' : 'none';
      });
  
      // Form submit
      ui.elements.eventForm?.addEventListener('submit', (e) => {
        manager.handleFormSubmit(e);
      });
  
      // Close modal
      ui.elements.closeModalBtn?.addEventListener('click', () => ui.closeEventModal());
  
      // Overlay click
      ui.elements.eventModal?.addEventListener('click', (e) => {
        if (e.target === ui.elements.eventModal) ui.closeEventModal();
      });
  
      // Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && ui.elements.eventModal?.classList.contains('active')) ui.closeEventModal();
      });
  
      // Delete button
      ui.elements.deleteBtn?.addEventListener('click', () => {
        if (manager.editingId) {
          if (confirm('هل أنت متأكد من حذف هذا الحدث؟')) {
            manager.deleteEvent(manager.editingId);
          }
        }
      });
    }
  };
  
  export default EventFormHandlers;
  