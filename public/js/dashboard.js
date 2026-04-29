// ============================================
// DASHBOARD SCRIPT (LOCAL STORAGE)
// ============================================

// DOM Elements
const navBtns = document.querySelectorAll('.nav-btn');
const contentSections = document.querySelectorAll('.content-section');
const logoutBtn = document.getElementById('logoutBtn');
const themeToggle = document.getElementById('themeToggle');
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const navIndicator = document.getElementById('navIndicator');
const toastContainer = document.getElementById('toastContainer');
const commandInput = document.getElementById('commandInput');
const commandBtn = document.getElementById('commandBtn');
const commandVoiceBtn = document.getElementById('commandVoiceBtn');
const userName = document.getElementById('userName');
const sectionTitle = document.getElementById('sectionTitle');
const sectionSubtitle = document.getElementById('sectionSubtitle');
const loadingSpinner = document.getElementById('loadingSpinner');
const liveClock = document.getElementById('liveClock');
const calendarEl = document.getElementById('fullCalendar');
const errorBanner = document.getElementById('errorBanner');
const notesCount = document.getElementById('notesCount');
const pendingTodosCount = document.getElementById('pendingTodosCount');
const scheduleCount = document.getElementById('scheduleCount');
const focusMinutesCount = document.getElementById('focusMinutesCount');
const flashcardsCount = document.getElementById('flashcardsCount');
const focusScoreCount = document.getElementById('focusScoreCount');
const focusScoreLevel = document.getElementById('focusScoreLevel');
const streakCount = document.getElementById('streakCount');
const badgesCount = document.getElementById('badgesCount');
const todaySnapshot = document.getElementById('todaySnapshot');
const upcomingStudyList = document.getElementById('upcomingStudyList');
const taskHealthList = document.getElementById('taskHealthList');
const weeklyActivityChart = document.getElementById('weeklyActivityChart');
const moodSelector = document.getElementById('moodSelector');
const moodRecommendation = document.getElementById('moodRecommendation');
const badgesList = document.getElementById('badgesList');
const quickActions = document.getElementById('quickActions');
const nextBestActions = document.getElementById('nextBestActions');
const studyLoadPanel = document.getElementById('studyLoadPanel');
const revisionQueuePanel = document.getElementById('revisionQueuePanel');
const aiNoteTopicInput = document.getElementById('aiNoteTopic');
const aiNoteToneSelect = document.getElementById('aiNoteTone');
const generateAiNotesBtn = document.getElementById('generateAiNotesBtn');
const aiNotesOutput = document.getElementById('aiNotesOutput');
const notesPdfInput = document.getElementById('notesPdfInput');
const notesPdfBtn = document.getElementById('notesPdfBtn');
const notesImageInput = document.getElementById('notesImageInput');
const notesOcrBtn = document.getElementById('notesOcrBtn');
const notesImportOutput = document.getElementById('notesImportOutput');
const focusChartCanvas = document.getElementById('focusChart');
const tasksChartCanvas = document.getElementById('tasksChart');
const flashChartCanvas = document.getElementById('flashChart');
const boardTaskInput = document.getElementById('boardTaskInput');
const addBoardTaskBtn = document.getElementById('addBoardTaskBtn');
const kanbanTodo = document.getElementById('kanbanTodo');
const kanbanProgress = document.getElementById('kanbanProgress');
const kanbanDone = document.getElementById('kanbanDone');
const accentPicker = document.getElementById('accentPicker');
const enableNotificationsBtn = document.getElementById('enableNotificationsBtn');
const scheduleReminderBtn = document.getElementById('scheduleReminderBtn');
const reminderTimeInput = document.getElementById('reminderTime');
const sharedNote = document.getElementById('sharedNote');
const collabMessages = document.getElementById('collabMessages');
const collabInput = document.getElementById('collabInput');
const collabSendBtn = document.getElementById('collabSendBtn');

const CURRENT_USER_KEY = 'user';
const SIDEBAR_STATE_KEY = 'sidebarCollapsed';
const THEME_KEY = 'dashboardTheme';
const ACCENT_COLOR_KEY = 'accentColor';
const BOARD_KEY = 'kanbanBoard';
const REMINDER_KEY = 'studyReminder';
const LAST_ACTIVE_KEY = 'lastActiveAt';

const DEFAULT_API_PORT = '3000';
const API_BASE_URL = window.location.protocol === 'file:' || ((window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') && window.location.port !== DEFAULT_API_PORT)
    ? `http://localhost:${DEFAULT_API_PORT}`
    : '';

let calendar = null;
let revealObserver = null;

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

function showToast(message, type = 'success') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 260);
    }, 2600);
}
window.showAppToast = showToast;

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

function storageKey(key) {
    const user = getCurrentUser();
    if (!user) return null;
    return `${key}:${user.id}`;
}

function getUserData(key, fallback) {
    const keyName = storageKey(key);
    if (!keyName) return fallback;
    try {
        const value = JSON.parse(localStorage.getItem(keyName));
        return value ?? fallback;
    } catch (error) {
        return fallback;
    }
}

function setUserData(key, value) {
    const keyName = storageKey(key);
    if (!keyName) return;
    localStorage.setItem(keyName, JSON.stringify(value));
}

function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

function setItemDelay(element, index) {
    if (!element) return;
    element.style.setProperty('--item-delay', `${Math.min(index * 55, 330)}ms`);
    element.classList.add('reveal-on-scroll');
    observeRevealElements(element);
}

function toDateKey(date) {
    const value = date instanceof Date ? date : new Date(date);
    const localDate = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 10);
}

function addDays(date, days) {
    const value = new Date(date);
    value.setDate(value.getDate() + days);
    return value;
}

function addMinutesToTime(time, minutes) {
    const [hour = 0, minute = 0] = String(time || '18:00').split(':').map(Number);
    const date = new Date();
    date.setHours(hour, minute + Number(minutes || 0), 0, 0);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function clampNumber(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(Math.max(number, min), max);
}

// ============================================
// THEME TOGGLE
// ============================================
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    updateThemeIcon();
});

function updateThemeIcon() {
    const isDark = document.body.classList.contains('dark-mode');
    themeToggle.textContent = isDark ? '☀️' : '🌙';
}

// Load theme preference
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
    updateThemeIcon();
    applyThemePreference();
    applyAccentColor();
}

function applyThemePreference() {
    const preset = localStorage.getItem(THEME_KEY) || 'default';
    document.body.dataset.theme = preset;
    document.querySelectorAll('.theme-pill').forEach(button => {
        button.classList.toggle('active', button.dataset.theme === preset);
    });
}

function applyAccentColor() {
    const accent = localStorage.getItem(ACCENT_COLOR_KEY) || '#6c63ff';
    document.documentElement.style.setProperty('--primary-color', accent);
    if (accentPicker) {
        accentPicker.value = accent;
    }
}

// ============================================
// LIVE CLOCK
// ============================================
function updateClock() {
    if (!liveClock) return;
    const now = new Date();
    liveClock.textContent = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function startClock() {
    updateClock();
    setInterval(updateClock, 1000);
}

// ============================================
// SECTION NAVIGATION
// ============================================
const sectionInfo = {
    overview: { title: 'Overview', subtitle: 'Track your study progress' },
    chat: { title: 'Chat', subtitle: 'Ask me anything academic' },
    notes: { title: 'Notes', subtitle: 'Create and manage your study notes' },
    todos: { title: 'To-Do List', subtitle: 'Organize your tasks' },
    schedule: { title: 'Study Planner', subtitle: 'Plan your study schedule' },
    flashcards: { title: 'Flashcards', subtitle: 'Build decks and quiz yourself' },
    focus: { title: 'Focus Timer', subtitle: 'Run focused study sessions' },
    analytics: { title: 'Analytics', subtitle: 'Measure progress and trends' },
    board: { title: 'Kanban Board', subtitle: 'Move tasks across stages' },
    personalize: { title: 'Personalize', subtitle: 'Customize themes and reminders' },
    collab: { title: 'Collaboration', subtitle: 'Study with teammates live' }
};

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const section = btn.dataset.section;
        const targetSection = document.getElementById(`${section}Section`);
        if (!targetSection) return;

        // Update active nav
        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update active section
        contentSections.forEach(s => s.classList.remove('active', 'section-enter'));
        targetSection.classList.add('active');
        requestAnimationFrame(() => {
            targetSection.classList.add('section-enter');
        });

        // Update header
        sectionTitle.textContent = sectionInfo[section].title;
        sectionSubtitle.textContent = sectionInfo[section].subtitle;

        updateNavIndicator(btn);

        if (section === 'overview') {
            updateOverview();
        } else if (section === 'flashcards') {
            loadFlashcards();
            renderQuizState();
            renderRevisionSummary();
        } else if (section === 'schedule') {
            renderPlannerPreview();
        } else if (section === 'focus') {
            loadFocusLog();
        } else if (section === 'analytics') {
            renderAnalyticsCharts();
        } else if (section === 'board') {
            renderKanbanBoard();
        } else if (section === 'collab') {
            initCollaboration();
        }
    });
});

function updateNavIndicator(activeButton) {
    if (!navIndicator || !activeButton) return;
    const buttonRect = activeButton.getBoundingClientRect();
    const parentRect = activeButton.parentElement.getBoundingClientRect();
    const offset = buttonRect.top - parentRect.top + (buttonRect.height - navIndicator.offsetHeight) / 2;
    navIndicator.style.transform = `translateY(${Math.max(offset, 0)}px)`;
}

if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
        if (!sidebar) return;
        sidebar.classList.toggle('collapsed');
        const isCollapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem(SIDEBAR_STATE_KEY, isCollapsed ? 'true' : 'false');
        const activeBtn = document.querySelector('.nav-btn.active');
        if (activeBtn) {
            updateNavIndicator(activeBtn);
        }
    });
}

function navigateToSection(section) {
    const target = Array.from(navBtns).find(btn => btn.dataset.section === section);
    if (target) {
        target.click();
    }
}

if (quickActions) {
    quickActions.addEventListener('click', (event) => {
        const button = event.target instanceof Element ? event.target.closest('.action-chip') : null;
        if (!button) return;
        handleDashboardAction(button.dataset.action);
    });
}

[
    nextBestActions,
    studyLoadPanel,
    revisionQueuePanel
].forEach(container => {
    if (!container) return;
    container.addEventListener('click', (event) => {
        const button = event.target instanceof Element ? event.target.closest('[data-action]') : null;
        if (!button) return;
        handleDashboardAction(button.dataset.action);
    });
});

function handleDashboardAction(action) {
    if (!action) return;

    if (action === 'plan') {
        navigateToSection('schedule');
        plannerSubjectInput?.focus();
    } else if (action === 'focus') {
        navigateToSection('focus');
        if (!focusTimerId) {
            startFocusTimer();
        }
    } else if (action === 'review') {
        navigateToSection('flashcards');
        startQuiz();
    } else if (action === 'task' || action === 'todos' || action === 'overdue') {
        navigateToSection('todos');
        todoInput?.focus();
    } else if (action === 'note') {
        navigateToSection('notes');
        addNoteBtn?.click();
    } else if (action === 'analytics') {
        navigateToSection('analytics');
    }
}

