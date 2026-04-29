const jwt = require('jsonwebtoken');

// Verify JWT token
const verifyToken = (req, res, next) => {
    // Prefer Authorization header, fall back to cookie named 'sb_token'
    let token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        const cookieHeader = req.headers.cookie || '';
        const match = cookieHeader.match(/(?:^|; )sb_token=([^;]+)/);
        if (match) {
            try {
                token = decodeURIComponent(match[1]);
            } catch (e) {
                token = match[1];
            }
        }
    }

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key_change_in_production');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token.' });
    }
};

module.exports = { verifyToken };
