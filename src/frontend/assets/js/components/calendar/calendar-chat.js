/**
 * Calendar Chat Manager - Qwen Plus Integration via Firebase Functions
 * Manages AI chat functionality for the calendar application
 */
import CalendarAI from '../../core/firebase/services/AI/CalendarAI.js';
import { defaultFunctionExecutor } from '../../core/firebase/services/AI/functionExecutor.js';
import EventService from '../../core/firebase/services/eventService/EventService.js';
import { authManager } from '../../core/utils/auth.js';

class CalendarChatManager {
  /**
   * Initialize the chat manager
   * @param {Object} config - Configuration object
   */
  constructor(config = {}) {
    this.messagesContainer = document.getElementById('aiChatMessages');
    this.form = document.getElementById('aiChatForm');
    this.textarea = document.getElementById('aiChatMessage');   

    this.history = [];

    // Initialize CalendarAI for Firebase Functions
    this.calendarAI = new CalendarAI();
    this.eventService = new EventService();
    this.currentUser = null;
    this.useFirebaseFunctions = true; // Use Firebase Functions instead of direct API

    // Configuration defaults
    this.maxHistory = 50; // Maximum number of messages to keep in history
    this.storageKey = 'calendar_chat_history'; // localStorage key for chat history

    this.init();
  }

