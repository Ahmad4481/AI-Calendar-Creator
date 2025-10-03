// Qwen Plus chat integration (front-end helper).
// Set the API key and optional overrides before this script loads, e.g.:
// window.QWEN_PLUS_CONFIG = {
//   apiKey: 'sk-your-qwen-key',
//   endpoint: 'https://dashscope.aliyun.com/compatible-mode/v1/chat/completions',
//   model: 'qwen-plus',
//   temperature: 0.7
// };
// Set the API key and optional overrides before this script loads, e.g.:
// window.QWEN_PLUS_CONFIG = {
//   apiKey: 'sk-xxxx',
//   endpoint: 'https://dashscope.aliyun.com/compatible-mode/v1/chat/completions',
//   model: 'qwen-plus',
//   temperature: 0.7
// };

(function () {
  const storageKey = 'ai-calendar-chat-history';
  const messagesContainer = document.getElementById('aiChatMessages');
  const form = document.getElementById('aiChatForm');
  const textarea = document.getElementById('aiChatMessage');

  if (!messagesContainer || !form || !textarea) {
    return;
  }

  const CONFIG = {
    endpoint: 'https://dashscope.aliyun.com/compatible-mode/v1/chat/completions',
    model: 'qwen-plus',
    temperature: 0.7,
    maxTokens: 1024,
    ...window.QWEN_PLUS_CONFIG
  };

  if (!CONFIG.apiKey) {
    console.warn('[Qwen Plus] Missing API key. Set window.QWEN_PLUS_CONFIG = { apiKey: "..." } before loading calendar-chat.js.');
  }

  const loadHistory = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.warn('Unable to load chat history', error);
      return [];
    }
  };

  const saveHistory = (history) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(history));
    } catch (error) {
      console.warn('Unable to save chat history', error);
    }
  };

  let history = loadHistory();

  const createMessageEl = (message) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'ai-message ' + message.role;

    const text = document.createElement('div');
    text.textContent = message.content;
    wrapper.appendChild(text);

    return wrapper;
  };

  const renderMessages = () => {
    messagesContainer.innerHTML = '';
    if (!history.length) {
      messagesContainer.classList.add('empty');
      return;
    }
    messagesContainer.classList.remove('empty');
    history.forEach((message) => {
      messagesContainer.appendChild(createMessageEl(message));
    });
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  };

  const appendMessage = (role, content) => {
    const message = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date().toISOString()
    };
    history.push(message);
    saveHistory(history);
    renderMessages();
    return message;
  };

  const buildChatPayload = (prompt) => {
    const conversation = history
      .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
      .map((msg) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }));

    conversation.push({ role: 'user', content: prompt });

    return {
      model: CONFIG.model,
      temperature: CONFIG.temperature,
      messages: conversation,
      max_tokens: CONFIG.maxTokens
    };
  };

  const callQwenPlus = async (prompt) => {
    if (!CONFIG.apiKey) {
      throw new Error('لم يتم ضبط مفتاح Qwen Plus. يرجى إضافة window.QWEN_PLUS_CONFIG.apiKey');
    }

    const response = await fetch(CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + CONFIG.apiKey,
        'X-DashScope-SSE': 'disable'
      },
      body: JSON.stringify(buildChatPayload(prompt))
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error('Qwen Plus API error: ' + response.status + ' ' + errorBody);
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      throw new Error('رد غير متوقع من Qwen Plus');
    }

    return reply;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const value = textarea.value.trim();
    if (!value) return;

    appendMessage('user', value);
    textarea.value = '';
    textarea.focus();

    const thinking = appendMessage('assistant', '... جارٍ التفكير باستخدام Qwen Plus');

    try {
      const reply = await callQwenPlus(value);
      history = history.map((msg) =>
        msg.id === thinking.id ? { ...msg, content: reply, timestamp: new Date().toISOString() } : msg
      );
      saveHistory(history);
      renderMessages();
    } catch (error) {
      console.error('[Qwen Plus]', error);
      history = history.map((msg) =>
        msg.id === thinking.id
          ? {
              ...msg,
              content: 'تعذر الحصول على رد من Qwen Plus حالياً. تحقق من الإعدادات أو أعد المحاولة لاحقاً.',
              timestamp: new Date().toISOString()
            }
          : msg
      );
      saveHistory(history);
      renderMessages();
    }
  });

  renderMessages();
})();
