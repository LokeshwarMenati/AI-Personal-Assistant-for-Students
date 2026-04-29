(function () {
// ============================================
// CHAT SCRIPT (LOCAL STORAGE)
// ============================================

// DOM Elements
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const voiceBtn = document.getElementById('voiceBtn');
const chatMessages = document.getElementById('chatMessages');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const pdfFileInput = document.getElementById('pdfFile');
const uploadPdfBtn = document.getElementById('uploadPdfBtn');
const summaryOutput = document.getElementById('summaryOutput');
const errorBanner = document.getElementById('errorBanner');

const CURRENT_USER_KEY = 'user';

function showToast(message, type = 'success') {
    if (typeof window.showAppToast === 'function') {
        window.showAppToast(message, type);
        return;
    }
}

function showUiError(message) {
    if (!errorBanner) return;
    errorBanner.textContent = message;
    errorBanner.classList.remove('hidden');
}

function clearUiError() {
    if (!errorBanner) return;
    errorBanner.textContent = '';
    errorBanner.classList.add('hidden');
}

// ============================================
// USER & STORAGE HELPERS
// ============================================
function getCurrentUser() {
    try {
        const user = JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
        if (!user) {
            window.location.href = '/';
            return null;
        }
        return user;
    } catch (error) {
        window.location.href = '/';
        return null;
    }
}

function chatStorageKey() {
    const user = getCurrentUser();
    if (!user) return null;
    return `chatHistory:${user.id}`;
}

function getChatHistory() {
    const key = chatStorageKey();
    if (!key) return [];
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch (error) {
        return [];
    }
}

function saveChatHistory(history) {
    const key = chatStorageKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(history));
}

function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

const DEFAULT_API_PORT = '3000';
const API_BASE_URL = window.location.protocol === 'file:' || ((window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') && window.location.port !== DEFAULT_API_PORT)
    ? `http://localhost:${DEFAULT_API_PORT}`
    : '';

async function getServerChatReply(message) {
    const user = getCurrentUser();
    const email = user ? user.email : '';
    const response = await fetch(`${API_BASE_URL}/api/chat/send`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message, email })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
    }

    return data.reply || data.response || 'No response received.';
}

function generateMockAIResponse(userMessage) {
    const message = String(userMessage || '').trim();
    const text = message.toLowerCase();

    if (!message) {
        return 'Ask me a study question and I will help you break it down.';
    }

    if (hasAny(text, ['hello', 'hi', 'hey'])) {
        return 'Hello. Tell me the subject, chapter, or question you are working on, and I will explain it step by step.';
    }

    if (hasAny(text, ['photosynthesis'])) {
        return [
            'Photosynthesis is how green plants make food.',
            '',
            'Plants use sunlight, carbon dioxide, and water to make glucose. Oxygen is released as a byproduct.',
            '',
            'Formula:',
            'Carbon dioxide + water + light energy -> glucose + oxygen',
            '',
            'Key points:',
            '1. Chlorophyll captures sunlight.',
            '2. Leaves take in carbon dioxide.',
            '3. Roots absorb water.',
            '4. Glucose gives the plant energy.'
        ].join('\n');
    }

    if (hasAny(text, ['study plan', 'timetable', 'schedule', 'exam prep'])) {
        return [
            'Here is a simple study plan:',
            '1. List all chapters you need to cover.',
            '2. Put hard topics first.',
            '3. Study in 25-40 minute focus blocks.',
            '4. Solve practice questions after each topic.',
            '5. Review with flashcards at the end of the day.'
        ].join('\n');
    }

    if (hasAny(text, ['calculus', 'derivative', 'integration', 'integral'])) {
        return [
            'Calculus is about change and accumulation.',
            '',
            'Derivatives show how fast something changes.',
            'Integrals show how much something adds up over time.',
            '',
            'Start with limits, then derivatives, then integrals.'
        ].join('\n');
    }

    if (hasAny(text, ['algebra', 'equation'])) {
        return [
            'For algebra, isolate the unknown.',
            '',
            'Example: 2x + 3 = 11',
            '2x = 8',
            'x = 4',
            '',
            'Use the same operation on both sides to keep the equation balanced.'
        ].join('\n');
    }

    if (hasAny(text, ['physics', 'force', 'motion', 'newton'])) {
        return [
            'For physics problems:',
            '1. Write the given values.',
            '2. Write what you need to find.',
            '3. Choose the formula that connects them.',
            '',
            'Example formula: Force = mass x acceleration, or F = ma.'
        ].join('\n');
    }

    if (hasAny(text, ['chemistry', 'atom', 'molecule', 'reaction'])) {
        return [
            'Chemistry studies matter and reactions.',
            '',
            'Core ideas:',
            '1. Atoms are building blocks.',
            '2. Molecules are bonded atoms.',
            '3. Reactions rearrange atoms.',
            '4. Equations must be balanced.'
        ].join('\n');
    }

    if (hasAny(text, ['biology', 'cell'])) {
        return [
            'Biology studies living things.',
            '',
            'Important cell parts:',
            '1. Cell membrane controls entry and exit.',
            '2. Nucleus stores DNA.',
            '3. Mitochondria release energy.',
            '4. Ribosomes make proteins.'
        ].join('\n');
    }

    if (hasAny(text, ['history', 'war', 'revolution'])) {
        return [
            'For history, answer in this order:',
            '1. Background',
            '2. Causes',
            '3. Main events',
            '4. Effects',
            '',
            'Send the exact event name and I will summarize it.'
        ].join('\n');
    }

    if (hasAny(text, ['english', 'essay', 'grammar', 'writing'])) {
        return [
            'For English writing:',
            '1. Introduction: main idea.',
            '2. Body: one point per paragraph.',
            '3. Conclusion: short final summary.',
            '',
            'For grammar, paste the sentence and I will correct it.'
        ].join('\n');
    }

    return [
        `Here is a focused way to study this: "${message}"`,
        '',
        '1. Identify the key terms.',
        '2. Write the rule, formula, or definition involved.',
        '3. Try one example.',
        '4. Check your answer and revise.',
        '',
        'For a better answer, include the subject and chapter name.'
    ].join('\n');
}

function hasAny(text, keywords) {
    return keywords.some(keyword => text.includes(keyword));
}

function bindChatEvents() {
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }

    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    if (chatMessages) {
        chatMessages.addEventListener('click', (event) => {
            const button = event.target instanceof Element
                ? event.target.closest('.quick-btn')
                : null;
            if (button) {
                const question = button.getAttribute('data-question');
                if (question) {
                    sendQuickQuestion(question);
                }
            }
        });
    }

    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            if (!confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
                return;
            }

            saveChatHistory([]);

            chatMessages.innerHTML = `
                <div class="welcome-message">
                    <h2>Welcome to StudyBuddy AI! 👋</h2>
                    <p>Ask me any academic questions. I'm here to help!</p>
                    <div class="quick-questions">
                        <button class="quick-btn" data-question="What are the main topics in physics?">Physics Help</button>
                        <button class="quick-btn" data-question="How do I improve my study skills?">Study Tips</button>
                        <button class="quick-btn" data-question="Can you explain calculus?">Calculus</button>
                    </div>
                </div>
            `;

            alert('Chat history cleared successfully');
        });
    }

    if (uploadPdfBtn) {
        uploadPdfBtn.addEventListener('click', uploadPDF);
    }
}

