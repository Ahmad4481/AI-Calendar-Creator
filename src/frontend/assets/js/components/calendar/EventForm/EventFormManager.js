/**
 * src/features/events/EventFormManager.js
 * Orchestrator: يجمع الوحدات ويهيئها ويربط بينها
 */
import EventFormUI from './ui/EventFormUI.js';
import FlatpickrManager from './ui/FlatpickrManager.js';
import EventFormService from './services/EventFormService.js';
import EventFormHandlers from './handlers/EventFormHandlers.js';
import RRuleBuilder from './repeat/RRuleBuilder.js';
import { messageManager } from '../../../core/utils/messages.js';
import { RecurringEventModal } from '../CalendarEvents/ui/recurringEventModal.js';
import { EventOperations } from '../CalendarEvents/events/EventOperations.js';
import { EventService } from '../../../core/firebase/index.js';

export default class EventFormManager {
  constructor(options = {}) {
    this.currentUserId = options.currentUserId || null;
    
    // Initialize EventOperations - use provided or create new
    const eventService = options.eventService || new EventService();
    this.eventOperations = options.eventOperations || new EventOperations(eventService);
    
    // Instances
    this.ui = new EventFormUI(options.selectors || {});
    this.flatpickr = new FlatpickrManager(this.ui);
    this.rruleBuilder = new RRuleBuilder();
    this.service = new EventFormService({ flatpickr: this.flatpickr, rruleBuilder: this.rruleBuilder, ui: this.ui });
    this.recurringModal = new RecurringEventModal();

    // Callbacks
    this.onEventCreated = options.onEventCreated || null;
    this.onEventUpdated = options.onEventUpdated || null;
    this.onEventDeleted = options.onEventDeleted || null;

    this.editingId = null;
    this.currentEvent = null;

    this.init();
  }

  init() {
    this.ui.loadElements();
    this.flatpickr.init();
    EventFormHandlers.bindAll({
      manager: this,
      ui: this.ui,
      service: this.service,
      rruleBuilder: this.rruleBuilder
    });
  }

  setCurrentUserId(userId) {
    this.currentUserId = userId;
    // لا حاجة لـ repo - eventOperations لا يحتاج setCurrentUserId
  }

