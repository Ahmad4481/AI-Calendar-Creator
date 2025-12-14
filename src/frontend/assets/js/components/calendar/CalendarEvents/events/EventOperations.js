/**
 * EventOperations.js - عمليات CRUD على الأحداث
 */
import { Timestamp } from '../../../../core/firebase/firebase-exports.js';
import { RRule } from 'rrule';

export class EventOperations {
  constructor(eventService) {
    this.eventService = eventService;
  }
  
  async create(userId, eventData) {
    const firebaseEvent = {
      title: eventData.title,
      description: eventData.description || '',
      startTime: eventData.start ? Timestamp.fromDate(new Date(eventData.start)) : null,
      endTime: eventData.end ? Timestamp.fromDate(new Date(eventData.end)) : null,
      completed: false,
      rrule: eventData.rrule || null,
      exdates: eventData.exdates || []
    };
    
    const result = await this.eventService.addEvent(userId, firebaseEvent);
    return { id: result.id, ...firebaseEvent };
  }
  
  async update(userId, eventId, updates) {
    const firebaseUpdates = { ...updates };
    
    if (updates.start) {
      firebaseUpdates.startTime = Timestamp.fromDate(new Date(updates.start));
      delete firebaseUpdates.start;
    }
    if (updates.end) {
      firebaseUpdates.endTime = Timestamp.fromDate(new Date(updates.end));
      delete firebaseUpdates.end;
    }

    await this.eventService.updateEvent(userId, eventId, firebaseUpdates);
  }
  
  async delete(userId, eventId) {
    await this.eventService.deleteEvent(userId, eventId);
  }
  
  async toggleComplete(userId, eventId, completed) {
    await this.eventService.updateEvent(userId, eventId, { completed });
  }
  
  async clearAll(userId, events) {
    const promises = events.map(e => this.delete(userId, e.id));
    await Promise.all(promises);
  }

  // ==========================================
  // Recurring Event Operations
  // ==========================================

