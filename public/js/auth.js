// ============================================
// AUTHENTICATION SCRIPT (LOCAL STORAGE)
// ============================================

// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginToggle = document.getElementById('loginToggle');
const registerToggle = document.getElementById('registerToggle');
const themeToggle = document.getElementById('themeToggle');
const toastContainer = document.getElementById('toastContainer');
const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
const googleLoginBtn = document.getElementById('googleLoginBtn');

const USERS_KEY = 'users';
const CURRENT_USER_KEY = 'user';
const REMEMBER_ME_KEY = 'rememberMe';
const DEFAULT_API_PORT = '3000';
const API_BASE_URL = window.location.protocol === 'file:' || ((window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') && window.location.port !== DEFAULT_API_PORT)
    ? `http://localhost:${DEFAULT_API_PORT}`
    : '';

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
}

// ============================================
// FORM TOGGLE
// ============================================
const toggleIndicator = document.getElementById('toggleIndicator');

function setAuthMode(mode) {
    if (mode === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        loginToggle.classList.add('active');
        registerToggle.classList.remove('active');
        if (toggleIndicator) toggleIndicator.classList.remove('right');
    } else {
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
        registerToggle.classList.add('active');
        loginToggle.classList.remove('active');
        if (toggleIndicator) toggleIndicator.classList.add('right');
    }
    clearErrors();
}

loginToggle.addEventListener('click', () => setAuthMode('login'));
registerToggle.addEventListener('click', () => setAuthMode('register'));

// ============================================
// LOGIN
// ============================================
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = normalizeEmail(document.getElementById('loginEmail').value);
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    const rememberMe = document.getElementById('rememberMe');
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    // Clear previous errors
    errorDiv.classList.remove('show');
    errorDiv.textContent = '';

    // Validation
    if (!email || !password) {
        showError(errorDiv, 'Email and password are required');
        return;
    }

    try {
        showLoading(submitBtn, true);

        const users = getUsers();
        const user = users.find(u => u.email === email);

        if (!user || user.password !== password) {
            throw new Error('Invalid email or password');
        }

        setCurrentUser({
            id: user.id,
            name: user.name,
            email: user.email
        });

        localStorage.setItem(REMEMBER_ME_KEY, rememberMe?.checked ? 'true' : 'false');
        showToast('Welcome back! Redirecting to dashboard...', 'success');

        window.location.href = '/dashboard.html';
    } catch (error) {
        showError(errorDiv, error.message);
        showToast(error.message, 'error');
    } finally {
        showLoading(submitBtn, false);
    }
});

// ============================================
// REGISTER
// ============================================
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('registerName').value.trim();
    const email = normalizeEmail(document.getElementById('registerEmail').value);
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const errorDiv = document.getElementById('registerError');
    const submitBtn = registerForm.querySelector('button[type="submit"]');

    // Clear previous errors
    errorDiv.classList.remove('show');
    errorDiv.textContent = '';

    // Validation
    if (!name || !email || !password || !confirmPassword) {
        showError(errorDiv, 'All fields are required');
        return;
    }

    if (password !== confirmPassword) {
        showError(errorDiv, 'Passwords do not match');
        return;
    }

    if (password.length < 6) {
        showError(errorDiv, 'Password must be at least 6 characters');
        return;
    }

    try {
        showLoading(submitBtn, true);

        const users = getUsers();
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            throw new Error('Email already registered');
        }

        const newUser = {
            id: generateId(),
            name,
            email,
            password
        };

        users.push(newUser);
        saveUsers(users);

        showToast('Registration successful! Please log in.', 'success');
        loginToggle.click();
        registerForm.reset();
    } catch (error) {
        showError(errorDiv, error.message);
        showToast(error.message, 'error');
    } finally {
        showLoading(submitBtn, false);
    }
});

// ============================================
// PASSWORD TOGGLE
// ============================================
document.querySelectorAll('.field-toggle').forEach(button => {
    button.addEventListener('click', () => {
        const targetId = button.getAttribute('data-target');
        const input = targetId ? document.getElementById(targetId) : null;
        if (!input) return;

        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        button.textContent = isPassword ? 'Hide' : 'Show';
        button.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    });
});

if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener('click', () => {
        showToast('Password reset flow will be emailed to you (demo mode).', 'success');
    });
}

if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', startGoogleLogin);
}

