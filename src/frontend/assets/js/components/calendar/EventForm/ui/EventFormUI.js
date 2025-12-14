/**
 * src/features/events/ui/EventFormUI.js
 * مسؤول عن DOM, تحديث الأزرار، عناوين المودال، فتح/إغلاق المودال، واستدعاءات بسيطة للـ flatpickr عبر FlatpickrManager
 */

export default class EventFormUI {
    constructor(selectors = {}) {
      this.selectors = Object.assign({
        eventModal: '#eventModal',
        eventForm: '#eventForm',
        closeModalBtn: '#closeEventModal',
        eventTitle: '#eventTitle',
        eventDate: '#eventDate',
        eventStart: '#eventStart',
        eventEnd: '#eventEnd',
        eventDescription: '#eventDescription',
        eventRepeat: '#eventRepeat'
      }, selectors);
  
      this.elements = {};
    }
  
    loadElements() {
      this.elements.eventModal = document.querySelector(this.selectors.eventModal);
      this.elements.eventForm = document.querySelector(this.selectors.eventForm);
      this.elements.closeModalBtn = document.querySelector(this.selectors.closeModalBtn);
      this.elements.modalTitle = this.elements.eventModal?.querySelector('h2') || null;
      this.elements.deleteBtn = document.querySelector('#deleteEventBtn');
  
      if (this.elements.eventForm) {
        this.elements.eventTitle = this.elements.eventForm.querySelector(this.selectors.eventTitle);
        this.elements.eventDate = this.elements.eventForm.querySelector(this.selectors.eventDate);
        this.elements.eventStart = this.elements.eventForm.querySelector(this.selectors.eventStart);
        this.elements.eventEnd = this.elements.eventForm.querySelector(this.selectors.eventEnd);
        this.elements.eventDescription = this.elements.eventForm.querySelector(this.selectors.eventDescription);
        this.elements.eventRepeat = this.elements.eventForm.querySelector(this.selectors.eventRepeat);
  
        this.elements.repeatInterval = document.getElementById('repeatInterval');
        this.elements.repeatFrequency = document.getElementById('repeatFrequency');
        this.elements.repeatEndType = document.getElementById('repeatEndType');
        this.elements.repeatCount = document.getElementById('repeatCount');
        this.elements.repeatUntil = document.getElementById('repeatUntil');
        this.elements.repeatMonthDay = document.getElementById('repeatMonthDay');
      }
    }
  
    updateSubmitButton(mode) {
      const submitBtn = this.elements.eventForm?.querySelector('button[type="submit"]');
      if (!submitBtn) return;
      if (mode === 'edit') {
        submitBtn.innerHTML = '<span class="btn-icon" aria-hidden="true"><i class="fa-solid fa-save"></i></span> حفظ التغييرات';
      } else {
        submitBtn.innerHTML = '<span class="btn-icon" aria-hidden="true"><i class="fa-solid fa-plus"></i></span> إضافة الحدث';
      }
    }
  
    updateModalTitle(title) {
      if (this.elements.modalTitle) this.elements.modalTitle.textContent = title;
    }
  
    openEventModal() {
      if (!this.elements.eventModal) return;
      this.elements.eventModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  
    closeEventModal() {
      if (!this.elements.eventModal) return;
      this.elements.eventModal.classList.remove('active');
      document.body.style.overflow = '';
      this.resetFormState();
    }
  
    resetFormState() {
      if (this.elements.eventForm) {
        this.elements.eventForm.dataset.mode = 'create';
        this.elements.eventForm.reset();
      }
      this.updateSubmitButton('create');
      this.updateModalTitle('إضافة حدث');
      if (this.elements.deleteBtn) this.elements.deleteBtn.style.display = 'none';
    }
  
    showDeleteButton(show) {
      if (this.elements.deleteBtn) {
        this.elements.deleteBtn.style.display = show ? 'inline-flex' : 'none';
      }
    }
  
    toggleCustomRepeat(show) {
      const customOptions = document.getElementById('customRepeatOptions');
      if (customOptions) customOptions.style.display = show ? 'block' : 'none';
    }
  
    populateFormForEvent(event) {
      if (!event) return;
      // Use existing form population logic but keep it simple; more complex conversion handled by manager if needed
      const startDate = event.startTime?.toDate ? event.startTime.toDate() : (event.startTime instanceof Date ? event.startTime : new Date(event.startTime));
  
      if (this.elements.eventTitle) this.elements.eventTitle.value = event.title || '';
  
      // date input (flatpickr should be used to set visual value)
      if (this.elements.eventDate) {
        try {
          // keep raw format; FlatpickrManager.syncFromForm will set actual flatpickr values
          this.elements.eventDate.value = startDate.toISOString().split('T')[0];
        } catch (err) {
          // ignore
        }
      }
  
      // times
      if (this.elements.eventStart) {
        if (event.allDay) this.elements.eventStart.value = '';
        else this.elements.eventStart.value = startDate.toTimeString().slice(0,5);
      }
  
      if (this.elements.eventEnd) {
        if (event.endTime) {
          const endDate = event.endTime?.toDate ? event.endTime.toDate() : (event.endTime instanceof Date ? event.endTime : new Date(event.endTime));
          this.elements.eventEnd.value = endDate.toTimeString().slice(0,5);
        } else {
          this.elements.eventEnd.value = '';
        }
      }
  
      if (this.elements.eventDescription) this.elements.eventDescription.value = event.description || '';
  
      // Repeat field - leave detailed parsing to RRuleBuilder or manager
      if (this.elements.eventRepeat) {
        if (event.rrule) {
          const presets = {
            'FREQ=DAILY': 'daily',
            'FREQ=WEEKLY': 'weekly',
            'FREQ=MONTHLY': 'monthly',
            'FREQ=YEARLY': 'yearly'
          };
          const isStd = presets[event.rrule];
          this.elements.eventRepeat.value = isStd || 'custom';
        } else {
          this.elements.eventRepeat.value = 'none';
        }
      }
  
      // update UI state
      if (this.elements.eventForm) this.elements.eventForm.dataset.mode = 'edit';
      this.updateSubmitButton('edit');
      this.updateModalTitle('تعديل حدث');
      this.showDeleteButton(true);
    }
  }
  