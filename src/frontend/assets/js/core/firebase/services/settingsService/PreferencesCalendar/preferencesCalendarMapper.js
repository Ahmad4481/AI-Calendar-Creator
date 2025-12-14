import { serverTimestamp } from "../../../firebase-exports.js";

/**
 * Preferences Calendar Mapper
 * الحقول الأساسية للتفضيلات
 */
export default function preferencesCalendarMapper(data = {}) {
    // Keep existing fields structure but allow flexibility
    // const {
    //     unavailableTimes = { days: [], startTime: null, endTime: null, reason: "" },
    //     goals = { goal: "", description: "", deadline: null, estimatedHours: null, priority: "", status: "", createdAt: serverTimestamp(), updatedAt: serverTimestamp() },
    //     fixedTasks = eventMapper({ task: "", description: "", priority: "", status: "", createdAt: serverTimestamp(), updatedAt: serverTimestamp() }),
    //     personalInfo = { typeOfProfession: "", sleepTime: null,calendardensity: null , createdAt: serverTimestamp(), updatedAt: serverTimestamp() },
    // } = data;
    return {
        // 1. الأوقات غير المتاحة
        unavailableTimes: data.unavailableTimes || [],
        
        // 2. الأهداف
        goals: data.goals || [],
        
        // 3. المهام الثابتة
        fixedTasks: data.fixedTasks || [],
        
        // 4. معلومات شخصية
        personalInfo: data.personalInfo || {},

        // 5. أسئلة الذكاء الاصطناعي
        aiQuestions: data.aiQuestions || {},
        
        updatedAt: serverTimestamp(),
        createdAt: data.createdAt || serverTimestamp()
    };
}
