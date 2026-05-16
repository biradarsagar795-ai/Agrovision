/**
 * FarmGuard — Chatbot Module
 */
function initChatbot() {
  const fab = document.getElementById('chatbotFab');
  const panel = document.getElementById('chatbotPanel');
  const closeBtn = document.getElementById('closeChatBtn');
  const sendBtn = document.getElementById('sendChatBtn');
  const input = document.getElementById('chatInput');
  const messages = document.getElementById('chatMessages');
  const voiceBtn = document.getElementById('voiceChatBtn');
  const langSelect = document.getElementById('chatLang');

  if (!fab || !panel) return;

  // Setup Web Speech API
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      input.value = text;
      voiceBtn.classList.remove('recording');
      sendChat();
    };
    
    recognition.onerror = () => {
      voiceBtn.classList.remove('recording');
      showToast('Voice recognition failed', 'error');
    };
    
    recognition.onend = () => {
      voiceBtn.classList.remove('recording');
    };
  } else {
    voiceBtn.style.display = 'none';
  }

  // Event Listeners
  fab.onclick = () => {
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) {
      input.focus();
      if (messages.children.length === 0) {
        addMessage("Hello! I'm your AI farm assistant. Ask me about weather, diseases, or tasks.", 'bot');
      }
    }
  };

  closeBtn.onclick = () => panel.classList.remove('open');
  
  sendBtn.onclick = sendChat;
  
  input.onkeypress = (e) => {
    if (e.key === 'Enter') sendChat();
  };

  voiceBtn.onclick = () => {
    if (!recognition) return;
    if (voiceBtn.classList.contains('recording')) {
      recognition.stop();
    } else {
      // Get lang code from select (e.g., 'en-IN', 'hi-IN')
      const langMap = { en: 'en-IN', hi: 'hi-IN', te: 'te-IN', ta: 'ta-IN', mr: 'mr-IN' };
      recognition.lang = langMap[langSelect.value] || 'en-IN';
      recognition.start();
      voiceBtn.classList.add('recording');
      input.placeholder = "Listening...";
    }
  };

  async function sendChat() {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    input.value = '';
    input.placeholder = "Type your message...";
    
    // Add typing indicator
    const typingId = 'typing-' + Date.now();
    addTypingIndicator(typingId);

    try {
      // Gather context
      const context = {
        page: window.location.hash,
        grade: document.getElementById('gradeLetter')?.textContent || 'Unknown'
      };

      const res = await apiFetch('/chatbot/message', {
        method: 'POST',
        body: { message: text, language: langSelect.value, context }
      });
      
      removeElement(typingId);
      addMessage(res.response, 'bot');
      if (res.action) handleAction(res.action);
      
    } catch (e) {
      removeElement(typingId);
      // Demo fallback logic
      const lower = text.toLowerCase();
      let reply = "I'm not sure about that. Try asking about weather, tasks, or farm health.";
      
      if (lower.includes('weather') || lower.includes('rain')) {
        reply = "It's currently 28°C with 65% humidity. No rain expected today, so it's a good time to spray!";
      } else if (lower.includes('task') || lower.includes('remind')) {
        reply = "You have 3 pending tasks. The next one is 'Spraying' scheduled for 6:00 AM tomorrow.";
      } else if (lower.includes('grade') || lower.includes('health') || lower.includes('disease')) {
        reply = "Your farm grade is B. We detected Powdery Mildew in the North Field. Would you like to see the treatment plan?";
      }

      addMessage(reply, 'bot');
    }
  }

  function addMessage(text, sender) {
    const div = document.createElement('div');
    div.className = `chat-bubble chat-${sender}`;
    div.innerHTML = text; // allow basic HTML from backend
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function addTypingIndicator(id) {
    const div = document.createElement('div');
    div.id = id;
    div.className = 'chat-bubble chat-bot typing';
    div.innerHTML = '<span>.</span><span>.</span><span>.</span>';
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function removeElement(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  function handleAction(action) {
    if (action.type === 'navigate' && action.target) {
      setTimeout(() => {
        Router.go(action.target);
        panel.classList.remove('open');
      }, 1500);
    }
  }

  // Quick chips
  document.querySelectorAll('.chat-chip').forEach(chip => {
    chip.onclick = () => {
      input.value = chip.textContent;
      sendChat();
    };
  });
}
