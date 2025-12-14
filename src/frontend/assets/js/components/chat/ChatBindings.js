/**
 * calendar/chat/ChatBindings.js
 * ربط الـ DOM events بالـ manager عن طريق واجهات بسيطة (لا يقم بتنفيذ لوجيك)
 */
export default {
    bindAll({ ui, onSubmit, onClearHistory }) {
      if (!ui || !ui.form || !ui.textarea) {
        console.warn('[ChatBindings] UI elements not found, skipping binds');
        return;
      }
  
      // submit
      ui.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = ui.textarea.value || '';
        if (typeof onSubmit === 'function') onSubmit(text);
        ui.textarea.value = '';
        ui.autoResizeTextarea();
        ui.updateInputLayout();
      });
  
      // textarea input behaviors
      ui.textarea.addEventListener('input', () => {
        ui.autoResizeTextarea();
        ui.updateInputLayout();
      });
  
      ui.textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const text = ui.textarea.value || '';
          if (typeof onSubmit === 'function') onSubmit(text);
          ui.textarea.value = '';
          ui.autoResizeTextarea();
          ui.updateInputLayout();
        }
      });
  
      // Extra: clear history button if exists
      const clearBtn = document.getElementById('aiChatClear');
      if (clearBtn && typeof onClearHistory === 'function') {
        clearBtn.addEventListener('click', (e) => {
          e.preventDefault();
          onClearHistory();
        });
      }
    }
  };
  