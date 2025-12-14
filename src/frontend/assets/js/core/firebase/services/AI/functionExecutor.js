// functionExecutor.js
import eventMapper from "../eventService/EventMapper.js";

/**
 * executeFunctionCalls
 *  - functionCalls: [{ name, arguments, id }]
 *  - executor: { optional } عبارة عن دالة (name, args) => result
 *  - defaultExecutor: دالة (name, args, context) => result
 *  - context: object يمكن أن يحتوي على eventService, userId, etc.
 */
export async function executeFunctionCalls(functionCalls = [], executor = null, options = {}) {
  const results = [];

  for (const funcCall of functionCalls) {
    try {
      let args = funcCall.arguments;
      if (typeof args === "string") {
        try {
          args = JSON.parse(args);
        } catch (e) {
          // إذا لم يكن JSON، اتركه كما هو
        }
      }

      const fn = executor || options.defaultExecutor;
      if (typeof fn !== "function") {
        throw new Error("No executor provided for function calls");
      }

      const res = await fn(funcCall.name, args, options.context || {});
      results.push({
        id: funcCall.id || null,
        function: funcCall.name,
        success: true,
        result: res
      });
    } catch (error) {
      console.error("[functionExecutor] call failed", funcCall.name, error);
      results.push({
        id: funcCall.id || null,
        function: funcCall.name,
        success: false,
        error: error?.message || String(error)
      });
    }
  }

  return results;
}

/**
 * defaultFunctionExecutor
 *  - context should include: { eventService, userId }
 *  - assumes eventService has methods: addEvent(userId, data), updateEvent(eventId, updates), deleteEvent(eventId)
 */
export async function defaultFunctionExecutor(functionName, args = {}, context = {}) {
  const { eventService, userId } = context || {};
  if (!eventService) throw new Error("eventService is required in context for defaultFunctionExecutor");
  if (!userId) throw new Error("userId is required in context for defaultFunctionExecutor");

  switch (functionName) {
    case "createEvent": {
      const mapped = eventMapper(args);
      // eventService.addEvent(userId, data) expected
      return eventService.addEvent(userId, mapped);
    }

    case "updateEvent": {
      if (!args.id) throw new Error("Event ID required for updateEvent");
      const mapped = eventMapper(args);
      // updateEvent(userId, eventId, updates)
      return eventService.updateEvent(userId, args.id, mapped);
    }

    case "deleteEvent": {
      if (!args.id) throw new Error("Event ID required for deleteEvent");
      // deleteEvent(userId, eventId)
      return eventService.deleteEvent(userId, args.id);
    }

    case "getEvents": {
      // getEvents(userId)
      return eventService.getEvents(userId);
    }

    case "markEventComplete": {
      if (!args.id) throw new Error("Event ID required for markEventComplete");
      const updates = { checked: args.completed !== undefined ? args.completed : true };
      return eventService.updateEvent(userId, args.id, updates);
    }

    default:
      console.warn(`[functionExecutor] Unknown function: ${functionName}`);
      return { success: false, error: `Unknown function: ${functionName}` };
  }
}
