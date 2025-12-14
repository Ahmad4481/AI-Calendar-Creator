/**
 * calendar/chat/initChat.js
 * ملف التهيئة: يمرّر التبعيات ويعمل window.calendarChatManager
 */
import CalendarChatManager from './ChatManager.js';
import EventService from '../../core/firebase/services/eventService/EventService.js';

document.addEventListener('DOMContentLoaded', () => {
  // اختياري: inject eventService لكي يستخدمه executor داخلياً
  const eventService = new EventService();

  const manager = new CalendarChatManager({
    messagesContainerId: 'aiChatMessages',
    formId: 'aiChatForm',
    textareaId: 'aiChatMessage',
    storageKey: 'calendar_chat_history',
    useFirebaseFunctions: true,
    eventService
  });

  window.calendarChatManager = manager;

  // UI toggles (same logic كما في ملفك الأصلي)
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
        calendarLayout.classList.add('ai-chat-closing');
        calendarLayout.classList.remove('ai-chat-open');
        setTimeout(() => {
          calendarLayout.classList.remove('ai-chat-closing');
          document.body.style.overflow = '';
        }, 300);
      } else {
        calendarLayout.classList.remove('ai-chat-open');
        document.body.style.overflow = '';
      }
    }
  }

  if (aiChatToggle && calendarLayout) {
    aiChatToggle.addEventListener('click', () => {
      if (calendarLayout.classList.contains('ai-chat-open')) closeChat();
      else openChat();
    });
  }
  if (aiChatClose && calendarLayout) aiChatClose.addEventListener('click', closeChat);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && calendarLayout?.classList.contains('ai-chat-open')) {
      closeChat();
    }
  });
});
