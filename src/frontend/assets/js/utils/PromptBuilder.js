import { Preferences } from "./Preferences.js";

/**
 * PromptBuilder - Builds prompts for AI calendar generation
 */
class PromptBuilder {
  constructor() {
    this.preferences = new Preferences();
  }

  /**
   * Build a comprehensive prompt for calendar generation
   * @param {Object} userData - User input data
   * @returns {string} Formatted prompt
   */
  buildPrompt(userData) {
    const prompt = `
أنت مساعد ذكي لإنشاء التقويمات الشخصية. بناءً على المعلومات التالية، قم بإنشاء تقويم منظم ومتوازن:

المعلومات الشخصية:
- الاسم: ${userData.name || 'غير محدد'}
- نطاق التقويم: ${userData.calendarScope || 'أسبوعي'}
- مدة التقويم: ${userData.calendarDuration || 'غير محدد'}

أوقات النوم:
${this.preferences.sleepTimes.map(sleep => 
  `- من ${sleep.startTime} إلى ${sleep.endTime}`
).join('\n')}

الأهداف والتفضيلات:
${this.preferences.goalsAndPreferences.map(goal => 
  `- ${goal.title}: ${goal.description}`
).join('\n')}

الكتل الزمنية المتاحة:
${this.preferences.availableTimeBlocks.map(block => 
  `- ${block.day}: من ${block.startTime} إلى ${block.endTime}`
).join('\n')}

يرجى إنشاء تقويم متوازن يأخذ في الاعتبار:
1. أوقات النوم المحددة
2. الأهداف المطلوبة
3. الأوقات المتاحة
4. التوازن بين العمل والراحة
5. المرونة في التخطيط

قم بتنسيق الإجابة بشكل منظم وواضح.
    `;
    
    return prompt.trim();
  }

  /**
   * Add sleep time preference
   * @param {string} startTime - Sleep start time
   * @param {string} endTime - Sleep end time
   */
  addSleepTime(startTime, endTime) {
    this.preferences.sleepTimes.push({ startTime, endTime });
  }

  /**
   * Add goal preference
   * @param {string} title - Goal title
   * @param {string} description - Goal description
   */
  addGoal(title, description) {
    this.preferences.goalsAndPreferences.push({ title, description });
  }

  /**
   * Add available time block
   * @param {string} day - Day of week
   * @param {string} startTime - Start time
   * @param {string} endTime - End time
   */
  addAvailableTimeBlock(day, startTime, endTime) {
    this.preferences.availableTimeBlocks.push({ day, startTime, endTime });
  }
}

export { PromptBuilder };