  /**
   * Initialize the chat manager
   */
  async init() {

    // Get current user for Firebase Functions
    this.currentUser = await authManager.checkAuth();

    

    this.history = this.loadHistory();
    this.bindEvents();
    this.renderMessages();

  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    this.form.addEventListener('submit', (event) => this.handleSubmit(event));

    // Auto-resize textarea and update input layout
    this.textarea.addEventListener('input', () => {
      this.autoResizeTextarea();
      this.updateInputLayout();
    });

    // Handle Enter key
    this.textarea.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        this.handleSubmit(event);
      }
    });
  }

  /**
   * Auto-resize textarea based on content
   */
  autoResizeTextarea() {
    this.textarea.style.height = 'auto';
    this.textarea.style.height = Math.min(this.textarea.scrollHeight, 120) + 'px';
  }

  /**
   * Update input layout (center button when single-line, move text above button when multi-line)
   */
  updateInputLayout() {
    const wrapper = this.form.querySelector('.ai-chat-input-wrapper');
    if (!wrapper) return;

    // Consider multi-line when there's an actual newline or height is larger than a single line
    const hasNewline = this.textarea.value.includes('\n');
    const isTall = this.textarea.scrollHeight > 48; // ~single line height threshold

    if (hasNewline || isTall) {
      wrapper.classList.add('has-multiline');
    } else {
      wrapper.classList.remove('has-multiline');
    }
  }

  /**
   * Handle form submission
   * @param {Event} event - Form submit event
   */
  async handleSubmit(event) {
    event.preventDefault();
    const value = this.textarea.value.trim();
    if (!value) return;

    this.appendMessage('user', value);
    this.textarea.value = '';
    this.textarea.style.height = 'auto';
    this.textarea.focus();

    const thinking = this.appendMessage('assistant', '... جارٍ التفكير 🤔');

    try {
      let reply;
      let toolCalls = [];

      if (this.useFirebaseFunctions && this.currentUser) {
        // Use Firebase Functions (Qwen Plus with tools)
        const result = await this.callFirebaseChat(value);
        reply = result.content;
        toolCalls = result.toolCalls || [];

        // Execute tool calls if any
        if (toolCalls.length > 0) {
          await this.executeToolCalls(toolCalls);
          reply += '\n\n✅ تم تنفيذ الأوامر بنجاح';
        }
      } else {
        // Fallback to direct API
        reply = await this.callQwenPlus(value);
      }

      this.updateMessage(thinking.id, reply);
    } catch (error) {
      this.updateMessage(thinking.id, 'تعذر الحصول على رد حالياً. تحقق من الإعدادات أو أعد المحاولة لاحقاً.');
    }
  }

  /**
   * Call Firebase Chat Function
   * @param {string} message - User message
   * @returns {Promise<Object>} AI response with content and toolCalls
   */
  async callFirebaseChat(message) {
    if (!this.currentUser?.uid) {
      throw new Error('يجب تسجيل الدخول أولاً');
    }

    // Build conversation history for context
    const conversationHistory = this.history
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .slice(-10) // Keep last 10 messages for context
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    const result = await this.calendarAI.useAi(
      {
        content: message,
        type: "message",
        preferredModel: "qwen-plus", // Force Qwen Plus for chat
        conversationHistory: conversationHistory // Send conversation history
      },
      {
        userId: this.currentUser.uid,
        executeFunctions: false // We'll execute them ourselves for better UX
      }
    );

    if (!result.success && result.error) {
      throw new Error(result.error);
    }

    return {
      content: result.content || 'لم أتمكن من فهم طلبك. هل يمكنك إعادة صياغته؟',
      toolCalls: result.toolCalls || []
    };
  }

  /**
   * Execute tool calls from AI response
   * @param {Array} toolCalls - Array of tool calls
   */
  async executeToolCalls(toolCalls) {
    if (!this.currentUser?.uid) {
      console.error('[CalendarChatManager] Cannot execute tool calls: no user ID');
      return;
    }

    for (const toolCall of toolCalls) {
      try {
        const result = await defaultFunctionExecutor(
          toolCall.name,
          toolCall.arguments || {},
          {
            eventService: this.eventService,
            userId: this.currentUser.uid
          }
        );

        console.log(`[CalendarChatManager] Tool ${toolCall.name} executed:`, result);

        // Refresh calendar if events were modified
        if (['createEvent', 'updateEvent', 'deleteEvent', 'markEventComplete'].includes(toolCall.name)) {
          if (window.calendarManager && typeof window.calendarManager.loadEvents === 'function') {
            await window.calendarManager.loadEvents();
            if (typeof window.calendarManager.renderEventList === 'function') {
              window.calendarManager.renderEventList();
            }
          }
        }
      } catch (error) {
        console.error(`[CalendarChatManager] Tool ${toolCall.name} failed:`, error);
      }
    }
  }

  /**
   * Load chat history from localStorage
   * @returns {Array} Chat history
   */
  loadHistory() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      const history = saved ? JSON.parse(saved) : [];

      // Limit history size
      if (history.length > this.maxHistory) {
        history.splice(0, history.length - this.maxHistory);
        this.saveHistory(history);
      }

      console.log(`[CalendarChatManager] Loaded ${history.length} messages from history`);
      return history;
    } catch (error) {
      console.error('[CalendarChatManager] Unable to load chat history:', error);
      return [];
    }
  }

  /**
   * Save chat history to localStorage
   * @param {Array} history - Chat history to save
   */
  saveHistory(history) {
    try {
      // Limit history size before saving
      const limitedHistory = history.length > this.maxHistory
        ? history.slice(-this.maxHistory)
        : history;

      localStorage.setItem(this.storageKey, JSON.stringify(limitedHistory));
      console.log(`[CalendarChatManager] Saved ${limitedHistory.length} messages to history`);
    } catch (error) {
      console.error('[CalendarChatManager] Unable to save chat history:', error);
    }
  }

  /**
   * Create message element
   * @param {Object} message - Message object
   * @returns {HTMLElement} Message element
   */
  createMessageEl(message) {
    const wrapper = document.createElement('div');
    wrapper.className = `ai-message ${message.role}`;
    wrapper.setAttribute('data-message-id', message.id);

    const text = document.createElement('div');
    text.textContent = message.content;
    text.className = 'message-content';

    wrapper.appendChild(text);

    return wrapper;
  }

  /**
   * Render all messages
   */
  renderMessages() {
    this.messagesContainer.innerHTML = '';

    if (!this.history.length) {
      this.messagesContainer.classList.add('empty');
      return;
    }

    this.messagesContainer.classList.remove('empty');

    this.history.forEach((message) => {
      this.messagesContainer.appendChild(this.createMessageEl(message));
    });

    this.scrollToBottom();
  }

  /**
   * Scroll to bottom of messages container
   */
  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  /**
   * Append a new message
   * @param {string} role - Message role (user/assistant)
   * @param {string} content - Message content
   * @returns {Object} Created message object
   */
  appendMessage(role, content) {
    const message = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date().toISOString()
    };

    this.history.push(message);
    this.saveHistory(this.history);
    this.renderMessages();

    return message;
  }

  /**
   * Update an existing message
   * @param {string} messageId - Message ID to update
   * @param {string} content - New content
   */
  updateMessage(messageId, content) {
    this.history = this.history.map((msg) =>
      msg.id === messageId
        ? { ...msg, content, timestamp: new Date().toISOString() }
        : msg
    );

    this.saveHistory(this.history);
    this.renderMessages();
  }

  /**
   * Build chat payload for API call (fallback method - not used with Firebase Functions)
   * @param {string} prompt - User prompt
   * @returns {Object} API payload
   */
  buildChatPayload(prompt) {
    const conversation = this.history
      .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
      .map((msg) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }));

    conversation.push({ role: 'user', content: prompt });

    // Default config for fallback API (not used when Firebase Functions is enabled)
    const config = this.config || {
      model: 'qwen-plus',
      temperature: 0.7,
      maxTokens: 2000
    };

    return {
      model: config.model,
      temperature: config.temperature,
      messages: conversation,
      max_tokens: config.maxTokens
    };
  }

  /**
   * Call Qwen Plus API (fallback method - not used with Firebase Functions)
   * @param {string} prompt - User prompt
   * @returns {Promise<string>} AI response
   */
  async callQwenPlus(prompt) {
    // Fallback config (not used when Firebase Functions is enabled)
    const config = this.config || {
      apiKey: window.QWEN_PLUS_CONFIG?.apiKey,
      endpoint: window.QWEN_PLUS_CONFIG?.endpoint || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
    };

    if (!config.apiKey) {
      throw new Error('لم يتم ضبط مفتاح Qwen Plus. يرجى إضافة window.QWEN_PLUS_CONFIG.apiKey');
    }

    const devConfig = this.devConfig || { apiTimeout: 30000 };
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), devConfig.apiTimeout);

    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.config.apiKey,
          'X-DashScope-SSE': 'disable'
        },
        body: JSON.stringify(this.buildChatPayload(prompt)),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Qwen Plus API error: ${response.status} ${errorBody}`);
      }

      const data = await response.json();
      const reply = data?.choices?.[0]?.message?.content?.trim();

      if (!reply) {
        throw new Error('رد غير متوقع من Qwen Plus');
      }

      console.log('[CalendarChatManager] Successfully received response from Qwen Plus');
      return reply;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('انتهت مهلة الاتصال بـ Qwen Plus');
      }

      throw error;
    }
  }

  /**
   * Clear chat history
   */
  clearHistory() {
    this.history = [];
    this.saveHistory(this.history);
    this.renderMessages();
  }

  /**
   * Get chat history
   * @returns {Array} Chat history
   */
  getHistory() {
    return [...this.history];
  }

  /**
   * Set configuration (for fallback API - not used with Firebase Functions)
   * @param {Object} config - New configuration
   */
  setConfig(config) {
    if (!this.config) {
      this.config = {};
    }
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration (for fallback API - not used with Firebase Functions)
   * @returns {Object} Current configuration
   */
  getConfig() {
    return this.config ? { ...this.config } : {};
  }

  /**
   * Export chat history
   * @returns {string} JSON string of chat history
   */
  exportHistory() {
    return JSON.stringify(this.history, null, 2);
  }

  /**
   * Import chat history
   * @param {string} historyJson - JSON string of chat history
   */
  importHistory(historyJson) {
    try {
      const importedHistory = JSON.parse(historyJson);
      if (Array.isArray(importedHistory)) {
        this.history = importedHistory;
        this.saveHistory(this.history);
        this.renderMessages();
      } else {
        throw new Error('Invalid history format');
      }
    } catch (error) {
      console.error('[CalendarChatManager] Failed to import history:', error);
      throw new Error('Failed to import chat history');
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize chat toggle functionality
  const aiChatToggle = document.getElementById('aiChatToggle');
  const aiChatClose = document.getElementById('aiChatClose');
  const calendarLayout = document.querySelector('.calendar-ai-layout');

  function openChat() {
    if (calendarLayout) {
      calendarLayout.classList.add('ai-chat-open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeChat() {
    if (calendarLayout) {
      const aiChatPanel = document.getElementById('aiChatPanel');
      if (aiChatPanel) {
        // Add closing class for animation
        calendarLayout.classList.add('ai-chat-closing');
        calendarLayout.classList.remove('ai-chat-open');

        // Wait for animation to complete before hiding
        setTimeout(() => {
          calendarLayout.classList.remove('ai-chat-closing');
          document.body.style.overflow = '';
        }, 300); // Match CSS animation duration
      } else {
        calendarLayout.classList.remove('ai-chat-open');
        document.body.style.overflow = '';
      }
    }
  }

  // Toggle chat on button click
  if (aiChatToggle && calendarLayout) {
    aiChatToggle.addEventListener('click', () => {
      if (calendarLayout.classList.contains('ai-chat-open')) {
        closeChat();
      } else {
        openChat();
      }
    });
  }

  // Close chat on close button click
  if (aiChatClose && calendarLayout) {
    aiChatClose.addEventListener('click', closeChat);
  }

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && calendarLayout && calendarLayout.classList.contains('ai-chat-open')) {
      closeChat();
    }
  });

  // Initialize CalendarChatManager
  window.calendarChatManager = new CalendarChatManager();
});

// Export for module systems
export default CalendarChatManager;