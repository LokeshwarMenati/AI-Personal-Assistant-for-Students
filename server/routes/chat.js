const express = require('express');
const { pool } = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Mock AI responses - replace with actual API call if needed
const generateMockAIResponse = (userMessage) => {
    const responses = {
        'hello': 'Hello! I\'m your AI study assistant. How can I help you today?',
        'how are you': 'I\'m doing great! Ready to help you with your studies. What would you like to learn?',
        'help': 'I can assist you with:\n• Academic questions\n• Study tips\n• Homework help\n• Exam preparation\n• Subject explanations\n\nWhat would you like help with?',
        'math': 'Mathematics is a fundamental subject. Would you like help with algebra, geometry, calculus, or statistics?',
        'science': 'Science is fascinating! I can help with physics, chemistry, biology, or general science questions.',
        'history': 'History helps us understand the world. What period or event are you interested in?',
        'english': 'English includes literature, writing, grammar, and comprehension. How can I assist you?',
        'default': 'That\'s an interesting question! Could you provide more details so I can give you a better answer? I\'m here to help with academic topics.'
    };

    const lowerMessage = userMessage.toLowerCase();
    for (const [key, response] of Object.entries(responses)) {
        if (lowerMessage.includes(key)) {
            return response;
        }
    }
    return responses.default;
};

// Send message and get AI response
router.post('/send', verifyToken, async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).json({ error: 'Message cannot be empty' });
        }

        // Generate AI response (using mock for now)
        const aiResponse = generateMockAIResponse(message);

        // Save chat to database
        const [result] = await pool.query(
            'INSERT INTO chats (user_id, message, response) VALUES (?, ?, ?)',
            [req.user.id, message, aiResponse]
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
});

// Get chat history
router.get('/history', verifyToken, async (req, res) => {
    try {
        const [chats] = await pool.query(
            'SELECT id, message, response, timestamp FROM chats WHERE user_id = ? ORDER BY timestamp DESC LIMIT 50',
            [req.user.id]
        );

        return res.status(200).json({ chats: chats });

    } catch (error) {
        console.error('History error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Clear chat history
router.delete('/history', verifyToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM chats WHERE user_id = ?', [req.user.id]);

        return res.status(200).json({ message: 'Chat history cleared successfully' });

    } catch (error) {
        console.error('Clear history error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
