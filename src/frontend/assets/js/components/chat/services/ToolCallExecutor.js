/**
 * calendar/chat/services/ToolCallExecutor.js
 * نفّذ استدعاءات الأدوات (tool calls) التي يرجعها AI عبر functionExecutor أو خدمات Firebase
 */
import { defaultFunctionExecutor } from '../../../core/firebase/services/AI/functionExecutor.js';
import EventService from '../../../core/firebase/services/eventService/EventService.js';

export default class ToolCallExecutor {
  constructor(opts = {}) {
    // يمكن حقن instance خارجي لـ EventService لاختبارية أسهل
    this.eventService = opts.eventService || new EventService();
  }

  async executeToolCalls(toolCalls = [], ctx = {}) {
    if (!Array.isArray(toolCalls) || toolCalls.length === 0) return [];

    const results = [];
    for (const call of toolCalls) {
      try {
        const name = call.name;
        const args = call.arguments || {};

        // defaultFunctionExecutor يُنادي الدوال المعرفة في الخادم (Firebase)
        const res = await defaultFunctionExecutor(name, args, {
          eventService: this.eventService,
          userId: ctx.userId
        });

        results.push({ name, ok: true, result: res });

        // optional: أي معالجة محلية بناءً على اسم الأداة
        if (name === 'createEvent' || name === 'updateEvent' || name === 'deleteEvent' || name === 'markEventComplete') {
          // لا نفعل افتراضات، لكن نعيد اسم التنفيذ للمتابعين الخارجيين
        }
      } catch (err) {
        console.error(`[ToolCallExecutor] Tool ${call.name} failed`, err);
        results.push({ name: call.name, ok: false, error: err });
      }
    }
    return results;
  }
}
