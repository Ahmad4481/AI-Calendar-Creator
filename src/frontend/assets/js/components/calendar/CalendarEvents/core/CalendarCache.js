/**
 * CalendarCache.js - التخزين المؤقت للأحداث
 */
export class CalendarCache {
    constructor(maxAge = 3600000) { // ساعة واحدة
      this.maxAge = maxAge;
    }
    
    getKey(userId) {
      return `events_cache_${userId}`;
    }
    
    get(userId) {
      const key = this.getKey(userId);
      const cached = localStorage.getItem(key);
      
      if (!cached) return null;
      
      try {
        const { events, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        if (age > this.maxAge) {
          this.clear(userId);
          return null;
        }
        
        return events;
      } catch (e) {
        this.clear(userId);
        return null;
      }
    }
    
    set(userId, events) {
      const key = this.getKey(userId);
      localStorage.setItem(key, JSON.stringify({
        events,
        timestamp: Date.now()
      }));
    }
    
    clear(userId) {
      localStorage.removeItem(this.getKey(userId));
    }
  }