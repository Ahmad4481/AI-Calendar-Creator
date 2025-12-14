import PreferencesCalendarService from "./PreferencesCalendar/PreferencesCalendarService.js";
// import NotificationsService from "./Notifications/NotificationsService.js";

export default class SettingsService {
  constructor() {
    this.PreferencesCalendarService = new PreferencesCalendarService();
    // this.NotificationsService = new NotificationsService();
  }

  async getPreferencesCalendar(userId) {
    return this.PreferencesCalendarService.getPreferencesCalendar(userId);
  }
  async addPreferencesCalendar(userId, data) {
    return this.PreferencesCalendarService.addPreferencesCalendar(userId, data);
  }
  async updatePreferencesCalendar(userId, data) {
    return this.PreferencesCalendarService.updatePreferencesCalendar(userId, data);
  }
}