  async handleFormSubmit(e) {
    e.preventDefault();
    const formData = this.service.getFormData();
    console.log('[EventFormManager] Form data:', formData);

    if (!this.service.validateFormData(formData)) {
      console.log('[EventFormManager] Form validation failed');
      return;
    }

    if (!this.currentUserId) {
      messageManager.error('يجب تسجيل الدخول أولاً');
      return;
    }

    const eventData = this.service.buildEventData(formData);
    console.log('[EventFormManager] Built event data:', eventData);
    console.log('[EventFormManager] Event data keys:', Object.keys(eventData));
    console.log('[EventFormManager] Event data startTime:', eventData.startTime);
    console.log('[EventFormManager] Event data endTime:', eventData.endTime);

    try {
      if (this.editingId) {
        console.log('[EventFormManager] Editing event ID:', this.editingId);
        console.log('[EventFormManager] Current event:', this.currentEvent);
        
        // Check if recurring
        if (this.currentEvent && (this.currentEvent.recurring || this.currentEvent.rrule)) {
            console.log('[EventFormManager] Event is recurring');
            const mode = await this.recurringModal.ask();
            console.log('[EventFormManager] User selected mode:', mode);
            if (!mode) return;

            // Determine instance date (original start time of the specific instance being edited)
            let instanceDate = null;
            
            if (this.currentEvent.startTime) {
              if (this.currentEvent.startTime.toDate && typeof this.currentEvent.startTime.toDate === 'function') {
                instanceDate = this.currentEvent.startTime.toDate();
              } else if (this.currentEvent.startTime instanceof Date) {
                instanceDate = this.currentEvent.startTime;
              } else if (this.currentEvent.startTime.seconds !== undefined) {
                instanceDate = new Date(this.currentEvent.startTime.seconds * 1000);
              } else if (typeof this.currentEvent.startTime === 'string' || typeof this.currentEvent.startTime === 'number') {
                instanceDate = new Date(this.currentEvent.startTime);
              }
            } else if (this.currentEvent.start) {
              if (this.currentEvent.start instanceof Date) {
                instanceDate = this.currentEvent.start;
              } else if (this.currentEvent.start.toDate && typeof this.currentEvent.start.toDate === 'function') {
                instanceDate = this.currentEvent.start.toDate();
              } else if (this.currentEvent.start.seconds !== undefined) {
                instanceDate = new Date(this.currentEvent.start.seconds * 1000);
              } else if (typeof this.currentEvent.start === 'string' || typeof this.currentEvent.start === 'number') {
                instanceDate = new Date(this.currentEvent.start);
              }
            }

            // التحقق من صحة التاريخ
            if (!instanceDate || isNaN(instanceDate.getTime())) {
              console.error('[EventFormManager] Invalid instance date for update:', this.currentEvent);
              messageManager.error('تاريخ الحدث غير صالح');
              return;
            }

            console.log('[EventFormManager] Instance date:', instanceDate);
            
            // تحويل eventData من startTime/endTime (Timestamp) إلى start/end (Date) للـ handleRecurringAction
            const processedEventData = { ...eventData };
            console.log('[EventFormManager] Processing event data:', processedEventData);
            
            // تحويل startTime إلى start
            if (processedEventData.startTime) {
              console.log('[EventFormManager] Converting startTime:', processedEventData.startTime);
              if (processedEventData.startTime.toDate && typeof processedEventData.startTime.toDate === 'function') {
                processedEventData.start = processedEventData.startTime.toDate();
              } else if (processedEventData.startTime instanceof Date) {
                processedEventData.start = processedEventData.startTime;
              } else if (processedEventData.startTime.seconds !== undefined) {
                processedEventData.start = new Date(processedEventData.startTime.seconds * 1000);
              } else {
                processedEventData.start = new Date(processedEventData.startTime);
              }
              delete processedEventData.startTime;
              console.log('[EventFormManager] Converted start:', processedEventData.start);
            }
            
            // تحويل endTime إلى end
            if (processedEventData.endTime) {
              console.log('[EventFormManager] Converting endTime:', processedEventData.endTime);
              if (processedEventData.endTime.toDate && typeof processedEventData.endTime.toDate === 'function') {
                processedEventData.end = processedEventData.endTime.toDate();
              } else if (processedEventData.endTime instanceof Date) {
                processedEventData.end = processedEventData.endTime;
              } else if (processedEventData.endTime.seconds !== undefined) {
                processedEventData.end = new Date(processedEventData.endTime.seconds * 1000);
              } else {
                processedEventData.end = new Date(processedEventData.endTime);
              }
              delete processedEventData.endTime;
              console.log('[EventFormManager] Converted end:', processedEventData.end);
            }

            console.log('[EventFormManager] Final processed data:', processedEventData);
            console.log('[EventFormManager] Final processed data keys:', Object.keys(processedEventData));
            console.log('[EventFormManager] Final processed data start:', processedEventData.start);
            console.log('[EventFormManager] Final processed data end:', processedEventData.end);
            console.log('[EventFormManager] Final processed data title:', processedEventData.title);
            console.log('[EventFormManager] Final processed data description:', processedEventData.description);

            if (this.eventOperations) {
              console.log('[EventFormManager] Calling handleRecurringAction with processedEventData:', processedEventData);
              
              await this.eventOperations.handleRecurringAction(
                  this.currentUserId,
                  this.currentEvent,
                  instanceDate,
                  mode,
                  'update',
                  processedEventData
              );
              if (this.onEventUpdated) this.onEventUpdated();
              messageManager.success('تم تحديث الحدث المتكرر بنجاح');
            }
        } else {
            // Normal update - use eventOperations instead of repo
            await this.eventOperations.update(this.currentUserId, this.editingId, eventData);
            if (this.onEventUpdated) this.onEventUpdated({ id: this.editingId, ...eventData });
            messageManager.success('تم تحديث الحدث بنجاح');
        }
      } else {
        // Create - use eventOperations instead of repo
        const result = await this.eventOperations.create(this.currentUserId, eventData);
        if (this.onEventCreated) this.onEventCreated(result);
        messageManager.success('تم إضافة الحدث بنجاح');
      }
      this.ui.closeEventModal();
    } catch (err) {
      console.error('Error saving event:', err);
      messageManager.error('حدث خطأ أثناء حفظ الحدث');
    }
  }

