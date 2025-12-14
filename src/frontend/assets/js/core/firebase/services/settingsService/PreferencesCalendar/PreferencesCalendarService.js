import Repository from "../../../Repository.js";
import preferencesCalendarMapper from "./preferencesCalendarMapper.js";

// ----------------------
// PreferencesCalendarService
// - Stores user settings for calendar
// - Stored in: users/{uid}/settings/calendar
// ----------------------

export default class PreferencesCalendarService {
  constructor() {
    // Repository with 'settings' subcollection under users/{uid}
    this.repo = new Repository("settings");
    this.docId = "calendar";
  }

  async getPreferencesCalendar(userId) {
    return this.repo.get(userId, this.docId);
  }

  async addPreferencesCalendar(userId, data) {
    const mappedData = preferencesCalendarMapper(data);
    return this.repo.set(userId, this.docId, mappedData);
  }

  async updatePreferencesCalendar(userId, data) {
    // Get existing data first to merge
    const existing = await this.getPreferencesCalendar(userId) || {};
    const merged = { ...existing, ...data };
    const mappedData = preferencesCalendarMapper(merged);
    return this.repo.set(userId, this.docId, mappedData);
  }
}