async function uploadPDF() {
    if (!pdfFileInput || !summaryOutput) return;

    const file = pdfFileInput.files?.[0];
    if (!file) {
        alert('Please select a PDF');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alert('Please choose a PDF smaller than 5 MB');
        return;
    }

    const formData = new FormData();
    formData.append('pdf', file);

    summaryOutput.textContent = 'Processing PDF...';
    showToast('Uploading PDF for summarization...', 'success');
    try {
        const response = await fetch(`${API_BASE_URL}/upload-pdf`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to summarize PDF');
        }

        summaryOutput.textContent = data.summary || 'No content found';
        showToast('PDF summarized successfully.', 'success');
    } catch (error) {
        console.error('PDF upload error:', error);
        summaryOutput.textContent = `Error: ${error.message}`;
        showToast(error.message, 'error');
    }
}

function createTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai typing-message';
    typingDiv.innerHTML = `
        <div class="message-bubble typing-indicator">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
        </div>
    `;
    return typingDiv;
}

async function sendMessage() {
    if (!chatInput || !chatMessages) {
        console.error('Chat UI elements are missing from the page.');
        return;
    }

    const message = chatInput.value.trim();

    if (!message) return;

    // Clear input
    chatInput.value = '';

    // Remove welcome message on first message
    const welcomeMsg = chatMessages.querySelector('.welcome-message');
    if (welcomeMsg) welcomeMsg.remove();

    // Add user message to chat
    const now = new Date();
    addMessageToChat(message, 'user', now);

    // Show typing indicator
    const loadingDiv = createTypingIndicator();
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        let responseText = '';
        try {
            responseText = await getServerChatReply(message);
            clearUiError();
            showToast('Response received.', 'success');
        } catch (serverError) {
            // Always keep chat functional even if backend route is unavailable.
            responseText = generateMockAIResponse(message);
            showUiError(`Using local study mode: ${serverError.message}`);
            showToast('Using local study mode.', 'error');
        }
        addMessageToChat(responseText, 'ai', new Date());

        const history = getChatHistory();
        history.push({
            id: generateId(),
            message,
            response: responseText,
            timestamp: now.toISOString()
        });
        saveChatHistory(history);
    } catch (error) {
        const errorText = `Error: ${error.message}`;
        showUiError(errorText);
        addMessageToChat(errorText, 'ai', new Date());
    } finally {
        loadingDiv.remove();
    }
}