if (moodSelector) {
    moodSelector.addEventListener('click', (event) => {
        const button = event.target instanceof Element ? event.target.closest('.mood-btn') : null;
        if (!button) return;
        moodSelector.querySelectorAll('.mood-btn').forEach(item => item.classList.remove('active'));
        button.classList.add('active');
        setUserData('selectedMood', button.dataset.mood || 'focused');
        updateOverview();
    });
}

document.querySelectorAll('.theme-pill').forEach(button => {
    button.addEventListener('click', () => {
        const theme = button.dataset.theme || 'default';
        localStorage.setItem(THEME_KEY, theme);
        applyThemePreference();
    });
});

if (accentPicker) {
    accentPicker.addEventListener('input', () => {
        localStorage.setItem(ACCENT_COLOR_KEY, accentPicker.value);
        applyAccentColor();
    });
}

if (commandBtn) {
    commandBtn.addEventListener('click', () => runCommand());
}

if (commandInput) {
    commandInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            runCommand();
        }
    });
}

if (commandVoiceBtn) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        commandVoiceBtn.addEventListener('click', () => recognition.start());
        recognition.onresult = (event) => {
            const transcript = event.results[0]?.[0]?.transcript;
            if (transcript && commandInput) {
                commandInput.value = transcript;
                runCommand();
            }
        };
    } else {
        commandVoiceBtn.disabled = true;
        commandVoiceBtn.title = 'Voice input not supported';
    }
}

function runCommand() {
    if (!commandInput) return;
    const text = commandInput.value.trim();
    if (!text) return;
    commandInput.value = '';

    const lower = text.toLowerCase();
    if (lower.includes('add task')) {
        const parsedTask = parseTaskCommand(text);
        createTodo(parsedTask.task, parsedTask.dueDate);
        navigateToSection('todos');
        showToast(`Added task: ${parsedTask.task}`, 'success');
        return;
    }

    if (lower.includes('start timer') || lower.includes('start focus')) {
        navigateToSection('focus');
        if (!focusTimerId) startFocusTimer();
        showToast('Focus timer started.', 'success');
        return;
    }

    if (lower.includes('add note')) {
        navigateToSection('notes');
        addNoteBtn?.click();
        showToast('Ready to add a note.', 'success');
        return;
    }

    if (lower.includes('open')) {
        const section = lower.split('open')[1]?.trim();
        const map = {
            overview: 'overview',
            chat: 'chat',
            notes: 'notes',
            tasks: 'todos',
            todo: 'todos',
            planner: 'schedule',
            flashcards: 'flashcards',
            focus: 'focus',
            analytics: 'analytics',
            board: 'board',
            personalize: 'personalize',
            collab: 'collab'
        };
        const target = section ? map[section] : null;
        if (target) {
            navigateToSection(target);
            showToast(`Opened ${target}.`, 'success');
            return;
        }
    }

    showToast('Command not recognized. Try "add task" or "start focus".', 'error');
}

function parseTaskCommand(text) {
    let task = String(text || '').replace(/add task/i, '').trim() || 'New task';
    let dueDate = '';

    const dateMatch = task.match(/\b\d{4}-\d{2}-\d{2}\b/);
    if (dateMatch) {
        dueDate = dateMatch[0];
        task = task.replace(dateMatch[0], '').trim();
    } else if (/\btomorrow\b/i.test(task)) {
        dueDate = toDateKey(addDays(new Date(), 1));
        task = task.replace(/\btomorrow\b/i, '').trim();
    } else if (/\btoday\b/i.test(task)) {
        dueDate = getTodayDateKey();
        task = task.replace(/\btoday\b/i, '').trim();
    }

    task = task
        .replace(/\bat\s+\d{1,2}(:\d{2})?\s*(am|pm)?\b/i, '')
        .replace(/\s+/g, ' ')
        .trim();

    return {
        task: task || 'New task',
        dueDate
    };
}

// ============================================
// LOGOUT
// ============================================
logoutBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem(CURRENT_USER_KEY);
        localStorage.removeItem('session');
        window.location.href = '/';
    }
});

// ============================================
// LOAD USER INFO
// ============================================
function loadUserInfo() {
    const user = getCurrentUser();
    if (user) {
        userName.textContent = user.name;
    }
}

// ============================================
// LOADING SPINNER
// ============================================
function showSpinner() {
    loadingSpinner.classList.remove('hidden');
}

function hideSpinner() {
    loadingSpinner.classList.add('hidden');
}

// ============================================
// NOTES FUNCTIONS
// ============================================
const addNoteBtn = document.getElementById('addNoteBtn');
const noteModal = document.getElementById('noteModal');
const closeNoteModalBtn = noteModal.querySelector('.close-modal');
const saveNoteBtn = document.getElementById('saveNoteBtn');
const notesContainer = document.getElementById('notesContainer');
const noteTitle = document.getElementById('noteTitle');
const noteContent = document.getElementById('noteContent');

let currentNoteId = null;

if (generateAiNotesBtn) {
    generateAiNotesBtn.addEventListener('click', generateAiNotes);
}

if (notesPdfBtn) {
    notesPdfBtn.addEventListener('click', summarizeNotesPdf);
}

if (notesOcrBtn) {
    notesOcrBtn.addEventListener('click', extractNotesOcr);
}

addNoteBtn.addEventListener('click', () => {
    currentNoteId = null;
    noteTitle.value = '';
    noteContent.value = '';
    document.getElementById('noteModalTitle').textContent = 'Add Note';
    openModal(noteModal);
});

closeNoteModalBtn.addEventListener('click', () => {
    closeModalWithAnimation(noteModal);
});

saveNoteBtn.addEventListener('click', () => {
    const title = noteTitle.value.trim();
    const content = noteContent.value.trim();

    if (!title || !content) {
        alert('Please fill in all fields');
        return;
    }

    try {
        showSpinner();
        const notes = getUserData('notes', []);
        const now = new Date().toISOString();

        if (currentNoteId) {
            const noteIndex = notes.findIndex(note => note.id === currentNoteId);
            if (noteIndex !== -1) {
                notes[noteIndex] = {
                    ...notes[noteIndex],
                    title,
                    content,
                    updated_at: now
                };
            }
        } else {
            notes.push({
                id: generateId(),
                title,
                content,
                created_at: now,
                updated_at: now
            });
        }

        setUserData('notes', notes);
        closeModalWithAnimation(noteModal);
        loadNotes();
        updateOverview();
    } finally {
        hideSpinner();
    }
});

function loadNotes() {
    const notes = getUserData('notes', []);
    displayNotes(notes);
}

async function generateAiNotes() {
    const topic = aiNoteTopicInput ? aiNoteTopicInput.value.trim() : '';
    const tone = aiNoteToneSelect ? aiNoteToneSelect.value : 'summary';
    if (!topic) {
        showToast('Enter a topic to generate notes.', 'error');
        return;
    }

    if (aiNotesOutput) {
        aiNotesOutput.textContent = 'Generating notes...';
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/notes/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic, tone })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to generate notes');
        }
        if (aiNotesOutput) {
            aiNotesOutput.textContent = data.notes || 'No notes returned.';
        }
        showToast('Notes generated. Save them if useful.', 'success');
    } catch (error) {
        const fallback = generateLocalNotes(topic, tone);
        if (aiNotesOutput) {
            aiNotesOutput.textContent = fallback;
        }
        showToast(`Using local notes: ${error.message}`, 'error');
    }
}

function generateLocalNotes(topic, tone) {
    const base = `Topic: ${topic}`;
    if (tone === 'exam') {
        return [
            base,
            'Key points:',
            '- Define core terms and formulas.',
            '- Note common pitfalls and exam traps.',
            '- Practice with 3 sample questions.',
            'Quick questions:',
            `1) Explain ${topic} in 3 steps.`,
            `2) List two real-world examples of ${topic}.`
        ].join('\n');
    }
    if (tone === 'flash') {
        return [
            base,
            'Flashcard prompts:',
            `- What is ${topic}?`,
            `- Why does ${topic} matter?`,
            `- Give an example of ${topic}.`,
            'Summary:',
            `Write a 2-sentence summary of ${topic}.`
        ].join('\n');
    }
    return [
        base,
        'Summary:',
        `- ${topic} overview in 4-6 bullets.`,
        '- Key definitions and formulas.',
        '- One example or use case.',
        'Questions:',
        `1) What is the main idea behind ${topic}?`,
        `2) How would you teach ${topic} to a friend?`
    ].join('\n');
}

async function summarizeNotesPdf() {
    if (!notesPdfInput || !notesImportOutput) return;
    const file = notesPdfInput.files?.[0];
    if (!file) {
        showToast('Select a PDF file.', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('pdf', file);
    notesImportOutput.textContent = 'Summarizing PDF...';
    try {
        const response = await fetch(`${API_BASE_URL}/upload-pdf`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to summarize PDF');
        }
        notesImportOutput.textContent = data.summary || 'No content found.';
    } catch (error) {
        notesImportOutput.textContent = `Error: ${error.message}`;
        showToast(error.message, 'error');
    }
}

async function extractNotesOcr() {
    if (!notesImageInput || !notesImportOutput) return;
    const file = notesImageInput.files?.[0];
    if (!file) {
        showToast('Select an image for OCR.', 'error');
        return;
    }

    if (!window.Tesseract) {
        showToast('OCR library not loaded. Refresh the page.', 'error');
        return;
    }

    notesImportOutput.textContent = 'Running OCR...';
    try {
        const result = await window.Tesseract.recognize(file, 'eng');
        notesImportOutput.textContent = result?.data?.text?.trim() || 'No text detected.';
    } catch (error) {
        notesImportOutput.textContent = `Error: ${error.message}`;
        showToast(error.message, 'error');
    }
}

function displayNotes(notes) {
    notesContainer.innerHTML = '';

    if (notes.length === 0) {
        notesContainer.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary);">No notes yet. Create your first note!</p>';
        return;
    }

    notes.forEach((note, index) => {
        const noteCard = document.createElement('div');
        noteCard.className = 'note-card';
        setItemDelay(noteCard, index);

        const date = note.updated_at ? new Date(note.updated_at).toLocaleDateString() : '';

        noteCard.innerHTML = `
            <h3>${escapeHtml(note.title)}</h3>
            <p>${escapeHtml(note.content)}</p>
            <div class="note-card-footer">
                <span>${date}</span>
                <div class="note-actions">
                    <button class="edit" onclick="editNote(${note.id})">✏️</button>
                    <button class="delete" onclick="deleteNote(${note.id})">🗑️</button>
                </div>
            </div>
        `;

        notesContainer.appendChild(noteCard);
    });
}

function editNote(id) {
    const notes = getUserData('notes', []);
    const note = notes.find(n => n.id === id);
    if (note) {
        currentNoteId = id;
        noteTitle.value = note.title;
        noteContent.value = note.content;
        document.getElementById('noteModalTitle').textContent = 'Edit Note';
        openModal(noteModal);
    }
}

function deleteNote(id) {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
        showSpinner();
        const notes = getUserData('notes', []);
        const updatedNotes = notes.filter(note => note.id !== id);
        setUserData('notes', updatedNotes);
        loadNotes();
        updateOverview();
    } finally {
        hideSpinner();
    }
}

