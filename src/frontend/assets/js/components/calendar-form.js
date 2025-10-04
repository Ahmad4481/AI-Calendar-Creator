// Calendar Form Management - Main File
// This file extends the core functionality with helper methods

// Extend CalendarFormManager with helper methods
CalendarFormManager.prototype.collectSleepSchedules = CalendarFormHelpers.collectSleepSchedules;
CalendarFormManager.prototype.collectDaySettings = CalendarFormHelpers.collectDaySettings;
CalendarFormManager.prototype.collectGoals = CalendarFormHelpers.collectGoals;
CalendarFormManager.prototype.addSleepSchedule = CalendarFormHelpers.addSleepSchedule;
CalendarFormManager.prototype.addSpecialDate = CalendarFormHelpers.addSpecialDate;
CalendarFormManager.prototype.addGoal = CalendarFormHelpers.addGoal;
CalendarFormManager.prototype.addPreferredTime = CalendarFormHelpers.addPreferredTime;

// Load helper functions when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Ensure helper functions are loaded
  if (typeof CalendarFormHelpers === 'undefined') {
    console.error('CalendarFormHelpers not loaded');
    return;
  }
  
  // Initialize the form manager
  new CalendarFormManager();
});