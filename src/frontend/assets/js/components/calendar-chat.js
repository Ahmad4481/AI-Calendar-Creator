/**
 * Calendar Chat Manager - Qwen Plus Integration
 * Manages AI chat functionality for the calendar application
 */
class CalendarChatManager {
  /**
   * Initialize the chat manager
   * @param {Object} config - Configuration object
   */
  constructor(config = {}) {
    // Get configuration from ConfigManager
    this.configManager = window.configManager || new ConfigManager();
    this.storageConfig = this.configManager.getStorageConfig();
    this.qwenConfig = this.configManager.getQwenPlusConfig();
    this.devConfig = this.configManager.getDevConfig();
    
    this.storageKey = this.storageConfig.chatHistoryKey;
    this.messagesContainer = document.getElementById('aiChatMessages');
    this.form = document.getElementById('aiChatForm');
    this.textarea = document.getElementById('aiChatMessage');
    
    // Merge with provided config
    this.config = {
      ...this.qwenConfig,
      ...config
    };
    
    this.history = [];
    this.maxHistory = this.configManager.getUIConfig().maxChatHistory;
    
    this.init();
  }

  /**
   * Initialize the chat manager
   */
  init() {
    if (!this.messagesContainer || !this.form || !this.textarea) {
      this.configManager.error('Required DOM elements not found');
      return;
    }

    if (!this.config.apiKey) {
      this.configManager.warn('Missing API key. Set window.QWEN_PLUS_CONFIG = { apiKey: "..." } before loading calendar-chat.js.');
    }

    this.history = this.loadHistory();
    this.bindEvents();
    this.renderMessages();
    
    this.configManager.debug('CalendarChatManager initialized successfully');
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    this.form.addEventListener('submit', (event) => this.handleSubmit(event));
    
    // Auto-resize textarea
    this.textarea.addEventListener('input', () => this.autoResizeTextarea());
    
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

    const thinking = this.appendMessage('assistant', '... جارٍ التفكير باستخدام Qwen Plus');

    try {
      const reply = await this.callQwenPlus(value);
      this.updateMessage(thinking.id, reply);
    } catch (error) {
      this.configManager.error('Failed to get response from Qwen Plus', error);
      this.updateMessage(thinking.id, 'تعذر الحصول على رد من Qwen Plus حالياً. تحقق من الإعدادات أو أعد المحاولة لاحقاً.');
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
      
      this.configManager.debug(`Loaded ${history.length} messages from history`);
      return history;
    } catch (error) {
      this.configManager.error('Unable to load chat history', error);
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
      this.configManager.debug(`Saved ${limitedHistory.length} messages to history`);
    } catch (error) {
      this.configManager.error('Unable to save chat history', error);
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
   * Build chat payload for API call
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

    return {
      model: this.config.model,
      temperature: this.config.temperature,
      messages: conversation,
      max_tokens: this.config.maxTokens
    };
  }

  /**
   * Call Qwen Plus API
   * @param {string} prompt - User prompt
   * @returns {Promise<string>} AI response
   */
  async callQwenPlus(prompt) {
    if (!this.config.apiKey) {
      throw new Error('لم يتم ضبط مفتاح Qwen Plus. يرجى إضافة window.QWEN_PLUS_CONFIG.apiKey');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.devConfig.apiTimeout);

    try {
      const response = await fetch(this.config.endpoint, {
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

      this.configManager.debug('Successfully received response from Qwen Plus');
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
   * Set configuration
   * @param {Object} config - New configuration
   */
  setConfig(config) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return { ...this.config };
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
  window.calendarChatManager = new CalendarChatManager();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CalendarChatManager;
}