// ============================================
// TODO FUNCTIONS
// ============================================
const todoInput = document.getElementById('todoInput');
const todoDueDate = document.getElementById('todoDueDate');
const addTodoBtn = document.getElementById('addTodoBtn');
const todosList = document.getElementById('todosList');

addTodoBtn.addEventListener('click', () => {
    const task = todoInput.value.trim();
    if (!task) {
        alert('Please enter a task');
        return;
    }

    createTodo(task, todoDueDate ? todoDueDate.value : '');
    todoInput.value = '';
    if (todoDueDate) {
        todoDueDate.value = '';
    }
});

todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTodoBtn.click();
    }
});

function createTodo(task, dueDate = '') {
    try {
        showSpinner();
        const todos = getUserData('todos', []);
        todos.push({
            id: generateId(),
            task,
            status: 'pending',
            due_date: dueDate || null,
            created_at: new Date().toISOString()
        });
        setUserData('todos', todos);
        loadTodos();
        updateOverview();
    } finally {
        hideSpinner();
    }
}

function loadTodos() {
    const todos = getUserData('todos', []);
    displayTodos(todos);
}

function displayTodos(todos) {
    todosList.innerHTML = '';

    if (todos.length === 0) {
        todosList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No tasks yet. Create your first task!</p>';
        return;
    }

    todos.forEach((todo, index) => {
        const todoItem = document.createElement('div');
        todoItem.className = `todo-item ${todo.status === 'completed' ? 'completed' : ''}`;
        setItemDelay(todoItem, index);

        const dueDate = todo.due_date ? new Date(todo.due_date).toLocaleDateString() : '';

        todoItem.innerHTML = `
            <input type="checkbox" class="todo-checkbox" ${todo.status === 'completed' ? 'checked' : ''} onchange="updateTodoStatus(${todo.id}, this.checked)">
            <div class="todo-text">${escapeHtml(todo.task)}</div>
            ${dueDate ? `<div class="todo-due">${dueDate}</div>` : ''}
            <button class="todo-delete" onclick="deleteTodo(${todo.id})">🗑️</button>
        `;

        todosList.appendChild(todoItem);
    });
}

function updateTodoStatus(id, completed) {
    const todos = getUserData('todos', []);
    const todoIndex = todos.findIndex(todo => todo.id === id);
    if (todoIndex !== -1) {
        todos[todoIndex].status = completed ? 'completed' : 'pending';
        todos[todoIndex].completed_at = completed ? new Date().toISOString() : null;
        setUserData('todos', todos);
        loadTodos();
        updateOverview();
    }
}

function deleteTodo(id) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
        showSpinner();
        const todos = getUserData('todos', []);
        const updatedTodos = todos.filter(todo => todo.id !== id);
        setUserData('todos', updatedTodos);
        loadTodos();
        updateOverview();
    } finally {
        hideSpinner();
    }
}

// ============================================
// KANBAN BOARD
// ============================================
if (addBoardTaskBtn) {
    addBoardTaskBtn.addEventListener('click', () => {
        const text = boardTaskInput ? boardTaskInput.value.trim() : '';
        if (!text) {
            showToast('Add a task for the board.', 'error');
            return;
        }
        const board = getBoardState();
        board.push({ id: generateId(), text, status: 'todo', created_at: new Date().toISOString() });
        saveBoardState(board);
        if (boardTaskInput) boardTaskInput.value = '';
        renderKanbanBoard();
    });
}

if (boardTaskInput) {
    boardTaskInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            addBoardTaskBtn?.click();
        }
    });
}

function getBoardState() {
    return getUserData(BOARD_KEY, []);
}

function saveBoardState(state, broadcast = true) {
    setUserData(BOARD_KEY, state);
    if (socket && broadcast) {
        socket.emit('boardState', { room: 'studybuddy', state });
    }
}

function renderKanbanBoard() {
    if (!kanbanTodo || !kanbanProgress || !kanbanDone) return;
    const board = getBoardState();
    const columns = {
        todo: kanbanTodo,
        progress: kanbanProgress,
        done: kanbanDone
    };
    Object.values(columns).forEach(list => list.innerHTML = '');

    board.forEach(card => {
        const item = document.createElement('div');
        item.className = 'kanban-card';
        item.draggable = true;
        item.dataset.id = String(card.id);
        item.innerHTML = `
            <span>${escapeHtml(card.text)}</span>
            <button title="Remove">✕</button>
        `;
        item.querySelector('button')?.addEventListener('click', () => {
            const updated = getBoardState().filter(entry => entry.id !== card.id);
            saveBoardState(updated);
            renderKanbanBoard();
        });

        item.addEventListener('dragstart', (event) => {
            event.dataTransfer.setData('text/plain', String(card.id));
        });

        columns[card.status]?.appendChild(item);
    });

    Object.entries(columns).forEach(([status, list]) => {
        list.ondragover = (event) => {
            event.preventDefault();
            list.classList.add('drag-over');
        };
        list.ondragleave = () => {
            list.classList.remove('drag-over');
        };
        list.ondrop = (event) => {
            event.preventDefault();
            list.classList.remove('drag-over');
            const cardId = Number(event.dataTransfer.getData('text/plain'));
            const boardState = getBoardState();
            const target = boardState.find(entry => entry.id === cardId);
            if (target) {
                target.status = status;
                saveBoardState(boardState);
                renderKanbanBoard();
            }
        };
    });
}

// ============================================
// CALENDAR
// ============================================
function buildCalendarEvents(schedule) {
    return schedule.map(item => ({
        id: String(item.id),
        title: item.subject,
        start: `${item.study_date}T${item.start_time}`,
        end: `${item.study_date}T${item.end_time}`,
        extendedProps: { notes: item.notes || '' }
    }));
}

function initCalendar() {
    if (!calendarEl || !window.FullCalendar) return;
    try {
        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            height: 'auto',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            dateClick: (info) => {
                selectedScheduleDate = info.dateStr;
                scheduleFilterDate.value = info.dateStr;
                loadSchedule();
            }
        });
        calendar.render();
    } catch (error) {
        console.error('Calendar failed to initialize:', error);
        showUiError('Calendar failed to load. Please refresh the page.');
    }
}

function refreshCalendarEvents(schedule) {
    if (!calendar) return;
    calendar.removeAllEvents();
    buildCalendarEvents(schedule).forEach(event => calendar.addEvent(event));
}

// ============================================
// SCHEDULE FUNCTIONS
// ============================================
const addScheduleBtn = document.getElementById('addScheduleBtn');
const scheduleModal = document.getElementById('scheduleModal');
const closeScheduleModalBtn = scheduleModal.querySelector('.close-modal');
const saveScheduleBtn = document.getElementById('saveScheduleBtn');
const scheduleContainer = document.getElementById('scheduleContainer');
const scheduleFilterDate = document.getElementById('scheduleFilterDate');
const clearScheduleFilterBtn = document.getElementById('clearScheduleFilter');
const scheduleSubjectInput = document.getElementById('scheduleSubject');
const scheduleDateInput = document.getElementById('scheduleDate');
const scheduleStartTimeInput = document.getElementById('scheduleStartTime');
const scheduleEndTimeInput = document.getElementById('scheduleEndTime');
const scheduleNotesInput = document.getElementById('scheduleNotes');
const plannerSubjectInput = document.getElementById('plannerSubject');
const plannerTopicsInput = document.getElementById('plannerTopics');
const plannerDeadlineInput = document.getElementById('plannerDeadline');
const plannerDailyMinutesInput = document.getElementById('plannerDailyMinutes');
const plannerStartTimeInput = document.getElementById('plannerStartTime');
const generatePlanBtn = document.getElementById('generatePlanBtn');
const plannerPreview = document.getElementById('plannerPreview');

let selectedScheduleDate = '';

addScheduleBtn.addEventListener('click', () => {
    scheduleSubjectInput.value = '';
    scheduleDateInput.value = selectedScheduleDate || '';
    scheduleStartTimeInput.value = '';
    scheduleEndTimeInput.value = '';
    scheduleNotesInput.value = '';
    openModal(scheduleModal);
});

closeScheduleModalBtn.addEventListener('click', () => {
    closeModalWithAnimation(scheduleModal);
});

saveScheduleBtn.addEventListener('click', () => {
    const subject = scheduleSubjectInput.value.trim();
    const studyDate = scheduleDateInput.value;
    const startTime = scheduleStartTimeInput.value;
    const endTime = scheduleEndTimeInput.value;
    const notes = scheduleNotesInput.value.trim();

    if (!subject || !studyDate || !startTime || !endTime) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        showSpinner();
        const schedule = getUserData('schedule', []);
        schedule.push({
            id: generateId(),
            subject,
            study_date: studyDate,
            start_time: startTime,
            end_time: endTime,
            notes: notes || ''
        });
        setUserData('schedule', schedule);
        closeModalWithAnimation(scheduleModal);
        loadSchedule();
        updateOverview();
    } finally {
        hideSpinner();
    }
});

scheduleFilterDate.addEventListener('change', () => {
    selectedScheduleDate = scheduleFilterDate.value;
    if (calendar && selectedScheduleDate) {
        calendar.gotoDate(selectedScheduleDate);
    }
    loadSchedule();
});

clearScheduleFilterBtn.addEventListener('click', () => {
    scheduleFilterDate.value = '';
    selectedScheduleDate = '';
    loadSchedule();
});

if (generatePlanBtn) {
    generatePlanBtn.addEventListener('click', generateStudyPlan);
}

function loadSchedule() {
    const schedule = getUserData('schedule', []);
    refreshCalendarEvents(schedule);
    const filteredSchedule = selectedScheduleDate
        ? schedule.filter(item => item.study_date === selectedScheduleDate)
        : schedule;
    displaySchedule(filteredSchedule);
}

function displaySchedule(schedule) {
    scheduleContainer.innerHTML = '';

    if (schedule.length === 0) {
        const message = selectedScheduleDate
            ? 'No study sessions on this date.'
            : 'No study sessions planned yet. Create your first schedule!';
        scheduleContainer.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary);">${message}</p>`;
        return;
    }

    schedule.forEach((item, index) => {
        const date = new Date(item.study_date).toLocaleDateString();
        const scheduleCard = document.createElement('div');
        scheduleCard.className = 'schedule-card';
        setItemDelay(scheduleCard, index);

        scheduleCard.innerHTML = `
            <div class="schedule-subject">${escapeHtml(item.subject)}</div>
            <div class="schedule-detail">📅 ${date}</div>
            <div class="schedule-detail">⏰ ${item.start_time.substring(0, 5)} - ${item.end_time.substring(0, 5)}</div>
            ${item.notes ? `<div class="schedule-detail">📝 ${escapeHtml(item.notes)}</div>` : ''}
            <button class="schedule-delete" onclick="deleteSchedule(${item.id})">Delete</button>
        `;

        scheduleContainer.appendChild(scheduleCard);
    });
}