function addMessageToChat(text, sender, timestamp = new Date()) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.innerHTML = `
        <div class="message-text">${escapeHtml(text)}</div>
        <div class="message-time">${time}</div>
    `;

    messageDiv.appendChild(bubble);
    chatMessages.appendChild(messageDiv);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ============================================
// QUICK QUESTIONS
// ============================================
function sendQuickQuestion(question) {
    if (!chatInput) return;
    chatInput.value = question;
    sendMessage();
}

// ============================================
// CHAT HISTORY
// ============================================
function loadChatHistory() {
    try {
        const history = getChatHistory();
        if (history.length > 0) {
            const welcomeMsg = chatMessages.querySelector('.welcome-message');
            if (welcomeMsg) {
                welcomeMsg.remove();
            }
        }

        history.forEach(chat => {
            addMessageToChat(chat.message, 'user', chat.timestamp);
            addMessageToChat(chat.response, 'ai', chat.timestamp);
        });

        if (history.length > 0) {
            chatMessages.scrollTop = 0;
        }
    } catch (error) {
        console.error('Error loading chat history:', error);
    }
}

// ============================================
// CLEAR HISTORY
// ============================================
// ============================================
// UTILITY FUNCTIONS
// ============================================
function escapeHtml(text) {
    const value = String(text ?? '');
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return value.replace(/[&<>"']/g, m => map[m]);
}

function initVoiceInput() {
    if (!voiceBtn) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        voiceBtn.disabled = true;
        voiceBtn.title = 'Voice input not supported in this browser';
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
        voiceBtn.classList.add('listening');
    };

    recognition.onend = () => {
        voiceBtn.classList.remove('listening');
    };

    recognition.onerror = (event) => {
        voiceBtn.classList.remove('listening');
        console.error('Voice input error:', event.error);
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
            chatInput.value = transcript;
            chatInput.focus();
        }
    };

    voiceBtn.addEventListener('click', () => {
        if (voiceBtn.classList.contains('listening')) {
            recognition.stop();
            return;
        }
        recognition.start();
    });
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    if (!getCurrentUser()) {
        return;
    }

    document.body.classList.add('app-loaded');

    bindChatEvents();

    // Load chat history when chat section is active
    const chatSection = document.getElementById('chatSection');
    if (chatSection && chatSection.classList.contains('active')) {
        loadChatHistory();
    }

    // Also load history when user navigates to chat
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        if (btn.dataset.section === 'chat') {
            btn.addEventListener('click', () => {
                const welcomeMsg = chatMessages.querySelector('.welcome-message');
                if (welcomeMsg && chatMessages.children.length === 1) {
                    loadChatHistory();
                }
            });
        }
    });

    initVoiceInput();
});

// Keep compatibility with inline handlers, if any.
window.sendMessage = sendMessage;
})();
