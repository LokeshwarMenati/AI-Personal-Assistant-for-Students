// ============================================
// CONTROLLERS TEMPLATE (For Future Expansion)
// ============================================

// This file demonstrates the structure for expanding
// the application with more complex logic

const { pool } = require('../db');

// ============================================
// Chat Controller Template
// ============================================
class ChatController {
    // Send message to AI
    static async sendMessage(req, res) {
        try {
            const { message } = req.body;
            const userId = req.user.id;

            // Validate input
            if (!message || message.trim() === '') {
                return res.status(400).json({ error: 'Message cannot be empty' });
            }

            // Generate AI response
            // TODO: Replace with actual AI service call
            const aiResponse = this.generateMockResponse(message);

            // Save to database
            const [result] = await pool.query(
                'INSERT INTO chats (user_id, message, response) VALUES (?, ?, ?)',
                [userId, message, aiResponse]
            );

            return res.status(201).json({
                chatId: result.insertId,
                message: message,
                response: aiResponse,
                timestamp: new Date()
            });

        } catch (error) {
            console.error('Chat error:', error);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    // Get chat history
    static async getHistory(req, res) {
        try {
            const userId = req.user.id;

            const [chats] = await pool.query(
                'SELECT * FROM chats WHERE user_id = ? ORDER BY timestamp DESC LIMIT 50',
                [userId]
            );

            return res.status(200).json({ chats });

        } catch (error) {
            console.error('History error:', error);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    // Generate mock AI response
    static generateMockResponse(message) {
        const responses = {
            'hello': 'Hello! How can I help you study today?',
            'math': 'Mathematics is fundamental! What topic would you like help with?',
            'science': 'Science is fascinating! Physics, Chemistry, or Biology?',
            'default': 'That\'s a great question! Tell me more about what you\'d like to learn.'
        };

        const lowerMessage = message.toLowerCase();
        for (const [key, value] of Object.entries(responses)) {
            if (lowerMessage.includes(key)) return value;
        }
        return responses.default;
    }
}

// ============================================
// User Controller Template
// ============================================
class UserController {
    // Get user profile with statistics
    static async getProfile(req, res) {
        try {
            const userId = req.user.id;

            // Get user info
            const [users] = await pool.query(
                'SELECT id, name, email, created_at FROM users WHERE id = ?',
                [userId]
            );

            // Get user statistics
            const [chatStats] = await pool.query(
                'SELECT COUNT(*) as total FROM chats WHERE user_id = ?',
                [userId]
            );

            const [noteStats] = await pool.query(
                'SELECT COUNT(*) as total FROM notes WHERE user_id = ?',
                [userId]
            );

            return res.status(200).json({
                user: users[0],
                stats: {
                    chats: chatStats[0].total,
                    notes: noteStats[0].total
                }
            });

        } catch (error) {
            console.error('Profile error:', error);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    // Update user profile
    static async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            const { name, email } = req.body;

            if (!name || !email) {
                return res.status(400).json({ error: 'Name and email are required' });
            }

            await pool.query(
                'UPDATE users SET name = ?, email = ? WHERE id = ?',
                [name, email, userId]
            );

            return res.status(200).json({ message: 'Profile updated successfully' });

        } catch (error) {
            console.error('Update error:', error);
            return res.status(500).json({ error: 'Server error' });
        }
    }
}

// ============================================
// Analytics Controller Template
// ============================================
class AnalyticsController {
    // Get study statistics
    static async getStudyStats(req, res) {
        try {
            const userId = req.user.id;

            const [todayChats] = await pool.query(
                'SELECT COUNT(*) as total FROM chats WHERE user_id = ? AND DATE(timestamp) = CURDATE()',
                [userId]
            );

            const [thisWeekChats] = await pool.query(
                'SELECT COUNT(*) as total FROM chats WHERE user_id = ? AND timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)',
                [userId]
            );

            const [completedTodos] = await pool.query(
                'SELECT COUNT(*) as total FROM todos WHERE user_id = ? AND status = "completed"',
                [userId]
            );

            return res.status(200).json({
                today: todayChats[0].total,
                thisWeek: thisWeekChats[0].total,
                completedTasks: completedTodos[0].total
            });

        } catch (error) {
            console.error('Analytics error:', error);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    // Get study goals progress
    static async getProgress(req, res) {
        try {
            const userId = req.user.id;

            const [stats] = await pool.query(`
                SELECT
                    (SELECT COUNT(*) FROM todos WHERE user_id = ? AND status = 'completed') as completed_tasks,
                    (SELECT COUNT(*) FROM todos WHERE user_id = ?) as total_tasks,
                    (SELECT COUNT(*) FROM notes WHERE user_id = ?) as total_notes,
                    (SELECT COUNT(*) FROM chats WHERE user_id = ?) as total_chats
            `, [userId, userId, userId, userId]);

            const percentage = stats[0].total_tasks > 0
                ? Math.round((stats[0].completed_tasks / stats[0].total_tasks) * 100)
                : 0;

            return res.status(200).json({
                taskCompletion: percentage,
                stats: stats[0]
            });

        } catch (error) {
            console.error('Progress error:', error);
            return res.status(500).json({ error: 'Server error' });
        }
    }
}

// ============================================
// Export Controllers
// ============================================
module.exports = {
    ChatController,
    UserController,
    AnalyticsController
};

// ============================================
// USAGE EXAMPLE
// ============================================
/*
// In routes/chat.js:
const { ChatController } = require('../controllers/index');

router.post('/send', verifyToken, ChatController.sendMessage);
router.get('/history', verifyToken, ChatController.getHistory);

// In routes/analytics.js:
const { AnalyticsController } = require('../controllers/index');

router.get('/stats', verifyToken, AnalyticsController.getStudyStats);
router.get('/progress', verifyToken, AnalyticsController.getProgress);
*/