function deleteSchedule(id) {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
        showSpinner();
        const schedule = getUserData('schedule', []);
        const updatedSchedule = schedule.filter(item => item.id !== id);
        setUserData('schedule', updatedSchedule);
        loadSchedule();
        updateOverview();
    } finally {
        hideSpinner();
    }
}

function generateStudyPlan() {
    const subject = plannerSubjectInput.value.trim();
    const topics = parsePlannerTopics(plannerTopicsInput.value);
    const deadline = plannerDeadlineInput.value;
    const dailyMinutes = clampNumber(plannerDailyMinutesInput.value, 20, 240, 60);
    const startTime = plannerStartTimeInput.value || '18:00';

    if (!subject || topics.length === 0 || !deadline) {
        alert('Add a subject, at least one topic, and a deadline.');
        return;
    }

    const today = new Date(`${getTodayDateKey()}T00:00`);
    const deadlineDate = new Date(`${deadline}T00:00`);
    if (deadlineDate < today) {
        alert('Choose today or a future deadline.');
        return;
    }

    const schedule = getUserData('schedule', []);
    const todos = getUserData('todos', []);
    const availableDays = Math.max(1, Math.floor((deadlineDate - today) / 86400000) + 1);
    const missedTopics = getMissedPlannerTopics(subject, schedule, todos);
    const planningTopics = uniquePlannerTopics([...missedTopics, ...topics]);
    const planItems = buildStudyPlanItems(subject, planningTopics, availableDays, dailyMinutes, startTime, missedTopics.length);

    planItems.forEach((item, index) => {
        schedule.push({
            id: generateId() + index,
            subject: item.subject,
            study_date: item.date,
            start_time: item.startTime,
            end_time: item.endTime,
            notes: item.notes
        });

        todos.push({
            id: generateId() + index + 5000,
            task: `Review ${item.topic} for ${subject}`,
            status: 'pending',
            due_date: item.date,
            created_at: new Date().toISOString()
        });
    });

    setUserData('schedule', schedule);
    setUserData('todos', todos);
    setUserData('lastGeneratedPlan', {
        subject,
        topics,
        deadline,
        generated_at: new Date().toISOString(),
        item_count: planItems.length,
        catch_up_count: missedTopics.length
    });

    loadSchedule();
    loadTodos();
    updateOverview();
    renderPlannerPreview(planItems);
    showToast(`Generated ${planItems.length} study session(s).`, 'success');
}

function parsePlannerTopics(value) {
    return String(value || '')
        .split(/[\n,]+/)
        .map(topic => topic.trim())
        .filter(Boolean);
}

