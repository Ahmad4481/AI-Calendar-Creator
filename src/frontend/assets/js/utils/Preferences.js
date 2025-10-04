
/**
 * Preferences - Manages user preferences for calendar generation
 */
export class Preferences {
  constructor() {
    this.sleepTimes = [];
    this.goalsAndPreferences = [];
    this.availableTimeBlocks = [];
    this.name = "";
    this.calendarScope = "";
    this.calendarDuration = "";
    this.availableTime = [];
    this.goals = [];
  }

  /**
   * Add sleep time preference
   * @param {string} startTime - Sleep start time
   * @param {string} endTime - Sleep end time
   */
  addSleepTime(startTime, endTime) {
    this.sleepTimes.push({ startTime, endTime });
  }

  /**
   * Add goal preference
   * @param {string} title - Goal title
   * @param {string} description - Goal description
   */
  addGoal(title, description) {
    this.goalsAndPreferences.push({ title, description });
  }

  /**
   * Add available time block
   * @param {string} day - Day of week
   * @param {string} startTime - Start time
   * @param {string} endTime - End time
   */
  addAvailableTimeBlock(day, startTime, endTime) {
    this.availableTimeBlocks.push({ day, startTime, endTime });
  }

  /**
   * Set user name
   * @param {string} name - User name
   */
  setName(name) {
    this.name = name;
  }

  /**
   * Set calendar scope
   * @param {string} scope - Calendar scope (daily, weekly, monthly)
   */
  setCalendarScope(scope) {
    this.calendarScope = scope;
  }

  /**
   * Set calendar duration
   * @param {string} duration - Calendar duration
   */
  setCalendarDuration(duration) {
    this.calendarDuration = duration;
  }

  /**
   * Get all preferences as object
   * @returns {Object} All preferences
   */
  getAllPreferences() {
    return {
      name: this.name,
      calendarScope: this.calendarScope,
      calendarDuration: this.calendarDuration,
      sleepTimes: this.sleepTimes,
      goalsAndPreferences: this.goalsAndPreferences,
      availableTimeBlocks: this.availableTimeBlocks,
      availableTime: this.availableTime,
      goals: this.goals
    };
  }

  /**
   * Clear all preferences
   */
  clearAll() {
    this.sleepTimes = [];
    this.goalsAndPreferences = [];
    this.availableTimeBlocks = [];
    this.name = "";
    this.calendarScope = "";
    this.calendarDuration = "";
    this.availableTime = [];
    this.goals = [];
  }
}