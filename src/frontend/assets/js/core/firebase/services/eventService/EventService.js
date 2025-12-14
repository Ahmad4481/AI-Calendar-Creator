import {
  query,
  where,
  orderBy,
  serverTimestamp,
} from "../../firebase-exports.js";
import Repository from "../../Repository.js";
import TimedCache from "../../cache.js";
import eventMapper from "./EventMapper.js";


// ----------------------
// EventService
// - Manages events collection + CRUD operations
// ----------------------
export default class EventService {
  constructor() {
    this.collection = "events";
    this.repo = new Repository(this.collection);
    this.cache = new TimedCache(); // الكاش لكل المستخدمين
  }

  // EventService.js
  async addEvent(userId, data) {
    const payload = eventMapper(data); // بدون userId
    const ref = await this.repo.add(userId, payload);
    this.cache.set(`events:${userId}`, payload);
    return { id: ref.id, ...payload };
  }

  async updateEvent(userId, eventId, updates) {
    await this.repo.update(userId, eventId, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    this.cache.delete(`events:${userId}`); // تحديث الكاش بعد التعديل
    return this.repo.find(userId, (col) =>
      query(col, where("__name__", "==", eventId))
    );
  }

  async deleteEvent(userId, eventId) {
    await this.repo.delete(userId, eventId);
    this.cache.delete(`events:${userId}`); // تحديث الكاش بعد الحذف
    return true;
  }

  async getEvents(userId) {
    return this.cache.remember(`events:${userId}`, () =>
      this.repo.find(userId, (col) =>
        query(col, orderBy("startTime", "asc"))
      )
    );
  }

  
}