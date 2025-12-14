/**
 * calendar/chat/services/ChatAIService.js
 * خدمة للتعامل مع AI (Firebase functions wrapper + fallback Qwen API)
 */
import CalendarAI from '../../../core/firebase/services/AI/CalendarAI.js';

export default class ChatAIService {
  constructor(opts = {}) {
    this.calendarAI = new CalendarAI();
    // default fallbacks (if you want direct API later)
    this.fallbackConfig = opts.fallbackConfig || null;
  }

  /**
   * Call Firebase function for chat (returns { content, toolCalls })
   * payload: { content, type, preferredModel, conversationHistory }
   * opts: { userId, executeFunctions }
   */
  async callFirebaseChat(message, opts = {}) {
    if (!opts?.userId) {
      throw new Error('يجب توفير userId لاستدعاء دالة Firebase');
    }

    const payload = {
      content: message,
      type: 'message',
      preferredModel: opts.preferredModel || 'qwen-plus',
      conversationHistory: opts.conversationHistory || []
    };

    const meta = {
      userId: opts.userId,
      executeFunctions: opts.executeFunctions === true // caller may choose
    };

    const result = await this.calendarAI.useAi(payload, meta);

    if (!result || result.success === false) {
      const err = result?.error || 'خطأ غير معروف من خدمة AI';
      throw new Error(err);
    }

    return {
      content: result.content || '',
      toolCalls: result.toolCalls || []
    };
  }

  /**
   * Fallback: direct Qwen Plus call (kept for compatibility).
   * Implementers: ensure this.fallbackConfig is populated if used.
   */
  async callQwenPlus(prompt) {
    const cfg = this.fallbackConfig;
    if (!cfg || !cfg.apiKey) {
      throw new Error('Fallback Qwen Plus config غير مضبوط');
    }

    const payload = {
      model: cfg.model || 'qwen-plus',
      temperature: cfg.temperature ?? 0.7,
      messages: cfg.buildConversation ? cfg.buildConversation(prompt) : [{ role: 'user', content: prompt }],
      max_tokens: cfg.maxTokens || 2000
    };

    const res = await fetch(cfg.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + cfg.apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Qwen Plus fallback error: ${res.status} ${txt}`);
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || '';
  }
}