  async deleteEvent(eventId) {
    if (!eventId) return;
    
    const event = this.currentEvent?.id === eventId ? this.currentEvent : null;

    try {
      if (event && (event.recurring || event.rrule)) {
        const mode = await this.recurringModal.ask();
        if (!mode) return;

        // تحويل التاريخ بشكل آمن - نفس منطق EventConverter
        let instanceDate = null;
        
        if (event.startTime) {
          if (event.startTime.toDate && typeof event.startTime.toDate === 'function') {
            instanceDate = event.startTime.toDate();
          } else if (event.startTime instanceof Date) {
            instanceDate = event.startTime;
          } else if (event.startTime.seconds !== undefined) {
            instanceDate = new Date(event.startTime.seconds * 1000);
          } else if (typeof event.startTime === 'string' || typeof event.startTime === 'number') {
            instanceDate = new Date(event.startTime);
          }
        } else if (event.start) {
          if (event.start instanceof Date) {
            instanceDate = event.start;
          } else if (event.start.toDate && typeof event.start.toDate === 'function') {
            instanceDate = event.start.toDate();
          } else if (event.start.seconds !== undefined) {
            instanceDate = new Date(event.start.seconds * 1000);
          } else if (typeof event.start === 'string' || typeof event.start === 'number') {
            instanceDate = new Date(event.start);
          }
        }

        // التحقق من صحة التاريخ
        if (!instanceDate || isNaN(instanceDate.getTime())) {
          console.error('[EventFormManager] Invalid instance date:', event);
          messageManager.error('تاريخ الحدث غير صالح');
          return;
        }

        await this.eventOperations.handleRecurringAction(
            this.currentUserId,
            event,
            instanceDate,
            mode,
            'delete'
        );
        
        // Force full reload for recurring events
        if (this.onEventUpdated) {
          this.onEventUpdated();
        } else if (this.onEventDeleted) {
          this.onEventDeleted(eventId);
        }
        
        messageManager.success('تم حذف الحدث المتكرر بنجاح');
      } else {
        // Normal delete - use eventOperations instead of repo
        await this.eventOperations.delete(this.currentUserId, eventId);
        if (this.onEventDeleted) this.onEventDeleted(eventId);
        messageManager.success('تم حذف الحدث بنجاح');
      }
      this.ui.closeEventModal();
    } catch (err) {
      console.error('Error deleting event:', err);
      messageManager.error('حدث خطأ أثناء حذف الحدث');
    }
  }

  populateFormForEvent(event) {
    if (!event) return;
    this.editingId = event.id;
    this.currentEvent = event;
    this.ui.populateFormForEvent(event);
    this.flatpickr.syncFromForm();
    this.ui.openEventModal();   
  }

  resetFormState() {
    this.editingId = null;
    this.currentEvent = null;
    this.ui.resetFormState();
    this.flatpickr.clearAll();
  }

  openEventModal() {
    this.ui.openEventModal();
  }

  closeEventModal() {
    this.ui.closeEventModal();
  }

  updateModalTitle(title) {
    this.ui.updateModalTitle(title);
  }
}