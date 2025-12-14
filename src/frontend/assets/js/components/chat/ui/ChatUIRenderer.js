/**
 * calendar/chat/ui/ChatUIRenderer.js
 * مسؤول عن DOM rendering للرسائل، تغييرات textarea، والـ layout البسيط
 */
export default class ChatUIRenderer {
    constructor(opts = {}) {
      this.messagesContainerId = opts.messagesContainerId || 'aiChatMessages';
      this.formId = opts.formId || 'aiChatForm';
      this.textareaId = opts.textareaId || 'aiChatMessage';
  
      this.messagesContainer = document.getElementById(this.messagesContainerId);
      this.form = document.getElementById(this.formId);
      this.textarea = document.getElementById(this.textareaId);
  
      // internal history (mirrors ChatHistory)
      this.history = [];
    }
  
    setHistory(historyArray = []) {
      this.history = Array.isArray(historyArray) ? historyArray : [];
    }
  
    createMessageEl(message) {
      const wrapper = document.createElement('div');
      wrapper.className = `ai-message ${message.role}`;
      wrapper.setAttribute('data-message-id', message.id);
  
      const text = document.createElement('div');
      text.className = 'message-content';
      // Use textContent to avoid injecting HTML
      text.textContent = message.content;
  
      wrapper.appendChild(text);
      return wrapper;
    }
  
    renderMessages() {
      if (!this.messagesContainer) return;
      this.messagesContainer.innerHTML = '';
  
      if (!this.history.length) {
        this.messagesContainer.classList.add('empty');
        return;
      }
  
      this.messagesContainer.classList.remove('empty');
      this.history.forEach(msg => {
        this.messagesContainer.appendChild(this.createMessageEl(msg));
      });
  
      this.scrollToBottom();
    }
  
    scrollToBottom() {
      if (!this.messagesContainer) return;
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  
    autoResizeTextarea() {
      if (!this.textarea) return;
      this.textarea.style.height = 'auto';
      this.textarea.style.height = Math.min(this.textarea.scrollHeight, 120) + 'px';
    }
  
    updateInputLayout() {
      const wrapper = this.form?.querySelector('.ai-chat-input-wrapper');
      if (!wrapper || !this.textarea) return;
  
      const hasNewline = this.textarea.value.includes('\n');
      const isTall = this.textarea.scrollHeight > 48;
      if (hasNewline || isTall) wrapper.classList.add('has-multiline');
      else wrapper.classList.remove('has-multiline');
    }
  }
  