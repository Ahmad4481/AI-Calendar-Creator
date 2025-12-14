/**
 * src/features/events/services/EventFormService.js
 * من مسؤوليات: getFormData, validateFormData, buildEventData
 */
import { Timestamp } from '../../../../core/firebase/firebase-exports.js';

export default class EventFormService {
  constructor({ flatpickr = null, rruleBuilder = null, ui = null } = {}) {
    this.flatpickr = flatpickr;
    this.rruleBuilder = rruleBuilder;
    this.ui = ui;
  }

  getFormData() {
    const elements = this.ui.elements || {};

    // Date
    let dateValue = '';
    if (this.flatpickr && this.flatpickr.getDate) {
      const d = this.flatpickr.getDate();
      dateValue = d ? d.toISOString().split('T')[0] : (elements.eventDate?.value || '');
    } else {
      dateValue = elements.eventDate?.value || '';
    }

    // Start time
    let startTimeValue = '';
    if (this.flatpickr && this.flatpickr.getTime) {
      const t = this.flatpickr.getTime('start');
      startTimeValue = t || (elements.eventStart?.value || '');
    } else {
      startTimeValue = elements.eventStart?.value || '';
    }

    // End time
    let endTimeValue = '';
    if (this.flatpickr && this.flatpickr.getTime) {
      const t = this.flatpickr.getTime('end');
      endTimeValue = t || (elements.eventEnd?.value || '');
    } else {
      endTimeValue = elements.eventEnd?.value || '';
    }

    return {
      title: elements.eventTitle?.value?.trim() || '',
      date: dateValue,
      startTime: startTimeValue,
      endTime: endTimeValue,
      description: elements.eventDescription?.value?.trim() || '',
      repeat: elements.eventRepeat?.value || 'none',
      // repeat details accessed where needed by buildEventData via ui elements
      completed: false
    };
  }

  validateFormData(formData) {
    if (!formData.title) {
      this._error('يرجى إدخال عنوان الحدث');
      return false;
    }
    if (!formData.date) {
      this._error('يرجى اختيار تاريخ الحدث');
      return false;
    }
    return true;
  }

  _error(msg) {
    const mgr = (typeof window !== 'undefined' && window.messageManager) ? window.messageManager : null;
    if (mgr && typeof mgr.error === 'function') mgr.error(msg);
    else console.warn(msg);
  }

  buildEventData(formData) {
    const elements = this.ui.elements || {};
    const { date, startTime, endTime, title, description, repeat } = formData;

    // build start timestamp
    const startDateTimeStr = startTime ? `${date}T${startTime}:00` : `${date}T00:00:00`;
    const startDateTime = new Date(startDateTimeStr);
    const startTimestamp = Timestamp.fromDate(startDateTime);

    // end timestamp + duration
    let endTimestamp = null;
    let duration = null;

    if (endTime) {
      const endDateTime = new Date(`${date}T${endTime}:00`);
      endTimestamp = Timestamp.fromDate(endDateTime);

      if (startTime) {
        const diffMs = endDateTime - startDateTime;
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffMins = Math.floor((diffMs % 3600000) / 60000);
        duration = `${String(diffHrs).padStart(2, '0')}:${String(diffMins).padStart(2, '0')}`;
      }
    } else if (startTime) {
      const est = new Date(startDateTime);
      est.setHours(est.getHours() + 1);
      endTimestamp = Timestamp.fromDate(est);
      duration = '01:00';
    }

    // Build rrule using builder and ui details
    const rrule = this.rruleBuilder ? this.rruleBuilder.build({
      repeat,
      interval: elements.repeatInterval?.value,
      frequency: elements.repeatFrequency?.value,
      endType: elements.repeatEndType?.value,
      count: elements.repeatCount?.value,
      until: elements.repeatUntil?.value,
      days: Array.from(document.querySelectorAll('input[name="repeatDays"]:checked')).map(cb => cb.value),
      monthDay: elements.repeatMonthDay?.value
    }) : null;

    return {
      title,
      description,
      startTime: startTimestamp,
      endTime: endTimestamp,
      allDay: !startTime && !endTime,
      checked: false,
      rrule: rrule,
      duration
    };
  }
}