async function startGoogleLogin() {
    if (!googleLoginBtn) return;

    const originalText = googleLoginBtn.textContent;
    googleLoginBtn.disabled = true;
    googleLoginBtn.textContent = 'Connecting to Google...';

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/google/config`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.error || 'Unable to check Google OAuth configuration');
        }

        if (!data.configured) {
            const redirectHint = data.redirectUri ? ` Redirect URI: ${data.redirectUri}` : '';
            showToast(`Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, then restart the server.${redirectHint}`, 'error');
            return;
        }

        window.location.href = `${API_BASE_URL}/api/auth/google`;
    } catch (error) {
        showToast(error.message || 'Google login is unavailable right now.', 'error');
    } finally {
        googleLoginBtn.disabled = false;
        googleLoginBtn.textContent = originalText;
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function showError(element, message) {
    element.textContent = message;
    element.classList.add('show');
}

function clearErrors() {
    const errorDivs = document.querySelectorAll('.error-message');
    errorDivs.forEach(div => {
        div.classList.remove('show');
        div.textContent = '';
    });
}

function showLoading(button, isLoading) {
    const btnText = button.querySelector('.btn-text');
    const btnLoader = button.querySelector('.btn-loader');

    if (isLoading) {
        button.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (btnLoader) btnLoader.classList.remove('loader-hidden');
    } else {
        button.disabled = false;
        if (btnText) btnText.style.display = 'inline-block';
        if (btnLoader) btnLoader.classList.add('loader-hidden');
    }
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
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-6px)';
        setTimeout(() => toast.remove(), 220);
    }, 2400);
}

function getUsers() {
    try {
        return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    } catch (error) {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function normalizeEmail(email) {
    return email.trim().toLowerCase();
}

function setCurrentUser(user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
    localStorage.setItem('session', rememberMe ? 'persistent' : 'local');
}

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
    } catch (error) {
        return null;
    }
}

function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

// ============================================
// ANIMATIONS & VISUAL EFFECTS
// ============================================
function initAmbientCanvas() {
    const canvas = document.getElementById('ambientCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const count = Math.min(55, Math.floor((width * height) / 22000));

    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.7,
            vy: (Math.random() - 0.5) * 0.7,
            radius: Math.random() * 2 + 1,
            color: Math.random() > 0.5 ? '108, 99, 255' : '0, 201, 167'
        });
    }

    let mouse = { x: -1000, y: -1000 };
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    function render() {
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            // Draw particle
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.color}, 0.8)`;
            ctx.fill();

            // Connect neighboring particles with neon lines
            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 125) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(108, 99, 255, ${0.22 * (1 - dist / 125)})`;
                    ctx.lineWidth = 0.9;
                    ctx.stroke();
                }
            }

            // Mouse interactive connection
            const mdx = p.x - mouse.x;
            const mdy = p.y - mouse.y;
            const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
            if (mdist < 140) {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.strokeStyle = `rgba(0, 201, 167, ${0.4 * (1 - mdist / 140)})`;
                ctx.lineWidth = 1.2;
                ctx.stroke();
            }
        }

        requestAnimationFrame(render);
    }
    render();
}

function init3DCardTilt() {
    const cards = [document.getElementById('authCard'), document.getElementById('heroCard')].filter(Boolean);
    if (cards.length === 0) return;

    window.addEventListener('mousemove', (e) => {
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const cardX = rect.left + rect.width / 2;
            const cardY = rect.top + rect.height / 2;
            const deltaX = (e.clientX - cardX) / (window.innerWidth / 2);
            const deltaY = (e.clientY - cardY) / (window.innerHeight / 2);

            const tiltX = -deltaY * 7;
            const tiltY = deltaX * 7;

            card.style.transform = `perspective(1000px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) translateZ(8px)`;
        });
    });

    window.addEventListener('mouseleave', () => {
        cards.forEach(card => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)';
        });
    });
}

function initInteractiveLogo() {
    const logo = document.getElementById('interactiveLogo');
    if (!logo) return;
    logo.addEventListener('click', () => {
        logo.style.transform = 'scale(1.25) rotate(12deg)';
        showToast('🤖 Hey there! Ready to study smarter with AI?', 'info');
        setTimeout(() => {
            logo.style.transform = '';
        }, 350);
    });
}

function initLiveHomeDemo() {
    const demoChatFeed = document.getElementById('demoChatFeed');
    const demoChatForm = document.getElementById('demoChatForm');
    const demoInput = document.getElementById('demoInput');
    const promptChips = document.querySelectorAll('.demo-prompt-chip');

    async function sendDemoMessage(userText) {
        if (!userText || !demoChatFeed) return;

        const userBubble = document.createElement('div');
        userBubble.className = 'demo-chat-bubble demo-bubble-user';
        userBubble.textContent = userText;
        demoChatFeed.appendChild(userBubble);

        const aiBubble = document.createElement('div');
        aiBubble.className = 'demo-chat-bubble demo-bubble-ai';
        aiBubble.textContent = 'Thinking...';
        demoChatFeed.appendChild(aiBubble);
        demoChatFeed.scrollTop = demoChatFeed.scrollHeight;

        try {
            const res = await fetch(`${API_BASE_URL}/api/chat/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userText })
            });
            const data = await res.json();
            const reply = data?.reply || 'I am ready to help you master this concept!';

            aiBubble.textContent = '';
            let i = 0;
            const timer = setInterval(() => {
                aiBubble.textContent += reply.charAt(i);
                i++;
                demoChatFeed.scrollTop = demoChatFeed.scrollHeight;
                if (i >= reply.length) {
                    clearInterval(timer);
                }
            }, 12);
        } catch (_) {
            aiBubble.textContent = 'Here is a quick breakdown of this topic! Feel free to ask more questions.';
        }
    }

    if (demoChatForm && demoInput) {
        demoChatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = demoInput.value.trim();
            if (!text) return;
            demoInput.value = '';
            sendDemoMessage(text);
        });
    }

    promptChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const prompt = chip.getAttribute('data-prompt');
            if (prompt) sendDemoMessage(prompt);
        });
    });
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const user = getCurrentUser();
    if (user) {
        const navCta = document.querySelector('.nav-cta-group a');
        if (navCta) {
            navCta.textContent = `Open Dashboard (${user.name}) 🚀`;
            navCta.href = '/dashboard.html';
        }
        const heroPrimary = document.querySelector('.btn-hero-primary');
        if (heroPrimary) {
            heroPrimary.textContent = 'Open Dashboard 🚀';
            heroPrimary.href = '/dashboard.html';
        }
    }

    loadTheme();
    const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
    const rememberMeInput = document.getElementById('rememberMe');
    if (rememberMeInput) {
        rememberMeInput.checked = rememberMe;
    }

    initAmbientCanvas();
    init3DCardTilt();
    initInteractiveLogo();
    initLiveHomeDemo();
});
