const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
const useInMemoryDb = process.env.USE_IN_MEMORY_DB === 'true';
const inMemoryUsers = [];
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo';

function getJwtSecret() {
    return process.env.JWT_SECRET || 'your_secret_key_change_in_production';
}

function createAuthToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        getJwtSecret(),
        { expiresIn: '24h' }
    );
}

function getAppUrl(req) {
    return String(process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
}

function getGoogleRedirectUri(req) {
    return process.env.GOOGLE_REDIRECT_URI || `${getAppUrl(req)}/api/auth/google/callback`;
}

function isGoogleOAuthConfigured() {
    return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function redirectWithOAuthError(req, message) {
    const target = `${getAppUrl(req)}/oauth-callback.html#error=${encodeURIComponent(message)}`;
    return target;
}

function redirectWithOAuthSuccess(req, token, user) {
    const userPayload = encodeURIComponent(JSON.stringify(user));
    // If server is configured to issue JWT via an HttpOnly cookie, the callback
    // should redirect to the frontend without exposing the token in the URL.
    if (process.env.USE_HTTP_ONLY_COOKIE_FOR_JWT === 'true') {
        return process.env.FRONTEND_URL || `${getAppUrl(req)}/dashboard.html`;
    }

    return `${getAppUrl(req)}/oauth-callback.html#token=${encodeURIComponent(token)}&user=${userPayload}`;
}

async function updateOptionalGoogleFields(userId, googleProfile) {
    try {
        await pool.query(
            'UPDATE users SET google_id = ?, auth_provider = ?, avatar_url = ? WHERE id = ?',
            [googleProfile.sub, 'google', googleProfile.picture || null, userId]
        );
    } catch (error) {
        if (error.code !== 'ER_BAD_FIELD_ERROR') {
            throw error;
        }
    }
}

async function findOrCreateGoogleUser(googleProfile) {
    const email = String(googleProfile.email || '').trim().toLowerCase();
    const name = String(googleProfile.name || email.split('@')[0] || 'Google User').trim();
    if (!email) {
        throw new Error('Google account did not provide an email address');
    }

    if (useInMemoryDb) {
        let user = inMemoryUsers.find((entry) => entry.email === email);
        if (!user) {
            user = {
                id: inMemoryUsers.length + 1,
                name,
                email,
                password: await bcrypt.hash(crypto.randomUUID(), 10),
                google_id: googleProfile.sub,
                auth_provider: 'google',
                avatar_url: googleProfile.picture || null,
                created_at: new Date()
            };
            inMemoryUsers.push(user);
        } else {
            user.name = user.name || name;
            user.google_id = googleProfile.sub;
            user.auth_provider = 'google';
            user.avatar_url = googleProfile.picture || user.avatar_url || null;
        }
        return { id: user.id, name: user.name, email: user.email };
    }

    const [existingUsers] = await pool.query(
        'SELECT id, name, email FROM users WHERE email = ?',
        [email]
    );

    if (existingUsers.length > 0) {
        const existingUser = existingUsers[0];
        await updateOptionalGoogleFields(existingUser.id, googleProfile);
        return existingUser;
    }

    const placeholderPassword = await bcrypt.hash(crypto.randomUUID(), 10);
    try {
        const [result] = await pool.query(
            'INSERT INTO users (name, email, password, google_id, auth_provider, avatar_url) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, placeholderPassword, googleProfile.sub, 'google', googleProfile.picture || null]
        );
        return { id: result.insertId, name, email };
    } catch (error) {
        if (error.code !== 'ER_BAD_FIELD_ERROR') {
            throw error;
        }

        const [fallbackResult] = await pool.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, placeholderPassword]
        );
        return { id: fallbackResult.insertId, name, email };
    }
}

async function exchangeGoogleCodeForProfile(req, code) {
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: getGoogleRedirectUri(req),
            grant_type: 'authorization_code'
        })
    });

    const tokenData = await tokenResponse.json().catch(() => ({}));
    if (!tokenResponse.ok) {
        throw new Error(tokenData.error_description || tokenData.error || 'Google token exchange failed');
    }

    if (!tokenData.id_token) {
        throw new Error('Google did not return an ID token');
    }

    const verifyResponse = await fetch(`${GOOGLE_TOKENINFO_URL}?id_token=${encodeURIComponent(tokenData.id_token)}`);
    const profile = await verifyResponse.json().catch(() => ({}));
    if (!verifyResponse.ok) {
        throw new Error(profile.error_description || profile.error || 'Google token verification failed');
    }

    if (profile.aud !== process.env.GOOGLE_CLIENT_ID) {
        throw new Error('Google token audience mismatch');
    }

    if (String(profile.email_verified) !== 'true') {
        throw new Error('Google email is not verified');
    }

    return profile;
}

