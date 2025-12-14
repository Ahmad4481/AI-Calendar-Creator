/**
 * calendar/chat/services/ChatHistory.js
 * مسؤول عن تخزين وتحميل الرسائل (localStorage) وعمليات CRUD على القائمة
 */
export default class ChatHistory {
    constructor(opts = {}) {
      this.storageKey = opts.storageKey || 'calendar_chat_history';
      this.maxHistory = opts.maxHistory || 200;
      this.history = this._load();
    }
  
    _load() {
      try {
        const raw = localStorage.getItem(this.storageKey);
        const arr = raw ? JSON.parse(raw) : [];
        if (Array.isArray(arr) && arr.length > this.maxHistory) {
          const sliced = arr.slice(-this.maxHistory);
          localStorage.setItem(this.storageKey, JSON.stringify(sliced));
          return sliced;
        }
        return Array.isArray(arr) ? arr : [];
      } catch (err) {
        console.error('[ChatHistory] load error', err);
        return [];
      }
    }
  
    loadHistory() {
      this.history = this._load();
      return [...this.history];
    }
  
    saveHistory() {
      try {
        const limited = this.history.length > this.maxHistory ? this.history.slice(-this.maxHistory) : this.history;
        localStorage.setItem(this.storageKey, JSON.stringify(limited));
      } catch (err) {
        console.error('[ChatHistory] save error', err);
      }
    }
  
    appendMessage(role, content) {
      const msg = {
        id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2),
        role,
        content,
        timestamp: new Date().toISOString()
      };
      this.history.push(msg);
      this.saveHistory();
      return msg;
    }
  
    updateMessage(messageId, content) {
      this.history = this.history.map(m => m.id === messageId ? { ...m, content, timestamp: new Date().toISOString() } : m);
      this.saveHistory();
    }
  
    clearHistory() {
      this.history = [];
      this.saveHistory();
    }
  
    getHistory() {
      return [...this.history];
    }
  
    exportHistory() {
      return JSON.stringify(this.history, null, 2);
    }
  
    importHistory(json) {
      try {
        const arr = JSON.parse(json);
        if (!Array.isArray(arr)) throw new Error('Invalid format');
        this.history = arr.slice(0, this.maxHistory);
        this.saveHistory();
        return true;
      } catch (err) {
        console.error('[ChatHistory] import error', err);
        throw err;
      }
    }
  }
  