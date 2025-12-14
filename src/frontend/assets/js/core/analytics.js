/**
 * User Behavior Analytics
 * تتبع وتحليل سلوك المستخدم
 */

import { getFunctions, httpsCallable } from './firebase/firebase-exports.js';
import { app } from './firebase/index.js';

class BehaviorAnalytics {
  constructor() {
    this.functions = getFunctions(app);
    this.trackBehaviorFn = httpsCallable(this.functions, 'trackBehavior');
    this.getAnalyticsFn = httpsCallable(this.functions, 'getAnalytics');
    
    this.events = [];
    this.sessionStartTime = Date.now();
    this.isTracking = true;
    
    // Local storage key for offline events
    this.storageKey = 'analytics_events';
    
    // Load any pending events from local storage
    this.loadPendingEvents();
    
    // Track session start
    this.trackSessionStart();
    
    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Setup global event listeners
   */
  setupEventListeners() {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackSessionEnd();
      } else {
        this.trackSessionStart();
      }
    });

    // Track before unload
    window.addEventListener('beforeunload', () => {
      this.trackSessionEnd();
      this.flushEvents();
    });
  }

  /**
   * Load pending events from local storage
   */
  loadPendingEvents() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.events = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('[Analytics] Failed to load pending events:', error);
      this.events = [];
    }
  }

  /**
   * Save events to local storage
   */
  saveEvents() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.events));
    } catch (error) {
      console.warn('[Analytics] Failed to save events:', error);
    }
  }

  /**
   * Track a behavior event
   */
  async track(eventType, metadata = {}) {
    if (!this.isTracking) return;

    const event = {
      type: eventType,
      timestamp: new Date().toISOString(),
      metadata: {
        ...metadata,
        sessionDuration: Date.now() - this.sessionStartTime,
        url: window.location.pathname,
        userAgent: navigator.userAgent.substring(0, 100),
      },
    };

    this.events.push(event);
    this.saveEvents();

    // Try to send to server
    try {
      await this.trackBehaviorFn({
        eventType: event.type,
        metadata: event.metadata,
      });
      
      // Remove sent event from local storage
      this.events = this.events.filter(e => e !== event);
      this.saveEvents();
    } catch (error) {
      console.debug('[Analytics] Failed to send event, saved locally:', error);
    }
  }

  /**
   * Track task creation
   */
  trackTaskCreated(taskData) {
    this.track('task_created', {
      taskId: taskData.id,
      hasDeadline: !!taskData.endTime,
      hasDescription: !!taskData.description,
      isAllDay: !!taskData.allDay,
    });
  }

  /**
   * Track task completion
   */
  trackTaskCompleted(taskData, duration = null) {
    const scheduledTime = taskData.startTime ? new Date(taskData.startTime) : null;
    const completedTime = new Date();
    
    this.track('task_completed', {
      taskId: taskData.id,
      duration: duration || 0,
      onTime: scheduledTime ? completedTime <= scheduledTime : true,
      hourOfDay: completedTime.getHours(),
      dayOfWeek: completedTime.getDay(),
    });
  }

  /**
   * Track task failure (not completed by deadline)
   */
  trackTaskFailed(taskData) {
    this.track('task_failed', {
      taskId: taskData.id,
      hourOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
    });
  }

  /**
   * Track task rescheduling
   */
  trackTaskRescheduled(taskData, newTime) {
    this.track('task_rescheduled', {
      taskId: taskData.id,
      oldTime: taskData.startTime,
      newTime: newTime,
    });
  }

  /**
   * Track session start
   */
  trackSessionStart() {
    this.sessionStartTime = Date.now();
    this.track('session_start', {
      startTime: new Date().toISOString(),
    });
  }

  /**
   * Track session end
   */
  trackSessionEnd() {
    const duration = Date.now() - this.sessionStartTime;
    this.track('session_end', {
      duration: duration,
      eventsCount: this.events.length,
    });
  }

  /**
   * Flush all pending events to server
   */
  async flushEvents() {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    
    for (const event of eventsToSend) {
      try {
        await this.trackBehaviorFn({
          eventType: event.type,
          metadata: event.metadata,
        });
        
        // Remove sent event
        this.events = this.events.filter(e => e !== event);
      } catch (error) {
        console.debug('[Analytics] Failed to flush event:', error);
        break; // Stop if we can't send
      }
    }
    
    this.saveEvents();
  }

  /**
   * Get analytics for current user
   */
  async getAnalytics() {
    try {
      const result = await this.getAnalyticsFn({
        events: this.events,
      });
      return result.data;
    } catch (error) {
      console.error('[Analytics] Failed to get analytics:', error);
      return null;
    }
  }

  /**
   * Get user behavior summary
   */
  getBehaviorSummary() {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const todayEvents = this.events.filter(e => {
      const eventDate = new Date(e.timestamp);
      return eventDate >= todayStart;
    });

    const completed = todayEvents.filter(e => e.type === 'task_completed').length;
    const failed = todayEvents.filter(e => e.type === 'task_failed').length;
    const created = todayEvents.filter(e => e.type === 'task_created').length;

    // Calculate completion rate
    const total = completed + failed;
    const completionRate = total > 0 ? completed / total : 0;

    // Find productive hours
    const completedByHour = {};
    todayEvents
      .filter(e => e.type === 'task_completed')
      .forEach(e => {
        const hour = e.metadata.hourOfDay || new Date(e.timestamp).getHours();
        completedByHour[hour] = (completedByHour[hour] || 0) + 1;
      });

    return {
      todayCompleted: completed,
      todayFailed: failed,
      todayCreated: created,
      completionRate,
      completedByHour,
      sessionDuration: Date.now() - this.sessionStartTime,
    };
  }

  /**
   * Enable/disable tracking
   */
  setTracking(enabled) {
    this.isTracking = enabled;
  }

  /**
   * Clear all stored events
   */
  clearEvents() {
    this.events = [];
    localStorage.removeItem(this.storageKey);
  }
}

// Create singleton instance
const analytics = new BehaviorAnalytics();

// Export for use in other modules
export default analytics;
export { BehaviorAnalytics };

