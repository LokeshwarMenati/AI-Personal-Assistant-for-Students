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
loginToggle.addEventListener('click', () => {
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
    loginToggle.classList.add('active');
    registerToggle.classList.remove('active');
    clearErrors();
});

registerToggle.addEventListener('click', () => {
    registerForm.classList.add('active');
    loginForm.classList.remove('active');
    registerToggle.classList.add('active');
    loginToggle.classList.remove('active');
    clearErrors();
});

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
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const user = getCurrentUser();
    if (user) {
        window.location.href = '/dashboard.html';
    }

    loadTheme();
    const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
    const rememberMeInput = document.getElementById('rememberMe');
    if (rememberMeInput) {
        rememberMeInput.checked = rememberMe;
    }
});
