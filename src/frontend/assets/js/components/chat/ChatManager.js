/**
 * calendar/chat/ChatManager.js
 * Orchestrator: يدير الحالة العامة، يربط UI مع الخدمات، ينفذ الاتصالات.
 */
import ChatAIService from './services/ChatAIService.js';
import ChatHistory from './services/ChatHistory.js';
import ToolCallExecutor from './services/ToolCallExecutor.js';
import ChatUIRenderer from './ui/ChatUIRenderer.js';
import ChatBindings from './ChatBindings.js';
import { authManager } from '../../core/utils/auth.js';

export default class ChatManager {
  constructor(options = {}) {
    this.options = options;

    // Services
    this.aiService = new ChatAIService();
    this.historyService = new ChatHistory({ storageKey: options.storageKey });
    this.toolExecutor = new ToolCallExecutor({
      eventService: options.eventService // optional injection
    });

    // UI
    this.ui = new ChatUIRenderer({
      messagesContainerId: options.messagesContainerId || 'aiChatMessages',
      formId: options.formId || 'aiChatForm',
      textareaId: options.textareaId || 'aiChatMessage'
    });

    // State
    this.currentUser = null;
    this.useFirebaseFunctions = options.useFirebaseFunctions ?? true;
    this.maxHistoryForContext = options.maxHistoryForContext || 10;

    // Bindings
    this.onToolCallExecuted = options.onToolCallExecuted || null;

    this.init();
  }

  async init() {
    // auth
    this.currentUser = await authManager.checkAuth();

    // load history into ui
    const history = this.historyService.loadHistory();
    this.ui.setHistory(history);

    // bind UI events via ChatBindings; provide callbacks
    ChatBindings.bindAll({
      ui: this.ui,
      onSubmit: (value) => this.handleSubmit(value),
      onClearHistory: () => this.clearHistory()
    });

    // initial render
    this.ui.renderMessages();
  }

  async handleSubmit(text) {
    const trimmed = text?.trim();
    if (!trimmed) return;

    // append user message
    const userMsg = this.historyService.appendMessage('user', trimmed);
    this.ui.renderMessages();

    // append assistant placeholder (thinking)
    const thinking = this.historyService.appendMessage('assistant', '... جارٍ التفكير');
    this.ui.renderMessages();

    try {
      let reply = '';
      let toolCalls = [];

      if (this.useFirebaseFunctions && this.currentUser) {
        const aiResult = await this.aiService.callFirebaseChat(trimmed, {
          userId: this.currentUser.uid,
          conversationHistory: this._getHistoryForContext()
        });

        reply = aiResult.content || '';
        toolCalls = aiResult.toolCalls || [];
      } else {
        reply = await this.aiService.callQwenPlus(trimmed);
      }

      // Execute tool calls (if any) sequentially
      if (Array.isArray(toolCalls) && toolCalls.length) {
        await this.toolExecutor.executeToolCalls(toolCalls, {
          userId: this.currentUser?.uid
        });

        // optional: append note that tools executed
        reply = reply + '\n\n✅ تم تنفيذ الأوامر بنجاح';
      }

      // update assistant message
      this.historyService.updateMessage(thinking.id, reply);
      this.ui.renderMessages();

      // notify external listeners (e.g., calendar) if needed
      if (typeof this.onToolCallExecuted === 'function') {
        this.onToolCallExecuted();
      }
    } catch (err) {
      console.error('[ChatManager] handleSubmit error:', err);
      this.historyService.updateMessage(thinking.id, 'تعذر الحصول على رد حالياً. تحقق من الإعدادات أو أعد المحاولة لاحقاً.');
      this.ui.renderMessages();
    }
  }

  _getHistoryForContext() {
    const all = this.historyService.getHistory();
    return all
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-this.maxHistoryForContext)
      .map(m => ({ role: m.role, content: m.content }));
  }

  // Public helpers
  clearHistory() {
    this.historyService.clearHistory();
    this.ui.renderMessages();
  }

  getHistory() {
    return this.historyService.getHistory();
  }

  exportHistory() {
    return this.historyService.exportHistory();
  }

  importHistory(json) {
    this.historyService.importHistory(json);
    this.ui.renderMessages();
  }

  setUseFirebaseFunctions(flag) {
    this.useFirebaseFunctions = !!flag;
  }
}