// Register endpoint
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;

        // Validation
        if (!name || !email || !password || !confirmPassword) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        if (useInMemoryDb) {
            const userExists = inMemoryUsers.find((user) => user.email === email);
            if (userExists) {
                return res.status(400).json({ error: 'Email already registered' });
            }

            const userId = inMemoryUsers.length + 1;
            inMemoryUsers.push({ id: userId, name, email, password: hashedPassword, created_at: new Date() });

            return res.status(201).json({
                message: 'User registered successfully (in-memory mode)',
                userId
            });
        }

        // Check if email already exists
        const [existingUser] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Insert user into database
        const [result] = await pool.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        return res.status(201).json({
            message: 'User registered successfully',
            userId: result.insertId
        });

    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ error: 'Server error during registration' });
    }
});

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        let user;
        if (useInMemoryDb) {
            user = inMemoryUsers.find((u) => u.email === email);
            if (!user) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }
        } else {
            // Find user
            const [users] = await pool.query('SELECT id, name, email, password FROM users WHERE email = ?', [email]);
            if (users.length === 0) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }
            user = users[0];
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = createAuthToken(user);

        return res.status(200).json({
            message: 'Login successful',
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Server error during login' });
    }
});

// Google OAuth status used by the frontend before redirecting.
router.get('/google/config', (req, res) => {
    return res.status(200).json({
        configured: isGoogleOAuthConfigured(),
        redirectUri: getGoogleRedirectUri(req)
    });
});

// Start Google OAuth login.
router.get('/google', (req, res) => {
    if (!isGoogleOAuthConfigured()) {
        return res.redirect(redirectWithOAuthError(req, 'Google OAuth is not configured on this server'));
    }

    const state = jwt.sign(
        {
            nonce: crypto.randomBytes(16).toString('hex'),
            returnTo: '/dashboard.html'
        },
        getJwtSecret(),
        { expiresIn: '10m' }
    );

    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: getGoogleRedirectUri(req),
        response_type: 'code',
        scope: 'openid email profile',
        prompt: 'select_account',
        state
    });

    return res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
});

// Complete Google OAuth login and hand the frontend a normal StudyBuddy session.
router.get('/google/callback', async (req, res) => {
    try {
        if (req.query.error) {
            return res.redirect(redirectWithOAuthError(req, String(req.query.error)));
        }

        const code = String(req.query.code || '');
        const state = String(req.query.state || '');
        if (!code || !state) {
            return res.redirect(redirectWithOAuthError(req, 'Google OAuth callback is missing code or state'));
        }

        try {
            jwt.verify(state, getJwtSecret());
        } catch (error) {
            return res.redirect(redirectWithOAuthError(req, 'Google OAuth state is invalid or expired'));
        }

        const googleProfile = await exchangeGoogleCodeForProfile(req, code);
        const user = await findOrCreateGoogleUser(googleProfile);
        const token = createAuthToken(user);

        // If configured to use HttpOnly cookies for JWT, set a secure cookie
        // and redirect to the frontend without exposing the token in the URL.
        if (process.env.USE_HTTP_ONLY_COOKIE_FOR_JWT === 'true') {
            const cookieOptions = {
                httpOnly: true,
                secure: (process.env.NODE_ENV === 'production'),
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000 // 1 day
            };
            res.cookie('sb_token', token, cookieOptions);
            return res.redirect(process.env.FRONTEND_URL || `${getAppUrl(req)}/dashboard.html`);
        }

        return res.redirect(redirectWithOAuthSuccess(req, token, user));
    } catch (error) {
        console.error('Google OAuth error:', error);
        return res.redirect(redirectWithOAuthError(req, error.message || 'Google login failed'));
    }
});

// Get current user info
router.get('/profile', verifyToken, async (req, res) => {
    try {
        if (useInMemoryDb) {
            const user = inMemoryUsers.find((u) => u.id === req.user.id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            return res.status(200).json({
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    created_at: user.created_at
                }
            });
        }

        const [users] = await pool.query(
            'SELECT id, name, email, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({ user: users[0] });

    } catch (error) {
        console.error('Profile error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
