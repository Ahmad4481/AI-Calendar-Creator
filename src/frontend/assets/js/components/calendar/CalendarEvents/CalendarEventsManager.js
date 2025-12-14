/**
 * CalendarManager.js - نقطة الدخول الرئيسية للتقويم
 */
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import rrulePlugin from '@fullcalendar/rrule';

import { EventService, CalendarAI } from '../../../core/firebase/index.js';
import { authManager } from '../../../core/utils/auth.js';

import { CalendarInitializer } from './core/CalendarInitializer.js';
import { EventLoader } from './events/EventLoader.js';
import { EventOperations } from './events/EventOperations.js';
import { CalendarHandlers } from './ui/CalendarHandlers.js';
import { EventListRenderer } from './ui/EventListRenderer.js';
import { CalendarCache } from './core/CalendarCache.js';
import { EventConverter } from './core/EventConverter.js';
import { RecurringEventModal } from './ui/recurringEventModal.js';

import EventFormManager from '../EventForm/EventFormManager.js';

const plugins = [dayGridPlugin, timeGridPlugin, listPlugin, rrulePlugin];

export default class CalendarManager {
    constructor(options = {}) {
        this.options = options;
        this.events = [];
        this.calendar = null;
        this.currentUserId = null;

        // Selectors
        this.selectors = {
            calendar: options.calendarSelector || '#eventCalendar',
            openModalBtn: options.openModalBtnSelector || '#openEventModalBtn',
            eventList: options.eventListSelector || '#eventList',
            clearEventsBtn: options.clearEventsBtnSelector || '#clearEventsBtn'
        };

        // DOM Elements
        this.elements = {};

        // Services
        this.eventService = new EventService();
        this.calendarAI = new CalendarAI();

        // Sub-modules
        this.cache = new CalendarCache();
        this.loader = new EventLoader(this.eventService, this.cache);
        this.operations = new EventOperations(this.eventService);
        this.handlers = new CalendarHandlers(this);
        this.listRenderer = new EventListRenderer();
        this.initializer = new CalendarInitializer(plugins);
        this.converter = new EventConverter();
        this.recurringModal = new RecurringEventModal();

        this.eventFormManager = null;

        this.init();
    }

    loadElements() {
        this.elements.calendar = document.querySelector(this.selectors.calendar);
        this.elements.openModalBtn = document.querySelector(this.selectors.openModalBtn);
        this.elements.eventList = document.querySelector(this.selectors.eventList);
        this.elements.clearEventsBtn = document.querySelector(this.selectors.clearEventsBtn);

        return !!this.elements.calendar;
    }

    bindEvents() {
        // زر فتح نافذة إضافة الحدث
        if (this.elements.openModalBtn) {
            this.elements.openModalBtn.addEventListener('click', () => {
                if (this.eventFormManager) {
                    this.eventFormManager.resetFormState();
                    this.eventFormManager.updateModalTitle('إضافة حدث');
                    this.eventFormManager.openEventModal();
                }
            });
        }

        // زر مسح جميع الأحداث
        if (this.elements.clearEventsBtn) {
            this.elements.clearEventsBtn.addEventListener('click', async () => {
                if (confirm('هل أنت متأكد من حذف جميع الأحداث؟')) {
                    await this.operations.clearAll(this.currentUserId, this.events);
                    this.events = [];
                    this.calendar?.removeAllEvents();
                    this.listRenderer.render([]);
                }
            });
        }
    }

    async init() {
        // تحميل العناصر
        if (!this.loadElements()) {
            console.error('Calendar element not found');
            return;
        }

        // التحقق من المصادقة
        const user = await authManager.checkAuth();
        if (!user) {
            authManager.redirectToLogin();
            return;
        }
        this.currentUserId = user.uid;

        // تحميل الأحداث
        this.events = await this.loader.loadEvents(this.currentUserId);
        console.log(this.events);
        // تهيئة EventFormManager
        this.eventFormManager = new EventFormManager({
            currentUserId: this.currentUserId,
            eventOperations: this.operations, // Pass operations instance
            onEventCreated: async (event) => {
                this.events.push(event);
                this.calendar?.addEvent(this.converter.toFullCalendar(event)); // ⚠️ استخدام converter
                this.listRenderer.render(this.events);
            },
            onEventUpdated: async () => {
                this.events = await this.loader.refreshEvents(this.currentUserId);
                this.refreshCalendar();
            },
            onEventDeleted: async (eventId) => {
                this.events = this.events.filter(e => e.id !== eventId);
                this.calendar?.getEventById(eventId)?.remove();
                this.listRenderer.render(this.events);
            }
        });

        // تهيئة التقويم
        this.calendar = this.initializer.create(this.elements.calendar, this.handlers);

        // انتظار render التقويم ثم إضافة الأحداث
        requestAnimationFrame(() => {
        // إضافة الأحداث للتقويم
          console.log('[CalendarManager] Adding events to calendar:', this.events.length);
          
          let addedCount = 0;
        this.events.forEach(evt => {
            try {
              const fcEvent = this.converter.toFullCalendar(evt);
              
              // التحقق من أن fcEvent ليس null أو undefined
              if (!fcEvent) {
                console.warn('[CalendarManager] Skipping invalid event (converter returned null):', evt.id, evt);
                return;
              }
              
              // التحقق من وجود start قبل الإضافة
              if (!fcEvent.start) {
                console.warn('[CalendarManager] Event missing start date:', evt.id, fcEvent);
                return;
              }
              
              console.log('[CalendarManager] Adding event:', evt.id, fcEvent);
              this.calendar?.addEvent(fcEvent);
              addedCount++;
            } catch (error) {
              console.error('[CalendarManager] Error adding event:', evt.id, error);
            }
          });
          
          console.log(`[CalendarManager] Successfully added ${addedCount}/${this.events.length} events`);
        });

        // عرض قائمة الأحداث
        this.listRenderer.render(this.events);

        // ربط الأحداث
        this.bindEvents();

        console.log('[CalendarManager] Initialized successfully');
    }

    // ⚠️ حذف convertToCalendarEvent() - استخدم converter.toFullCalendar() بدلاً منها

    refreshCalendar() {
        if (!this.calendar) return;
        this.calendar.removeAllEvents();
        this.events.forEach(evt => {
            this.calendar.addEvent(this.converter.toFullCalendar(evt)); // ⚠️ استخدام converter
        });
        this.listRenderer.render(this.events);
    }

    // في toggleEventCompleted():
    async toggleEventCompleted(eventId, completed, instanceDate = null) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        if (event.recurring || event.rrule) {
            const mode = await this.recurringModal.ask();
            if (!mode) {
                this.refreshCalendar(); // Revert UI
                return;
            }

            const date = instanceDate || (event.startTime.toDate ? event.startTime.toDate() : new Date(event.startTime));

            try {
                await this.operations.handleRecurringAction(
                    this.currentUserId,
                    event,
                    date,
                    mode,
                    'complete',
                    { completed }
                );

                // Refresh all
                this.events = await this.loader.refreshEvents(this.currentUserId);
                this.refreshCalendar();
            } catch (err) {
                console.error("Failed to complete recurring event:", err);
            }
        } else {
            await this.operations.toggleComplete(this.currentUserId, eventId, completed);
            event.completed = completed;
            this.listRenderer.render(this.events);
        }
    }

    getCalendarElement() {
        return this.elements.calendar;
    }


}

// تهيئة تلقائية عند تحميل الصفحة
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.calendarManager = new CalendarManager();
        });
    } else {
        window.calendarManager = new CalendarManager();
    }
}