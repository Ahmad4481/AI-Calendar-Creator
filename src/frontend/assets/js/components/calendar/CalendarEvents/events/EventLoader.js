/**
 * EventLoader.js - تحميل الأحداث من Firebase
 */
export class EventLoader {
  constructor(eventService, cache) {
    this.eventService = eventService;
    this.cache = cache;
  }
  
  async loadEvents(userId) {
    if (!userId) {
      console.warn('[EventLoader] No userId provided');
      return [];
    }
    
    // محاولة من الكاش أولاً
    const cached = this.cache?.get(userId);
    if (cached && cached.length > 0) {
      console.log(`[EventLoader] Loaded ${cached.length} events from cache`);
      return cached;
    }
    
    // تحميل من Firebase باستخدام EventService
    try {
      const events = await this.eventService.getEvents(userId);
      
      // التأكد من أن الأحداث موجودة
      const eventsArray = Array.isArray(events) ? events : [];
      
      if (this.cache) {
        this.cache.set(userId, eventsArray);
      }
      
      console.log(`[EventLoader] Loaded ${eventsArray.length} events from Firebase`);
      return eventsArray;
      
    } catch (error) {
      console.error('[EventLoader] Failed to load events:', error);
      return [];
    }
  }
  
  async refreshEvents(userId) {
    if (this.cache) {
      this.cache.clear(userId);
    }
    return this.loadEvents(userId);
  }
}