function uniquePlannerTopics(topics) {
    const seen = new Set();
    return topics.filter(topic => {
        const key = String(topic || '').trim().toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function getMissedPlannerTopics(subject, schedule, todos) {
    const today = getTodayDateKey();
    const subjectKey = subject.toLowerCase();
    const missed = new Set();

    schedule.forEach(item => {
        const notes = String(item.notes || '');
        const subjectMatches = String(item.subject || '').toLowerCase().includes(subjectKey);
        const wasGenerated = notes.toLowerCase().includes('generated by smart planner');
        if (item.study_date >= today || !subjectMatches || !wasGenerated) return;

        const topicMatch = notes.match(/:\s*([^.]*)/);
        if (topicMatch?.[1]) {
            missed.add(`Catch up: ${topicMatch[1].trim()}`);
        }
    });

    todos.forEach(todo => {
        const task = String(todo.task || '');
        if (todo.status === 'completed' || !todo.due_date || todo.due_date >= today) return;
        if (!task.toLowerCase().includes(subjectKey)) return;

        const topicMatch = task.match(/^Review\s+(.+?)\s+for\s+/i);
        missed.add(`Catch up: ${(topicMatch?.[1] || task).trim()}`);
    });

    return Array.from(missed).slice(0, 4);
}

function buildStudyPlanItems(subject, topics, availableDays, dailyMinutes, startTime, catchUpCount = 0) {
    const today = new Date(`${getTodayDateKey()}T00:00`);
    const sessionCount = Math.max(topics.length, availableDays);
    const minutesPerTopic = Math.max(25, Math.floor(dailyMinutes / Math.ceil(topics.length / availableDays || 1)));

    return Array.from({ length: sessionCount }).map((_, index) => {
        const topic = topics[index % topics.length];
        const date = toDateKey(addDays(today, Math.min(index, availableDays - 1)));
        const blockOffset = Math.floor(index / availableDays) * (minutesPerTopic + 10);
        const blockStart = addMinutesToTime(startTime, blockOffset);
        const blockEnd = addMinutesToTime(blockStart, minutesPerTopic);
        const isCatchUp = index < catchUpCount;
        const isRevision = index >= topics.length;
        const mode = isCatchUp ? 'Catch-up' : isRevision ? 'Revision' : 'Deep work';

        return {
            subject: isCatchUp ? `${subject} Catch-up` : isRevision ? `${subject} Revision` : subject,
            topic,
            date,
            startTime: blockStart,
            endTime: blockEnd,
            notes: `${mode}: ${topic}. Generated by Smart Planner.`
        };
    });
}

function renderPlannerPreview(planItems = null) {
    if (!plannerPreview) return;
    const plan = planItems || [];
    const lastPlan = getUserData('lastGeneratedPlan', null);

    if (plan.length === 0 && !lastPlan) {
        plannerPreview.innerHTML = '<p class="empty-state">Generate a plan to see the next study blocks here.</p>';
        return;
    }

    if (plan.length === 0 && lastPlan) {
        plannerPreview.innerHTML = `
            <div class="planner-preview-card">
                <strong>${escapeHtml(lastPlan.subject)}</strong>
                <span>${lastPlan.item_count} sessions generated for ${escapeHtml(lastPlan.deadline)}</span>
                ${lastPlan.catch_up_count ? `<span>${lastPlan.catch_up_count} catch-up topic(s) included</span>` : ''}
            </div>
        `;
        return;
    }

    plannerPreview.innerHTML = plan.slice(0, 6).map((item, index) => `
        <div class="planner-preview-card">
            <strong>${escapeHtml(item.topic)}</strong>
            <span>${escapeHtml(item.date)} ${escapeHtml(item.startTime)}-${escapeHtml(item.endTime)}</span>
        </div>
    `).join('');
    plannerPreview.querySelectorAll('.planner-preview-card').forEach((item, index) => setItemDelay(item, index));
}

// ============================================
// OVERVIEW FUNCTIONS
// ============================================
function updateOverview() {
    const notes = getUserData('notes', []);
    const todos = getUserData('todos', []);
    const schedule = getUserData('schedule', []);
    const flashcards = getUserData('flashcards', []);
    const focusSessions = getUserData('focusSessions', []);
    const focusScore = calculateFocusScore(todos, focusSessions, flashcards);
    const streak = calculateDailyStreak(todos, focusSessions, flashcards);
    const badges = getEarnedBadges(todos, focusSessions, flashcards, notes, schedule, streak);

    setStatText(notesCount, notes.length);
    setStatText(pendingTodosCount, todos.filter(todo => todo.status !== 'completed').length);
    setStatText(scheduleCount, schedule.length);
    setStatText(flashcardsCount, flashcards.length);
    setStatText(focusMinutesCount, focusSessions.reduce((total, session) => total + Number(session.minutes || 0), 0));
    setStatText(focusScoreCount, focusScore);
    if (focusScoreLevel) {
        focusScoreLevel.textContent = getFocusScoreLevel(focusScore);
    }
    setStatText(streakCount, streak);
    setStatText(badgesCount, badges.filter(badge => badge.earned).length);

    renderTodaySnapshot(todos, schedule, focusSessions, flashcards);
    renderUpcomingStudy(schedule);
    renderTaskHealth(todos);
    renderWeeklyActivity(todos, focusSessions, flashcards);
    renderMoodRecommendation(todos, schedule, focusSessions, flashcards);
    renderBadges(badges);
    renderNextBestActions(todos, schedule, focusSessions, flashcards);
    renderStudyLoadPanel(schedule, todos);
    renderRevisionQueuePanel(flashcards);

    if (document.getElementById('analyticsSection')?.classList.contains('active')) {
        renderAnalyticsCharts();
    }
}

function setStatText(element, value) {
    if (element) {
        element.textContent = String(value);
        const card = element.closest('.stat-card');
        if (card) {
            card.classList.remove('stat-bump');
            void card.offsetWidth;
            card.classList.add('stat-bump');
        }
    }
}

function getTodayDateKey() {
    return toDateKey(new Date());
}

function renderTodaySnapshot(todos, schedule, focusSessions, flashcards) {
    const today = getTodayDateKey();
    const dueToday = todos.filter(todo => todo.status !== 'completed' && todo.due_date === today).length;
    const sessionsToday = schedule.filter(item => item.study_date === today).length;
    const focusToday = focusSessions
        .filter(session => String(session.completed_at || '').slice(0, 10) === today)
        .reduce((total, session) => total + Number(session.minutes || 0), 0);
    const reviewedToday = flashcards.filter(card => String(card.last_reviewed || '').slice(0, 10) === today).length;

    renderSnapshotList(todaySnapshot, [
        { label: 'Study sessions today', value: sessionsToday },
        { label: 'Tasks due today', value: dueToday },
        { label: 'Focus minutes today', value: focusToday },
        { label: 'Cards reviewed today', value: reviewedToday }
    ]);
}

function renderUpcomingStudy(schedule) {
    if (!upcomingStudyList) return;

    const now = new Date();
    const upcoming = schedule
        .filter(item => getScheduleDateTime(item) >= now)
        .sort((a, b) => getScheduleDateTime(a) - getScheduleDateTime(b))
        .slice(0, 5);

    if (upcoming.length === 0) {
        upcomingStudyList.innerHTML = '<p class="empty-state">No upcoming sessions planned.</p>';
        return;
    }

    upcomingStudyList.innerHTML = upcoming.map(item => `
        <div class="snapshot-item">
            <span>${escapeHtml(item.subject)}</span>
            <strong>${escapeHtml(formatScheduleDateTime(item))}</strong>
        </div>
    `).join('');
    upcomingStudyList.querySelectorAll('.snapshot-item').forEach((item, index) => setItemDelay(item, index));
}

function renderTaskHealth(todos) {
    const today = getTodayDateKey();
    const pending = todos.filter(todo => todo.status !== 'completed');
    const overdue = pending.filter(todo => todo.due_date && todo.due_date < today).length;
    const dueToday = pending.filter(todo => todo.due_date === today).length;
    const completed = todos.filter(todo => todo.status === 'completed').length;

    renderSnapshotList(taskHealthList, [
        { label: 'Overdue', value: overdue },
        { label: 'Due today', value: dueToday },
        { label: 'Completed', value: completed },
        { label: 'No due date', value: pending.filter(todo => !todo.due_date).length }
    ]);
}

function renderNextBestActions(todos, schedule, focusSessions, flashcards) {
    if (!nextBestActions) return;

    const today = getTodayDateKey();
    const overdueTodos = todos.filter(todo => todo.status !== 'completed' && todo.due_date && todo.due_date < today);
    const dueCards = getDueFlashcards(flashcards);
    const focusToday = focusSessions
        .filter(session => String(session.completed_at || '').slice(0, 10) === today)
        .reduce((total, session) => total + Number(session.minutes || 0), 0);
    const nextSession = schedule
        .filter(item => getScheduleDateTime(item) >= new Date())
        .sort((a, b) => getScheduleDateTime(a) - getScheduleDateTime(b))[0];

    const actions = [];
    if (overdueTodos.length) {
        actions.push({
            priority: 'high',
            title: `${overdueTodos.length} overdue task(s)`,
            detail: 'Clear or reschedule them before adding more load.',
            action: 'overdue',
            label: 'Open tasks'
        });
    }
    if (dueCards.length) {
        actions.push({
            priority: 'high',
            title: `${dueCards.length} flashcard(s) due`,
            detail: 'A short review now protects long-term recall.',
            action: 'review',
            label: 'Review'
        });
    }
    if (focusToday < 25) {
        actions.push({
            priority: 'medium',
            title: 'No solid focus block yet',
            detail: `${Math.max(25 - focusToday, 0)} more minute(s) reaches the baseline.`,
            action: 'focus',
            label: 'Start'
        });
    }
    if (!nextSession) {
        actions.push({
            priority: 'medium',
            title: 'Planner is empty',
            detail: 'Generate a schedule from subjects, topics, and a deadline.',
            action: 'plan',
            label: 'Plan'
        });
    } else {
        actions.push({
            priority: 'low',
            title: `Next: ${nextSession.subject}`,
            detail: formatScheduleDateTime(nextSession),
            action: 'plan',
            label: 'View'
        });
    }

    nextBestActions.innerHTML = actions.slice(0, 4).map(item => `
        <div class="intelligence-item priority-${item.priority}">
            <div>
                <strong>${escapeHtml(item.title)}</strong>
                <span>${escapeHtml(item.detail)}</span>
            </div>
            <button class="mini-action" data-action="${escapeHtml(item.action)}">${escapeHtml(item.label)}</button>
        </div>
    `).join('');
    nextBestActions.querySelectorAll('.intelligence-item').forEach((item, index) => setItemDelay(item, index));
}

function renderStudyLoadPanel(schedule, todos) {
    if (!studyLoadPanel) return;

    const days = Array.from({ length: 7 }).map((_, index) => {
        const date = addDays(new Date(`${getTodayDateKey()}T00:00`), index);
        const key = toDateKey(date);
        const minutes = schedule
            .filter(item => item.study_date === key)
            .reduce((total, item) => total + getScheduleDurationMinutes(item), 0);
        const dueTasks = todos.filter(todo => todo.status !== 'completed' && todo.due_date === key).length;
        return {
            key,
            label: index === 0 ? 'Today' : date.toLocaleDateString([], { weekday: 'short' }),
            minutes,
            dueTasks
        };
    });
    const totalMinutes = days.reduce((total, day) => total + day.minutes, 0);
    const maxMinutes = Math.max(...days.map(day => day.minutes), 60);
    const heavyDays = days.filter(day => day.minutes > 120 || day.dueTasks > 4).length;

    studyLoadPanel.innerHTML = `
        <div class="load-summary">
            <strong>${Math.round(totalMinutes / 60)}h planned</strong>
            <span>${heavyDays ? `${heavyDays} heavy day(s) ahead` : 'Balanced for the week'}</span>
        </div>
        <div class="load-bars">
            ${days.map(day => `
                <div class="load-day" title="${escapeHtml(`${day.minutes} min, ${day.dueTasks} task(s)`)}">
                    <div class="load-track">
                        <div class="load-fill" style="height: ${Math.max((day.minutes / maxMinutes) * 100, day.minutes ? 12 : 4)}%"></div>
                    </div>
                    <span>${escapeHtml(day.label)}</span>
                </div>
            `).join('')}
        </div>
        <button class="mini-action wide" data-action="analytics">Open analytics</button>
    `;
    studyLoadPanel.querySelectorAll('.load-day').forEach((item, index) => setItemDelay(item, index));
}

function renderRevisionQueuePanel(flashcards) {
    if (!revisionQueuePanel) return;

    const dueNow = getDueFlashcards(flashcards);
    const dueSoon = getDueSoonFlashcards(flashcards);
    const newCards = flashcards.filter(card => Number(card.review_count || 0) === 0);
    const stableCards = flashcards.filter(card => Number(card.streak || 0) >= 3 || Number(card.interval_days || 0) >= 7);

    revisionQueuePanel.innerHTML = `
        <div class="queue-stats">
            <div><strong>${dueNow.length}</strong><span>Due now</span></div>
            <div><strong>${dueSoon.length}</strong><span>Due soon</span></div>
            <div><strong>${newCards.length}</strong><span>New</span></div>
            <div><strong>${stableCards.length}</strong><span>Stable</span></div>
        </div>
        <button class="mini-action wide" data-action="review" ${flashcards.length ? '' : 'disabled'}>Start revision</button>
    `;
}

function calculateFocusScore(todos, focusSessions, flashcards) {
    const today = getTodayDateKey();
    const focusToday = focusSessions
        .filter(session => String(session.completed_at || '').slice(0, 10) === today)
        .reduce((total, session) => total + Number(session.minutes || 0), 0);
    const pendingToday = todos.filter(todo => todo.due_date === today);
    const completedToday = pendingToday.filter(todo => todo.status === 'completed').length;
    const dueCards = getDueFlashcards(flashcards);
    const reviewedToday = flashcards.filter(card => String(card.last_reviewed || '').slice(0, 10) === today).length;

    const focusPart = Math.min(focusToday / 90, 1) * 45;
    const taskPart = pendingToday.length ? (completedToday / pendingToday.length) * 30 : 18;
    const revisionPart = dueCards.length ? Math.min(reviewedToday / dueCards.length, 1) * 25 : 18;
    return Math.round(Math.min(focusPart + taskPart + revisionPart, 100));
}

function getFocusScoreLevel(score) {
    if (score >= 85) return 'Elite';
    if (score >= 65) return 'Strong';
    if (score >= 40) return 'Building';
    return 'Starter';
}

function calculateDailyStreak(todos, focusSessions, flashcards) {
    const activeDays = new Set();
    focusSessions.forEach(session => activeDays.add(String(session.completed_at || '').slice(0, 10)));
    flashcards.forEach(card => {
        if (card.last_reviewed) activeDays.add(String(card.last_reviewed).slice(0, 10));
    });
    todos.forEach(todo => {
        if (todo.completed_at) activeDays.add(String(todo.completed_at).slice(0, 10));
    });

    let streak = 0;
    let cursor = new Date(`${getTodayDateKey()}T00:00`);
    while (activeDays.has(toDateKey(cursor))) {
        streak += 1;
        cursor = addDays(cursor, -1);
    }
    return streak;
}

function renderWeeklyActivity(todos, focusSessions, flashcards) {
    if (!weeklyActivityChart) return;

    const days = Array.from({ length: 7 }).map((_, index) => {
        const date = addDays(new Date(`${getTodayDateKey()}T00:00`), index - 6);
        const key = toDateKey(date);
        const focus = focusSessions
            .filter(session => String(session.completed_at || '').slice(0, 10) === key)
            .reduce((total, session) => total + Number(session.minutes || 0), 0);
        const completedTasks = todos.filter(todo => String(todo.completed_at || '').slice(0, 10) === key).length;
        const reviews = flashcards.filter(card => String(card.last_reviewed || '').slice(0, 10) === key).length;
        return {
            key,
            label: date.toLocaleDateString([], { weekday: 'short' }),
            value: focus + completedTasks * 20 + reviews * 8,
            detail: `${focus} min, ${completedTasks} tasks, ${reviews} cards`
        };
    });
    const maxValue = Math.max(...days.map(day => day.value), 1);

    weeklyActivityChart.innerHTML = days.map((day, index) => `
        <div class="bar-item" title="${escapeHtml(day.detail)}">
            <div class="bar-track">
                <div class="bar-fill" style="height: ${Math.max((day.value / maxValue) * 100, day.value ? 12 : 4)}%"></div>
            </div>
            <span>${escapeHtml(day.label)}</span>
        </div>
    `).join('');
    weeklyActivityChart.querySelectorAll('.bar-item').forEach((item, index) => setItemDelay(item, index));
}

// ============================================
// ANALYTICS CHARTS
// ============================================
let focusChart = null;
let tasksChart = null;
let flashChart = null;

function renderAnalyticsCharts() {
    if (!window.Chart) return;

    const todos = getUserData('todos', []);
    const focusSessions = getUserData('focusSessions', []);
    const flashcards = getUserData('flashcards', []);
    const labels = Array.from({ length: 7 }).map((_, index) => {
        const date = addDays(new Date(`${getTodayDateKey()}T00:00`), index - 6);
        return date.toLocaleDateString([], { weekday: 'short' });
    });
    const focusData = labels.map((_, index) => {
        const date = addDays(new Date(`${getTodayDateKey()}T00:00`), index - 6);
        const key = toDateKey(date);
        return focusSessions
            .filter(session => String(session.completed_at || '').slice(0, 10) === key)
            .reduce((total, session) => total + Number(session.minutes || 0), 0);
    });
    const completedData = labels.map((_, index) => {
        const date = addDays(new Date(`${getTodayDateKey()}T00:00`), index - 6);
        const key = toDateKey(date);
        return todos.filter(todo => String(todo.completed_at || '').slice(0, 10) === key).length;
    });
    const dueNow = getDueFlashcards(flashcards).length;
    const reviewedToday = flashcards.filter(card => String(card.last_reviewed || '').slice(0, 10) === getTodayDateKey()).length;

    if (focusChartCanvas) {
        focusChart?.destroy();
        focusChart = new Chart(focusChartCanvas, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Focus minutes',
                    data: focusData,
                    borderColor: '#6c63ff',
                    backgroundColor: 'rgba(108, 99, 255, 0.18)',
                    fill: true,
                    tension: 0.35
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    if (tasksChartCanvas) {
        tasksChart?.destroy();
        tasksChart = new Chart(tasksChartCanvas, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Tasks completed',
                    data: completedData,
                    backgroundColor: 'rgba(0, 201, 167, 0.6)'
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    if (flashChartCanvas) {
        flashChart?.destroy();
        flashChart = new Chart(flashChartCanvas, {
            type: 'doughnut',
            data: {
                labels: ['Due now', 'Reviewed today'],
                datasets: [{
                    data: [dueNow, reviewedToday],
                    backgroundColor: ['rgba(245, 158, 11, 0.7)', 'rgba(108, 99, 255, 0.7)']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
}

function renderMoodRecommendation(todos, schedule, focusSessions, flashcards) {
    if (!moodRecommendation) return;

    const selectedMood = getUserData('selectedMood', 'focused');
    if (moodSelector) {
        moodSelector.querySelectorAll('.mood-btn').forEach(button => {
            button.classList.toggle('active', button.dataset.mood === selectedMood);
        });
    }

    const dueCards = getDueFlashcards(flashcards).length;
    const pendingTasks = todos.filter(todo => todo.status !== 'completed').length;
    const nextSession = schedule
        .filter(item => getScheduleDateTime(item) >= new Date())
        .sort((a, b) => getScheduleDateTime(a) - getScheduleDateTime(b))[0];

    const recommendations = {
        focused: {
            title: 'Deep work block',
            body: nextSession
                ? `Start with ${nextSession.subject}. Use a 45-minute block, then review ${dueCards || 5} flashcards.`
                : 'Create one high-priority session, then use the focus timer for 45 minutes.'
        },
        tired: {
            title: 'Light revision mode',
            body: dueCards
                ? `Review ${Math.min(dueCards, 10)} due flashcards and stop after one short focus block.`
                : 'Read summaries, clean up notes, or do a 15-minute recap instead of heavy problem-solving.'
        },
        stressed: {
            title: 'Reduce the load',
            body: `Pick only 1 task from ${pendingTasks || 'your list'}, do 25 minutes, then take a real break.`
        },
        busy: {
            title: 'Minimum viable study',
            body: 'Do 10 minutes of flashcards, one quick task, and schedule the next deep-work slot.'
        }
    };
    const recommendation = recommendations[selectedMood] || recommendations.focused;
    moodRecommendation.innerHTML = `
        <strong>${escapeHtml(recommendation.title)}</strong>
        <p>${escapeHtml(recommendation.body)}</p>
    `;
}

function getEarnedBadges(todos, focusSessions, flashcards, notes, schedule, streak) {
    const totalFocus = focusSessions.reduce((total, session) => total + Number(session.minutes || 0), 0);
    const completedTodos = todos.filter(todo => todo.status === 'completed').length;
    const reviewedCards = flashcards.reduce((total, card) => total + Number(card.review_count || 0), 0);

    return [
        { name: 'First Focus', detail: 'Complete one timer session', earned: focusSessions.length >= 1 },
        { name: 'Task Finisher', detail: 'Complete 5 tasks', earned: completedTodos >= 5 },
        { name: 'Revision Starter', detail: 'Review 10 flashcards', earned: reviewedCards >= 10 },
        { name: 'Planner Pro', detail: 'Schedule 7 study sessions', earned: schedule.length >= 7 },
        { name: 'Note Builder', detail: 'Create 5 notes', earned: notes.length >= 5 },
        { name: 'Streak Builder', detail: 'Reach a 3-day streak', earned: streak >= 3 },
        { name: 'Deep Worker', detail: 'Log 300 focus minutes', earned: totalFocus >= 300 }
    ];
}

function renderBadges(badges) {
    if (!badgesList) return;
    badgesList.innerHTML = badges.map((badge, index) => `
        <div class="badge-pill ${badge.earned ? 'earned' : ''}">
            <strong>${escapeHtml(badge.name)}</strong>
            <span>${escapeHtml(badge.detail)}</span>
        </div>
    `).join('');
    badgesList.querySelectorAll('.badge-pill').forEach((item, index) => setItemDelay(item, index));
}

function renderSnapshotList(container, items) {
    if (!container) return;
    container.innerHTML = items.map((item, index) => `
        <div class="snapshot-item">
            <span>${escapeHtml(item.label)}</span>
            <strong>${escapeHtml(String(item.value))}</strong>
        </div>
    `).join('');
    container.querySelectorAll('.snapshot-item').forEach((item, index) => setItemDelay(item, index));
}

function getScheduleDateTime(item) {
    const date = item.study_date || getTodayDateKey();
    const time = String(item.start_time || '00:00').slice(0, 5);
    return new Date(`${date}T${time}`);
}

function getScheduleDurationMinutes(item) {
    const start = getScheduleDateTime(item);
    const endTime = String(item.end_time || item.start_time || '00:00').slice(0, 5);
    let end = new Date(`${item.study_date || getTodayDateKey()}T${endTime}`);
    if (end < start) {
        end = addDays(end, 1);
    }
    const minutes = Math.round((end - start) / 60000);
    return Number.isFinite(minutes) ? Math.max(minutes, 0) : 0;
}

function formatScheduleDateTime(item) {
    const date = getScheduleDateTime(item);
    const time = `${String(item.start_time || '').slice(0, 5)}-${String(item.end_time || '').slice(0, 5)}`;
    return `${date.toLocaleDateString()} ${time}`;
}

// ============================================
// FLASHCARD FUNCTIONS
// ============================================
const addFlashcardBtn = document.getElementById('addFlashcardBtn');
const startQuizBtn = document.getElementById('startQuizBtn');
const flashcardDeckFilter = document.getElementById('flashcardDeckFilter');
const flashcardsContainer = document.getElementById('flashcardsContainer');
const flashcardModal = document.getElementById('flashcardModal');
const closeFlashcardModalBtn = flashcardModal ? flashcardModal.querySelector('.close-modal') : null;
const saveFlashcardBtn = document.getElementById('saveFlashcardBtn');
const flashcardDeckInput = document.getElementById('flashcardDeck');
const flashcardFrontInput = document.getElementById('flashcardFront');
const flashcardBackInput = document.getElementById('flashcardBack');
const quizCard = document.getElementById('quizCard');
const quizProgress = document.getElementById('quizProgress');
const quizProgressBar = document.getElementById('quizProgressBar');
const revisionSummary = document.getElementById('revisionSummary');
const revealAnswerBtn = document.getElementById('revealAnswerBtn');
const againCardBtn = document.getElementById('againCardBtn');
const knownCardBtn = document.getElementById('knownCardBtn');

let currentFlashcardId = null;
let quizQueue = [];
let quizIndex = 0;
let quizAnswerVisible = false;

if (addFlashcardBtn) {
    addFlashcardBtn.addEventListener('click', () => {
        currentFlashcardId = null;
        flashcardDeckInput.value = '';
        flashcardFrontInput.value = '';
        flashcardBackInput.value = '';
        document.getElementById('flashcardModalTitle').textContent = 'Add Flashcard';
        openModal(flashcardModal);
    });
}

if (closeFlashcardModalBtn) {
    closeFlashcardModalBtn.addEventListener('click', () => {
        closeModalWithAnimation(flashcardModal);
    });
}

if (saveFlashcardBtn) {
    saveFlashcardBtn.addEventListener('click', saveFlashcard);
}

if (flashcardDeckFilter) {
    flashcardDeckFilter.addEventListener('input', () => {
        loadFlashcards();
        renderQuizState();
    });
}

if (startQuizBtn) {
    startQuizBtn.addEventListener('click', startQuiz);
}

if (revealAnswerBtn) {
    revealAnswerBtn.addEventListener('click', () => {
        quizAnswerVisible = true;
        renderQuizState();
    });
}

if (againCardBtn) {
    againCardBtn.addEventListener('click', () => markQuizCard(false));
}

if (knownCardBtn) {
    knownCardBtn.addEventListener('click', () => markQuizCard(true));
}

function getFlashcards() {
    return getUserData('flashcards', []);
}

function saveFlashcards(cards) {
    setUserData('flashcards', cards);
}

function getFilteredFlashcards() {
    const filter = flashcardDeckFilter ? flashcardDeckFilter.value.trim().toLowerCase() : '';
    return getFlashcards()
        .filter(card => !filter || String(card.deck || '').toLowerCase().includes(filter))
        .sort((a, b) => {
            const dueDiff = getCardDueTime(a) - getCardDueTime(b);
            if (dueDiff !== 0) return dueDiff;
            return new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0);
        });
}

function getCardDueTime(card) {
    return new Date(card.next_review_at || card.created_at || 0).getTime();
}

function getDueFlashcards(cards = getFilteredFlashcards()) {
    const now = Date.now();
    return cards.filter(card => !card.next_review_at || new Date(card.next_review_at).getTime() <= now);
}

function getDueSoonFlashcards(cards = getFilteredFlashcards(), hours = 48) {
    const now = Date.now();
    const soon = now + hours * 60 * 60 * 1000;
    return cards.filter(card => {
        if (!card.next_review_at) return false;
        const dueTime = new Date(card.next_review_at).getTime();
        return dueTime > now && dueTime <= soon;
    });
}

function loadFlashcards() {
    if (!flashcardsContainer) return;

    const cards = getFilteredFlashcards();
    flashcardsContainer.innerHTML = '';

    if (cards.length === 0) {
        flashcardsContainer.innerHTML = '<p class="empty-state">No flashcards yet. Add a card to start reviewing.</p>';
        renderRevisionSummary();
        return;
    }

    cards.forEach((card, index) => {
        const accuracy = card.review_count
            ? Math.round((Number(card.correct_count || 0) / Number(card.review_count || 1)) * 100)
            : 0;
        const dueState = getCardDueLabel(card);
        const cardEl = document.createElement('div');
        cardEl.className = `flashcard-card ${dueState.isDue ? 'is-due' : ''}`;
        setItemDelay(cardEl, index);
        cardEl.innerHTML = `
            <div class="flashcard-deck">${escapeHtml(card.deck || 'General')}</div>
            <div class="flashcard-inner">
                <div class="flashcard-face front">
                    <span>Question</span>
                    <h3>${escapeHtml(card.front)}</h3>
                </div>
                <div class="flashcard-face back">
                    <span>Answer</span>
                    <p>${escapeHtml(card.back)}</p>
                </div>
            </div>
            <div class="flashcard-meta">
                <span>${card.review_count || 0} reviews</span>
                <span>${accuracy}% correct</span>
                <span>${card.streak || 0} streak</span>
            </div>
            <div class="flashcard-due">${escapeHtml(dueState.label)}</div>
            <div class="flashcard-actions">
                <button onclick="editFlashcard(${card.id})">Edit</button>
                <button class="delete" onclick="deleteFlashcard(${card.id})">Delete</button>
            </div>
        `;
        cardEl.addEventListener('click', (event) => {
            const target = event.target instanceof Element ? event.target : null;
            if (target && target.closest('button')) return;
            cardEl.classList.toggle('flipped');
        });
        flashcardsContainer.appendChild(cardEl);
    });
    renderRevisionSummary();
}

function getCardDueLabel(card) {
    if (!card.next_review_at) {
        return { label: 'Due now', isDue: true };
    }
    const dueTime = new Date(card.next_review_at).getTime();
    const diffMs = dueTime - Date.now();
    if (diffMs <= 0) {
        return { label: 'Due now', isDue: true };
    }
    const diffDays = Math.ceil(diffMs / 86400000);
    if (diffDays <= 1) {
        return { label: 'Due tomorrow', isDue: false };
    }
    return { label: `Due in ${diffDays} days`, isDue: false };
}

function saveFlashcard() {
    const deck = flashcardDeckInput.value.trim() || 'General';
    const front = flashcardFrontInput.value.trim();
    const back = flashcardBackInput.value.trim();

    if (!front || !back) {
        alert('Please add both a question and an answer');
        return;
    }

    const cards = getFlashcards();
    const now = new Date().toISOString();

    if (currentFlashcardId) {
        const cardIndex = cards.findIndex(card => card.id === currentFlashcardId);
        if (cardIndex !== -1) {
            cards[cardIndex] = {
                ...cards[cardIndex],
                deck,
                front,
                back,
                updated_at: now
            };
        }
    } else {
        cards.push({
            id: generateId(),
            deck,
            front,
            back,
            review_count: 0,
            correct_count: 0,
            ease: 2.5,
            interval_days: 0,
            next_review_at: now,
            created_at: now,
            updated_at: now
        });
    }

    saveFlashcards(cards);
    closeModalWithAnimation(flashcardModal);
    loadFlashcards();
    updateOverview();
    renderQuizState();
}

function editFlashcard(id) {
    const card = getFlashcards().find(item => item.id === id);
    if (!card) return;

    currentFlashcardId = id;
    flashcardDeckInput.value = card.deck || 'General';
    flashcardFrontInput.value = card.front || '';
    flashcardBackInput.value = card.back || '';
    document.getElementById('flashcardModalTitle').textContent = 'Edit Flashcard';
    openModal(flashcardModal);
}

function deleteFlashcard(id) {
    if (!confirm('Are you sure you want to delete this flashcard?')) return;

    saveFlashcards(getFlashcards().filter(card => card.id !== id));
    quizQueue = quizQueue.filter(cardId => cardId !== id);
    loadFlashcards();
    updateOverview();
    renderQuizState();
}

function startQuiz() {
    const cards = getFilteredFlashcards();
    const dueCards = getDueFlashcards(cards);
    const reviewCards = dueCards.length > 0 ? dueCards : cards;
    if (reviewCards.length === 0) {
        renderQuizEmptyState('Add flashcards before starting a quiz.');
        return;
    }

    quizQueue = shuffle(reviewCards.map(card => card.id));
    quizIndex = 0;
    quizAnswerVisible = false;
    renderQuizState();
}

function renderQuizState() {
    if (!quizCard || !quizProgress) return;

    if (quizQueue.length > 0 && quizIndex >= quizQueue.length) {
        quizProgress.textContent = `${quizQueue.length} / ${quizQueue.length}`;
        updateQuizProgressBar(100);
        quizCard.innerHTML = '<p class="muted-text">Quiz complete. Start another round when you are ready.</p>';
        quizCard.classList.remove('answer-visible');
        setQuizButtons(false, false, false);
        renderRevisionSummary();
        return;
    }

    const currentCard = getCurrentQuizCard();
    if (!currentCard) {
        quizProgress.textContent = '0 / 0';
        renderQuizEmptyState('Add flashcards, then start a quiz.');
        return;
    }

    quizProgress.textContent = `${quizIndex + 1} / ${quizQueue.length}`;
    updateQuizProgressBar((quizIndex / Math.max(quizQueue.length, 1)) * 100);
    quizCard.innerHTML = `
        <div class="quiz-prompt">${escapeHtml(currentCard.front)}</div>
        ${quizAnswerVisible ? `<div class="quiz-answer">${escapeHtml(currentCard.back)}</div>` : ''}
    `;
    quizCard.classList.remove('quiz-card-swap');
    void quizCard.offsetWidth;
    quizCard.classList.add('quiz-card-swap');
    quizCard.classList.toggle('answer-visible', quizAnswerVisible);
    setQuizButtons(!quizAnswerVisible, quizAnswerVisible, quizAnswerVisible);
}

function renderQuizEmptyState(message) {
    if (quizCard) {
        quizCard.innerHTML = `<p class="muted-text">${escapeHtml(message)}</p>`;
        quizCard.classList.remove('answer-visible');
    }
    if (quizProgress) {
        quizProgress.textContent = '0 / 0';
    }
    updateQuizProgressBar(0);
    setQuizButtons(false, false, false);
}

function updateQuizProgressBar(percent) {
    if (quizProgressBar) {
        quizProgressBar.style.width = `${Math.min(Math.max(percent, 0), 100)}%`;
    }
}

function getCurrentQuizCard() {
    const currentId = quizQueue[quizIndex];
    if (!currentId) return null;
    return getFlashcards().find(card => card.id === currentId) || null;
}

function setQuizButtons(canReveal, canMarkAgain, canMarkKnown) {
    if (revealAnswerBtn) revealAnswerBtn.disabled = !canReveal;
    if (againCardBtn) againCardBtn.disabled = !canMarkAgain;
    if (knownCardBtn) knownCardBtn.disabled = !canMarkKnown;
}

function markQuizCard(remembered) {
    const currentCard = getCurrentQuizCard();
    if (!currentCard || !quizAnswerVisible) return;

    recordFlashcardReview(currentCard.id, remembered);
    if (!remembered) {
        quizQueue.push(currentCard.id);
    }
    quizIndex += 1;
    quizAnswerVisible = false;
    loadFlashcards();
    updateOverview();
    renderQuizState();
}

function recordFlashcardReview(id, remembered) {
    const cards = getFlashcards();
    const cardIndex = cards.findIndex(card => card.id === id);
    if (cardIndex === -1) return;

    const previousInterval = Number(cards[cardIndex].interval_days || 0);
    const previousEase = Number(cards[cardIndex].ease || 2.5);
    const previousStreak = Number(cards[cardIndex].streak || 0);
    const nextEase = remembered
        ? Math.min(previousEase + 0.12, 3.2)
        : Math.max(previousEase - 0.3, 1.3);
    const nextStreak = remembered ? previousStreak + 1 : 0;
    let nextInterval = 0;
    let nextReviewDate = new Date(Date.now() + 10 * 60 * 1000);

    if (remembered) {
        if (nextStreak === 1) {
            nextInterval = 1;
        } else if (nextStreak === 2) {
            nextInterval = 3;
        } else {
            nextInterval = Math.max(4, Math.ceil(Math.max(previousInterval, 3) * nextEase));
        }
        nextReviewDate = addDays(new Date(), nextInterval);
    }

    cards[cardIndex] = {
        ...cards[cardIndex],
        review_count: Number(cards[cardIndex].review_count || 0) + 1,
        correct_count: Number(cards[cardIndex].correct_count || 0) + (remembered ? 1 : 0),
        ease: nextEase,
        streak: nextStreak,
        lapse_count: Number(cards[cardIndex].lapse_count || 0) + (remembered ? 0 : 1),
        learning_state: remembered ? (nextStreak >= 3 ? 'stable' : 'learning') : 'again',
        interval_days: nextInterval,
        next_review_at: nextReviewDate.toISOString(),
        last_reviewed: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    saveFlashcards(cards);
}

function renderRevisionSummary() {
    if (!revisionSummary) return;
    const cards = getFilteredFlashcards();
    const dueCards = getDueFlashcards(cards);
    const reviewedToday = cards.filter(card => String(card.last_reviewed || '').slice(0, 10) === getTodayDateKey()).length;
    revisionSummary.innerHTML = `
        <div><strong>${dueCards.length}</strong><span>Due now</span></div>
        <div><strong>${reviewedToday}</strong><span>Reviewed today</span></div>
        <div><strong>${cards.length}</strong><span>Total cards</span></div>
    `;
}

function shuffle(items) {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
}

// ============================================
// FOCUS TIMER FUNCTIONS
// ============================================
const focusTimerDisplay = document.getElementById('focusTimerDisplay');
const focusProgress = document.getElementById('focusProgress');
const focusModeLabel = document.getElementById('focusModeLabel');
const startFocusBtn = document.getElementById('startFocusBtn');
const pauseFocusBtn = document.getElementById('pauseFocusBtn');
const resetFocusBtn = document.getElementById('resetFocusBtn');
const focusSubjectInput = document.getElementById('focusSubject');
const focusMinutesInput = document.getElementById('focusMinutes');
const breakMinutesInput = document.getElementById('breakMinutes');
const clearFocusLogBtn = document.getElementById('clearFocusLogBtn');
const focusLogList = document.getElementById('focusLogList');

let focusTimerId = null;
let focusMode = 'focus';
let focusSecondsRemaining = getFocusDurationSeconds();

if (startFocusBtn) {
    startFocusBtn.addEventListener('click', startFocusTimer);
}

if (pauseFocusBtn) {
    pauseFocusBtn.addEventListener('click', pauseFocusTimer);
}

if (resetFocusBtn) {
    resetFocusBtn.addEventListener('click', resetFocusTimer);
}

if (clearFocusLogBtn) {
    clearFocusLogBtn.addEventListener('click', () => {
        if (!confirm('Clear all focus session logs?')) return;
        setUserData('focusSessions', []);
        loadFocusLog();
        updateOverview();
    });
}

[focusMinutesInput, breakMinutesInput].forEach(input => {
    if (!input) return;
    input.addEventListener('change', () => {
        if (!focusTimerId) {
            resetFocusTimer();
        }
    });
});

function getTimerMinutes(input, fallback) {
    const value = Number(input ? input.value : fallback);
    if (!Number.isFinite(value)) return fallback;
    return Math.min(Math.max(Math.round(value), 1), 120);
}

function getFocusDurationSeconds() {
    return getTimerMinutes(focusMinutesInput, 25) * 60;
}

function getBreakDurationSeconds() {
    return getTimerMinutes(breakMinutesInput, 5) * 60;
}

function startFocusTimer() {
    if (focusTimerId) return;

    focusTimerId = setInterval(() => {
        focusSecondsRemaining -= 1;
        if (focusSecondsRemaining <= 0) {
            completeFocusBlock();
            return;
        }
        renderFocusTimer();
    }, 1000);

    renderFocusTimer();
}

function pauseFocusTimer() {
    if (focusTimerId) {
        clearInterval(focusTimerId);
        focusTimerId = null;
    }
    renderFocusTimer();
}

function resetFocusTimer() {
    pauseFocusTimer();
    focusMode = 'focus';
    focusSecondsRemaining = getFocusDurationSeconds();
    renderFocusTimer();
}

function completeFocusBlock() {
    pauseFocusTimer();

    if (focusMode === 'focus') {
        logFocusSession();
        focusMode = 'break';
        focusSecondsRemaining = getBreakDurationSeconds();
    } else {
        focusMode = 'focus';
        focusSecondsRemaining = getFocusDurationSeconds();
    }

    renderFocusTimer();
    loadFocusLog();
    updateOverview();
}

function renderFocusTimer() {
    if (focusTimerDisplay) {
        focusTimerDisplay.textContent = formatTimer(focusSecondsRemaining);
        focusTimerDisplay.classList.toggle('running', Boolean(focusTimerId));
        focusTimerDisplay.classList.toggle('break-mode', focusMode === 'break');
    }
    if (focusProgress) {
        const totalSeconds = focusMode === 'break' ? getBreakDurationSeconds() : getFocusDurationSeconds();
        const progress = totalSeconds > 0
            ? ((totalSeconds - focusSecondsRemaining) / totalSeconds) * 100
            : 0;
        focusProgress.style.setProperty('--progress', `${Math.min(Math.max(progress, 0), 100)}%`);
    }
    if (focusModeLabel) {
        focusModeLabel.textContent = focusMode === 'focus' ? 'Focus' : 'Break';
    }
    if (startFocusBtn) {
        startFocusBtn.disabled = Boolean(focusTimerId);
    }
    if (pauseFocusBtn) {
        pauseFocusBtn.disabled = !focusTimerId;
    }
}

function formatTimer(totalSeconds) {
    const minutes = Math.floor(Math.max(totalSeconds, 0) / 60);
    const seconds = Math.max(totalSeconds, 0) % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function logFocusSession() {
    const sessions = getUserData('focusSessions', []);
    sessions.unshift({
        id: generateId(),
        subject: focusSubjectInput && focusSubjectInput.value.trim() ? focusSubjectInput.value.trim() : 'General Study',
        minutes: getTimerMinutes(focusMinutesInput, 25),
        completed_at: new Date().toISOString()
    });
    setUserData('focusSessions', sessions.slice(0, 100));
}

// ============================================
// NOTIFICATIONS
// ============================================
if (enableNotificationsBtn) {
    enableNotificationsBtn.addEventListener('click', async () => {
        if (!('Notification' in window)) {
            showToast('Notifications not supported in this browser.', 'error');
            return;
        }
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            showToast('Notifications enabled.', 'success');
        } else {
            showToast('Notifications blocked.', 'error');
        }
    });
}

if (scheduleReminderBtn) {
    scheduleReminderBtn.addEventListener('click', () => {
        const time = reminderTimeInput ? reminderTimeInput.value : '18:00';
        localStorage.setItem(REMINDER_KEY, time);
        showToast(`Reminder set for ${time}.`, 'success');
    });
}

function startReminderLoop() {
    setInterval(() => {
        const time = localStorage.getItem(REMINDER_KEY);
        if (!time) return;
        const now = new Date();
        const timeKey = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const lastSent = localStorage.getItem('reminderSent') || '';
        if (timeKey === time && lastSent !== getTodayDateKey()) {
            triggerNotification('StudyBuddy Reminder', 'Time for your scheduled study session.');
            localStorage.setItem('reminderSent', getTodayDateKey());
        }

        const lastActive = localStorage.getItem(LAST_ACTIVE_KEY);
        if (lastActive && lastActive.slice(0, 10) !== getTodayDateKey() && now.getHours() >= 20) {
            triggerNotification('Keep the streak!', 'You have not studied today. 10 minutes keeps the streak alive.');
        }
    }, 60000);
}

function triggerNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
    } else {
        showToast(body, 'error');
    }
}

function loadFocusLog() {
    if (!focusLogList) return;

    const sessions = getUserData('focusSessions', []);
    if (sessions.length === 0) {
        focusLogList.innerHTML = '<p class="empty-state">No focus sessions logged yet.</p>';
        return;
    }

    focusLogList.innerHTML = sessions.slice(0, 10).map(session => `
        <div class="focus-log-item">
            <div>
                <strong>${escapeHtml(session.subject || 'General Study')}</strong>
                <span>${new Date(session.completed_at).toLocaleString()}</span>
            </div>
            <strong>${Number(session.minutes || 0)} min</strong>
        </div>
    `).join('');
    focusLogList.querySelectorAll('.focus-log-item').forEach((item, index) => setItemDelay(item, index));
}

// ============================================
// COLLABORATION (SOCKET.IO)
// ============================================
let socket = null;
let collabReady = false;
let sharedNoteTimer = null;

function initCollaboration() {
    if (collabReady || !window.io) return;
    socket = window.io(API_BASE_URL || undefined, { transports: ['websocket'] });
    collabReady = true;

    socket.on('connect', () => {
        socket.emit('joinRoom', { room: 'studybuddy' });
    });

    socket.on('collabMessage', (payload) => {
        appendCollabMessage(payload);
    });

    socket.on('sharedNote', (payload) => {
        if (!sharedNote) return;
        sharedNote.value = payload?.text || '';
    });

    socket.on('boardState', (payload) => {
        if (payload?.state) {
            saveBoardState(payload.state, false);
            renderKanbanBoard();
        }
    });
}

if (collabSendBtn) {
    collabSendBtn.addEventListener('click', () => sendCollabMessage());
}

if (collabInput) {
    collabInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendCollabMessage();
        }
    });
}

if (sharedNote) {
    sharedNote.addEventListener('input', () => {
        if (!socket) return;
        clearTimeout(sharedNoteTimer);
        sharedNoteTimer = setTimeout(() => {
            socket.emit('sharedNote', { room: 'studybuddy', text: sharedNote.value });
        }, 400);
    });
}

function sendCollabMessage() {
    if (!collabInput || !collabInput.value.trim()) return;
    if (!socket) return;
    const message = collabInput.value.trim();
    collabInput.value = '';
    socket.emit('collabMessage', { room: 'studybuddy', message, sender: userName?.textContent || 'Student' });
}

function appendCollabMessage({ message, sender, time } = {}) {
    if (!collabMessages) return;
    const item = document.createElement('div');
    item.className = 'collab-message';
    const timestamp = time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    item.innerHTML = `<strong>${escapeHtml(sender || 'Student')}</strong> <span class="muted-text">${timestamp}</span><div>${escapeHtml(message || '')}</div>`;
    collabMessages.appendChild(item);
    collabMessages.scrollTop = collabMessages.scrollHeight;
}

window.editNote = editNote;
window.deleteNote = deleteNote;
window.updateTodoStatus = updateTodoStatus;
window.deleteTodo = deleteTodo;
window.deleteSchedule = deleteSchedule;
window.editFlashcard = editFlashcard;
window.deleteFlashcard = deleteFlashcard;

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

function markActive() {
    localStorage.setItem(LAST_ACTIVE_KEY, new Date().toISOString());
}

function initButtonRipples() {
    document.addEventListener('click', (event) => {
        const button = event.target instanceof Element
            ? event.target.closest('.btn, .action-btn, .send-btn, .voice-btn, .nav-btn, .toggle-btn')
            : null;
        if (!button) return;

        const rect = button.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'btn-ripple';
        ripple.style.left = `${event.clientX - rect.left}px`;
        ripple.style.top = `${event.clientY - rect.top}px`;
        button.appendChild(ripple);
        setTimeout(() => ripple.remove(), 520);
    });
}

function initScrollReveal() {
    revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    observeRevealElements();
}

function observeRevealElements(rootElement = null) {
    if (!revealObserver) return;
    const elements = rootElement
        ? [rootElement]
        : Array.from(document.querySelectorAll('.overview-panel, .stat-card, .note-card, .todo-item, .schedule-card, .flashcard-card, .focus-panel, .kanban-column, .planner-preview-card, .snapshot-item'));

    elements.forEach((el) => {
        if (!el.classList.contains('in-view')) {
            el.classList.add('reveal-on-scroll');
            revealObserver.observe(el);
        }
    });
}

function closeModalWithAnimation(modal) {
    if (!modal || !modal.classList.contains('active')) return;
    modal.classList.add('closing');
    setTimeout(() => {
        modal.classList.remove('closing', 'active');
    }, 220);
}

function openModal(modal) {
    if (!modal) return;
    modal.classList.remove('closing');
    modal.classList.add('active');
}

function initCardParallax() {
    const interactiveSelector = '.note-card, .todo-item, .schedule-card, .overview-panel, .flashcard-card, .kanban-card';

    document.addEventListener('pointermove', (event) => {
        const card = event.target instanceof Element ? event.target.closest(interactiveSelector) : null;
        if (!card) return;

        const rect = card.getBoundingClientRect();
        const offsetX = ((event.clientX - rect.left) / rect.width) - 0.5;
        const offsetY = ((event.clientY - rect.top) / rect.height) - 0.5;
        const rotateY = Math.max(Math.min(offsetX * 6, 6), -6);
        const rotateX = Math.max(Math.min(-offsetY * 6, 6), -6);

        card.style.setProperty('--tilt-x', `${rotateX}deg`);
        card.style.setProperty('--tilt-y', `${rotateY}deg`);
        card.classList.add('card-tilt');
    });

    document.addEventListener('pointerleave', (event) => {
        const card = event.target instanceof Element ? event.target.closest(interactiveSelector) : null;
        if (!card) return;
        card.classList.remove('card-tilt');
        card.style.removeProperty('--tilt-x');
        card.style.removeProperty('--tilt-y');
    }, true);
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    if (!getCurrentUser()) {
        return;
    }

    document.body.classList.add('app-loaded');

    window.addEventListener('error', (event) => {
        if (event?.message) {
            showUiError(`Script error: ${event.message}`);
        }
    });

    window.addEventListener('unhandledrejection', (event) => {
        if (event?.reason?.message) {
            showUiError(`Error: ${event.reason.message}`);
        }
    });

    startClock();
    loadTheme();
    loadUserInfo();
    if (sidebar) {
        const isCollapsed = localStorage.getItem(SIDEBAR_STATE_KEY) === 'true';
        sidebar.classList.toggle('collapsed', isCollapsed);
    }
    const activeBtn = document.querySelector('.nav-btn.active');
    if (activeBtn) {
        updateNavIndicator(activeBtn);
    }
    window.addEventListener('resize', () => {
        const currentActive = document.querySelector('.nav-btn.active');
        if (currentActive) {
            updateNavIndicator(currentActive);
        }
    });
    document.addEventListener('click', (event) => {
        const modal = event.target instanceof Element ? event.target.closest('.modal.active') : null;
        if (modal && event.target === modal) {
            closeModalWithAnimation(modal);
        }
    });
    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            closeModalWithAnimation(activeModal);
        }
    });
    initButtonRipples();
    initScrollReveal();
    initCalendar();
    loadNotes();
    loadTodos();
    loadSchedule();
    renderPlannerPreview();
    loadFlashcards();
    renderQuizState();
    renderRevisionSummary();
    renderFocusTimer();
    loadFocusLog();
    updateOverview();
    renderKanbanBoard();
    renderAnalyticsCharts();
    startReminderLoop();
    initCardParallax();
    markActive();
    document.addEventListener('click', markActive);
    document.addEventListener('keydown', markActive);
});
