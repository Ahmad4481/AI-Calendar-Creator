/**
 * src/features/events/ui/FlatpickrManager.js
 * Thin wrapper حول flatpickr لتسهيل الاستخدام والاختبارات
 */
export default class FlatpickrManager {
    constructor(uiInstance) {
      this.ui = uiInstance;
      this.instances = {
        eventDate: null,
        eventStart: null,
        eventEnd: null
      };
    }
  
    init() {
      if (typeof flatpickr === 'undefined') {
        console.warn('Flatpickr not loaded');
        return;
      }
  
      if (flatpickr.l10ns && flatpickr.l10ns.ar) {
        flatpickr.localize(flatpickr.l10ns.ar);
      }
  
      const elDate = this.ui.elements?.eventDate;
      const elStart = this.ui.elements?.eventStart;
      const elEnd = this.ui.elements?.eventEnd;
  
      if (elDate && !elDate._flatpickr) {
        this.instances.eventDate = flatpickr(elDate, {
          dateFormat: "d/m/Y",
          enableTime: false,
          altInput: true,
          altFormat: "F j, Y",
          locale: "ar",
          weekNumbers: true,
          firstDayOfWeek: 6
        });
      } else if (elDate && elDate._flatpickr) {
        this.instances.eventDate = elDate._flatpickr;
      }
  
      if (elStart && !elStart._flatpickr) {
        this.instances.eventStart = flatpickr(elStart, {
          enableTime: true,
          noCalendar: true,
          dateFormat: "H:i",
          time_24hr: true,
          locale: "ar"
        });
      } else if (elStart && elStart._flatpickr) {
        this.instances.eventStart = elStart._flatpickr;
      }
  
      if (elEnd && !elEnd._flatpickr) {
        this.instances.eventEnd = flatpickr(elEnd, {
          enableTime: true,
          noCalendar: true,
          dateFormat: "H:i",
          time_24hr: true,
          locale: "ar"
        });
      } else if (elEnd && elEnd._flatpickr) {
        this.instances.eventEnd = elEnd._flatpickr;
      }
    }
  
    clearAll() {
      Object.values(this.instances).forEach(inst => {
        if (inst && typeof inst.clear === 'function') inst.clear();
      });
    }
  
    getDate() {
      const inst = this.instances.eventDate;
      if (!inst) return null;
      return inst.selectedDates[0] || null;
    }
  
    getTime(which = 'start') {
      const inst = which === 'start' ? this.instances.eventStart : this.instances.eventEnd;
      if (!inst) return null;
      const sel = inst.selectedDates[0];
      if (!sel) return null;
      return sel.toTimeString().slice(0,5);
    }
  
    // helper to sync flatpickr values from raw input fields (used when populating form)
    syncFromForm() {
      const instDate = this.instances.eventDate;
      const instStart = this.instances.eventStart;
      const instEnd = this.instances.eventEnd;
  
      try {
        const rawDate = this.ui.elements?.eventDate?.value;
        if (instDate && rawDate) instDate.setDate(new Date(rawDate), false);
  
        const rawStart = this.ui.elements?.eventStart?.value;
        if (instStart && rawStart) instStart.setDate(new Date(`${rawDate}T${rawStart}:00`), false);
  
        const rawEnd = this.ui.elements?.eventEnd?.value;
        if (instEnd && rawEnd) instEnd.setDate(new Date(`${rawDate}T${rawEnd}:00`), false);
      } catch (err) {
        // ignore parsing issues
      }
    }
  }
  