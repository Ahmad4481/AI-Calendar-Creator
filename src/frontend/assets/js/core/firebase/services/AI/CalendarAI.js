// CalendarAI.js
import PreferencesCalendarService from "../settingsService/PreferencesCalendar/PreferencesCalendarService.js";
import EventService from "../eventService/EventService.js";
import AiService from "./aiService.js";
import { executeFunctionCalls, defaultFunctionExecutor } from "./functionExecutor.js";
import { parseEventsFromContent } from "./eventParser.js";

class CalendarAI {
  constructor() {
    this.system = new PreferencesCalendarService();
    this.events = new EventService();
    this.aiService = new AiService();
  }

  async useAi(data, options = {}) {
    const userId = options.userId || data.userId;
    if (!userId) throw new Error("userId required");

    const systemConfig = await this.system.getPreferencesCalendar(userId);
    const content =
      (data.content && (data.content.answer || data.content.message)) ||
      (typeof data.content === "string" ? data.content : JSON.stringify(data.content || ""));

    const payload = {
      content,
      type: data.type || "message",
      systemContext: {
        aiQuestions: systemConfig?.aiQuestions || {},
        userPreferences: systemConfig?.goals || [],
        unavailableTimes: systemConfig?.unavailableTimes || []
      }
    };

    const aiResult = await this.aiService.callAi(payload);

    // Normalize tool calls from different model formats
    let functionCalls = aiResult.toolCalls || aiResult.function_calls || [];

    // If no function calls and we asked to execute, try to parse events from content
    if ((!functionCalls || functionCalls.length === 0) && aiResult.content && options.executeFunctions) {
      const parsed = parseEventsFromContent(aiResult.content);
      if (parsed && parsed.length) {
        functionCalls = parsed.map((evt, i) => ({
          id: `parsed_${i}`,
          name: "createEvent",
          arguments: evt
        }));
      }
    }

    // Execute function calls if requested
    if (options.executeFunctions && functionCalls && functionCalls.length > 0) {
      const execResults = await executeFunctionCalls(
        functionCalls,
        null,
        {
          defaultExecutor: defaultFunctionExecutor,
          context: {
            eventService: this.events,
            userId
          }
        }
      );

      aiResult.function_results = execResults;
    }

    return aiResult;
  }

  async chat(message, userId) {
    return this.useAi({ content: message, type: "message" }, { userId, executeFunctions: true });
  }
}

export default CalendarAI;
