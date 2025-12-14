/**
 * Messages.js - إدارة رسائل النظام
 */
export class Messages {
    constructor(containerSelector = '#messageContainer') {
      this.containerSelector = containerSelector;
    }
    
    show(message, type = 'info', duration = 3000) {
      const container = document.querySelector(this.containerSelector) || document.body;
      
      const msg = document.createElement('div');
      msg.className = `message message-${type}`;
      msg.textContent = message;
      
      container.appendChild(msg);
      
      setTimeout(() => msg.classList.add('show'), 10);
      
      setTimeout(() => {
        msg.classList.remove('show');
        setTimeout(() => msg.remove(), 300);
      }, duration);
    }
    
    success(message) { this.show(message, 'success'); }
    error(message) { this.show(message, 'error'); }
    warning(message) { this.show(message, 'warning'); }
    info(message) { this.show(message, 'info'); }
  }
  
  // Singleton للاستخدام العام
  export const messageManager = new Messages();