import { APP_CONSTANTS } from './constants.js';

// Message display utility
export class MessageManager {
  constructor() {
    this.activeMessages = new Set();
  }

  show(message, type = 'info', duration = APP_CONSTANTS.MESSAGE_DISPLAY_DURATION) {
    // Remove existing messages of same type
    this.clear(type);

    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.textContent = message;
    messageEl.setAttribute('role', 'alert');
    messageEl.setAttribute('aria-live', 'polite');

    // Add styles
    messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      border-radius: var(--radius, 8px);
      color: white;
      font-weight: 500;
      z-index: 10000;
      animation: slideIn 0.3s ease;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      pointer-events: auto;
    `;

    // Set background color based on type
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };
    messageEl.style.backgroundColor = colors[type] || colors.info;

    document.body.appendChild(messageEl);
    this.activeMessages.add(messageEl);

    // Auto remove
    setTimeout(() => {
      this.remove(messageEl);
    }, duration);
  }

  success(message, duration) {
    this.show(message, 'success', duration);
  }

  error(message, duration) {
    this.show(message, 'error', duration);
  }

  warning(message, duration) {
    this.show(message, 'warning', duration);
  }

  info(message, duration) {
    this.show(message, 'info', duration);
  }

  remove(messageEl) {
    if (!messageEl || !messageEl.parentNode) return;
    
    messageEl.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.remove();
      }
      this.activeMessages.delete(messageEl);
    }, 300);
  }

  clear(type = null) {
    const messages = document.querySelectorAll('.message');
    messages.forEach(msg => {
      if (!type || msg.classList.contains(`message-${type}`)) {
        this.remove(msg);
      }
    });
  }

  clearAll() {
    this.clear();
  }
}

// Global instance
export const messageManager = new MessageManager();

// Convenience functions
export const showMessage = (message, type = 'info') => {
  messageManager.show(message, type);
};

export const showSuccess = (message) => {
  messageManager.success(message);
};

export const showError = (message) => {
  messageManager.error(message);
};

export default messageManager;