  /**
   * Handle recurring event updates/deletions/completions
   * @param {string} userId 
   * @param {object} originalEvent The original recurring event object (from DB/Memory)
   * @param {Date} instanceDate The date of the specific instance being acted upon
   * @param {string} mode 'this' | 'future' | 'all'
   * @param {string} action 'update' | 'delete' | 'complete'
   * @param {object} updates Data updates (for update action) or completed status (for complete)
   */
  async handleRecurringAction(userId, originalEvent, instanceDate, mode, action, updates = {}) {
    if (mode === 'all') {
      if (action === 'delete') {
        return this.delete(userId, originalEvent.id);
      } else if (action === 'update') {
        // Apply updates to the main event
        // Note: startTime usually stays the same for 'all', but if user shifted time, 
        // we might need to adjust startTime of original event. 
        // For simplicity, we assume updates contains generic fields or we just update what's passed.
        // If user changed time of one instance and said "all", FullCalendar usually passes the new start time.
        return this.update(userId, originalEvent.id, updates);
      } else if (action === 'complete') {
        return this.toggleComplete(userId, originalEvent.id, updates.completed);
      }
    }

    if (mode === 'this') {
      console.log('[EventOperations] Mode: this, Action:', action);
      console.log('[EventOperations] Original event:', originalEvent);
      console.log('[EventOperations] Instance date:', instanceDate);
      console.log('[EventOperations] Updates:', updates);
      
      // 1. Exclude this date from original
      await this._addExdate(userId, originalEvent, instanceDate);

      if (action === 'delete') {
        // Done (just excluded)
        return;
      }

      // 2. Create new single event for this instance
      // تحويل updates من startTime/endTime إلى start/end إذا لزم الأمر
      const processedUpdates = { ...updates };
      
      // تحويل startTime إلى start
      if (processedUpdates.startTime && !processedUpdates.start) {
        console.log('[EventOperations] Converting startTime to start:', processedUpdates.startTime);
        if (processedUpdates.startTime.toDate && typeof processedUpdates.startTime.toDate === 'function') {
          processedUpdates.start = processedUpdates.startTime.toDate();
        } else if (processedUpdates.startTime instanceof Date) {
          processedUpdates.start = processedUpdates.startTime;
        } else if (processedUpdates.startTime.seconds !== undefined) {
          processedUpdates.start = new Date(processedUpdates.startTime.seconds * 1000);
        } else {
          processedUpdates.start = new Date(processedUpdates.startTime);
        }
        delete processedUpdates.startTime;
        console.log('[EventOperations] Converted start:', processedUpdates.start);
      }
      
      // تحويل endTime إلى end
      if (processedUpdates.endTime && !processedUpdates.end) {
        console.log('[EventOperations] Converting endTime to end:', processedUpdates.endTime);
        if (processedUpdates.endTime.toDate && typeof processedUpdates.endTime.toDate === 'function') {
          processedUpdates.end = processedUpdates.endTime.toDate();
        } else if (processedUpdates.endTime instanceof Date) {
          processedUpdates.end = processedUpdates.endTime;
        } else if (processedUpdates.endTime.seconds !== undefined) {
          processedUpdates.end = new Date(processedUpdates.endTime.seconds * 1000);
        } else {
          processedUpdates.end = new Date(processedUpdates.endTime);
        }
        delete processedUpdates.endTime;
        console.log('[EventOperations] Converted end:', processedUpdates.end);
      }

      // حساب المدة من الحدث الأصلي
      let duration = 0;
      if (originalEvent.endTime && originalEvent.startTime) {
        const startMs = originalEvent.startTime.toMillis ? originalEvent.startTime.toMillis() :
                       (originalEvent.startTime.seconds ? originalEvent.startTime.seconds * 1000 :
                       (originalEvent.startTime instanceof Date ? originalEvent.startTime.getTime() : 0));
        const endMs = originalEvent.endTime.toMillis ? originalEvent.endTime.toMillis() :
                     (originalEvent.endTime.seconds ? originalEvent.endTime.seconds * 1000 :
                     (originalEvent.endTime instanceof Date ? originalEvent.endTime.getTime() : 0));
        duration = endMs - startMs;
        console.log('[EventOperations] Calculated duration:', duration, 'ms');
      } else {
        // افتراضي: ساعة واحدة
        duration = 3600000;
        console.log('[EventOperations] Using default duration: 1 hour');
      }

      // تحديد start و end للحدث الجديد
      const newStart = processedUpdates.start ? new Date(processedUpdates.start) : instanceDate;
      const newEnd = processedUpdates.end ? new Date(processedUpdates.end) : 
                    (duration > 0 ? new Date(newStart.getTime() + duration) : null);

      console.log('[EventOperations] New event start:', newStart);
      console.log('[EventOperations] New event end:', newEnd);

      // بناء بيانات الحدث الجديد
      const newEventData = {
        title: processedUpdates.title || originalEvent.title,
        description: processedUpdates.description !== undefined ? processedUpdates.description : originalEvent.description,
        start: newStart,
        end: newEnd,
        rrule: null,   // Single event
        exdates: [],
        recurring: false
      };

      // Ensure completed status is set if action is complete
      if (action === 'complete') {
        newEventData.completed = processedUpdates.completed;
      }

      console.log('[EventOperations] New event data:', newEventData);
      const result = await this.create(userId, newEventData);
      console.log('[EventOperations] Created event result:', result);
      return result;
    }

    if (mode === 'future') {
      // 1. Update original event to end before this instance
      const untilDate = new Date(instanceDate);
      untilDate.setDate(untilDate.getDate() - 1);
      
      const newRRuleOriginal = this._updateRRuleUntil(originalEvent.rrule, untilDate);
      await this.update(userId, originalEvent.id, { rrule: newRRuleOriginal });

      if (action === 'delete') {
        // Done (cut off future)
        return;
      }

      // 2. Create new recurring event starting from this instance
      const newEventData = {
        ...originalEvent,
        ...updates,
        id: undefined,
        exdates: [] // Reset exceptions for the new series
      };

      // Adjust start time to this instance
      const newStart = updates.start ? new Date(updates.start) : instanceDate;
      // Recalculate duration
      const duration = originalEvent.endTime.toMillis() - originalEvent.startTime.toMillis();
      const newEnd = updates.end ? new Date(updates.end) : new Date(newStart.getTime() + duration);
      
      newEventData.start = newStart;
      newEventData.end = newEnd;

      // Adjust RRule to start from newStart
      // We effectively remove UNTIL from old rrule (or keep it if it was there? No, we need new series)
      // If original had count, we might need to adjust? 
      // For simplicity: Create new RRule string based on updates or keep frequency
      // If we just keep the same rrule string (without UNTIL/COUNT potentially), it will restart from new dtstart.
      // But we must ensure old UNTIL/COUNT are handled if they existed. 
      // Simplified: Just use the original RRule string but ensure no conflicting UNTIL/COUNT if needed.
      // Actually, standard practice: keep rrule properties (FREQ, INTERVAL...) but let DTSTART (which is implicit in event start) drive it.
      // We just need to make sure we don't carry over an old UNTIL that is BEFORE the new start.
      
      // If we had an UNTIL in original, we keep it in new series? Yes.
      // If we had COUNT, we technically should reduce it. That's complex. 
      // For now, let's copy RRule string as is, assuming FullCalendar/RRule handles re-calc based on new StartTime.
      
      if (action === 'complete') {
        newEventData.completed = updates.completed;
      }

      return this.create(userId, newEventData);
    }
  }

  async _addExdate(userId, event, date) {
    // التحقق من صحة التاريخ
    if (!date) {
      console.error('[EventOperations] _addExdate: date is null or undefined');
      throw new Error('تاريخ غير صالح');
    }

    // تحويل إلى Date إذا لم يكن Date object
    let dateObj = null;
    if (date instanceof Date) {
      dateObj = date;
    } else if (date.toDate && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    } else if (date.seconds !== undefined) {
      dateObj = new Date(date.seconds * 1000);
    } else if (typeof date === 'string' || typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      console.error('[EventOperations] _addExdate: Invalid date format:', date);
      throw new Error('تنسيق التاريخ غير صالح');
    }

    // التحقق من صحة Date object
    if (isNaN(dateObj.getTime())) {
      console.error('[EventOperations] _addExdate: Invalid date value:', dateObj);
      throw new Error('قيمة التاريخ غير صالحة');
    }

    const exdates = event.exdates || [];
    // إضافة ISO string للتاريخ
    exdates.push(dateObj.toISOString());
    await this.update(userId, event.id, { exdates });
  }

  _updateRRuleUntil(rruleStr, untilDate) {
    if (!rruleStr) return rruleStr;
    
    // Parse
    try {
        const options = RRule.parseString(rruleStr);
        options.until = untilDate;
        // clear count if setting until
        delete options.count; 
        
        // Re-stringify
        // RRule.optionsToString(options) might verify valid options
        const rule = new RRule(options);
        return rule.toString();
    } catch (e) {
        console.error("Failed to parse RRule:", e);
        return rruleStr; // Fallback
    }
  }

}
