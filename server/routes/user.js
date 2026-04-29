const express = require('express');
const { pool } = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ===== NOTES =====

// Get all notes
router.get('/notes', verifyToken, async (req, res) => {
    try {
        const [notes] = await pool.query(
            'SELECT id, title, content, created_at, updated_at FROM notes WHERE user_id = ? ORDER BY updated_at DESC',
            [req.user.id]
        );

        return res.status(200).json({ notes: notes });

    } catch (error) {
        console.error('Get notes error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Create note
router.post('/notes', verifyToken, async (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        const [result] = await pool.query(
            'INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)',
            [req.user.id, title, content]
        );

        return res.status(201).json({
            id: result.insertId,
            title: title,
            content: content,
            message: 'Note created successfully'
        });

    } catch (error) {
        console.error('Create note error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Update note
router.put('/notes/:id', verifyToken, async (req, res) => {
    try {
        const { title, content } = req.body;
        const noteId = req.params.id;

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        // Verify ownership
        const [notes] = await pool.query(
            'SELECT user_id FROM notes WHERE id = ?',
            [noteId]
        );

        if (notes.length === 0 || notes[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await pool.query(
            'UPDATE notes SET title = ?, content = ? WHERE id = ?',
            [title, content, noteId]
        );

        return res.status(200).json({ message: 'Note updated successfully' });

    } catch (error) {
        console.error('Update note error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Delete note
router.delete('/notes/:id', verifyToken, async (req, res) => {
    try {
        const noteId = req.params.id;

        // Verify ownership
        const [notes] = await pool.query(
            'SELECT user_id FROM notes WHERE id = ?',
            [noteId]
        );

        if (notes.length === 0 || notes[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await pool.query('DELETE FROM notes WHERE id = ?', [noteId]);

        return res.status(200).json({ message: 'Note deleted successfully' });

    } catch (error) {
        console.error('Delete note error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

// ===== TODOS =====

// Get all todos
router.get('/todos', verifyToken, async (req, res) => {
    try {
        const [todos] = await pool.query(
            'SELECT id, task, status, due_date, created_at FROM todos WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );

        return res.status(200).json({ todos: todos });

    } catch (error) {
        console.error('Get todos error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Create todo
router.post('/todos', verifyToken, async (req, res) => {
    try {
        const { task, dueDate } = req.body;

        if (!task) {
            return res.status(400).json({ error: 'Task is required' });
        }

        const [result] = await pool.query(
            'INSERT INTO todos (user_id, task, due_date) VALUES (?, ?, ?)',
            [req.user.id, task, dueDate || null]
        );

        return res.status(201).json({
            id: result.insertId,
            task: task,
            status: 'pending',
            message: 'Todo created successfully'
        });

    } catch (error) {
        console.error('Create todo error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Update todo status
router.put('/todos/:id', verifyToken, async (req, res) => {
    try {
        const { status } = req.body;
        const todoId = req.params.id;

        if (!['pending', 'completed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        // Verify ownership
        const [todos] = await pool.query(
            'SELECT user_id FROM todos WHERE id = ?',
            [todoId]
        );

        if (todos.length === 0 || todos[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await pool.query(
            'UPDATE todos SET status = ? WHERE id = ?',
            [status, todoId]
        );

        return res.status(200).json({ message: 'Todo updated successfully' });

    } catch (error) {
        console.error('Update todo error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Delete todo
router.delete('/todos/:id', verifyToken, async (req, res) => {
    try {
        const todoId = req.params.id;

        // Verify ownership
        const [todos] = await pool.query(
            'SELECT user_id FROM todos WHERE id = ?',
            [todoId]
        );

        if (todos.length === 0 || todos[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await pool.query('DELETE FROM todos WHERE id = ?', [todoId]);

        return res.status(200).json({ message: 'Todo deleted successfully' });

    } catch (error) {
        console.error('Delete todo error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

// ===== STUDY SCHEDULE =====

// Get study schedule
router.get('/schedule', verifyToken, async (req, res) => {
    try {
        const [schedule] = await pool.query(
            'SELECT id, subject, study_date, start_time, end_time, notes FROM study_schedule WHERE user_id = ? ORDER BY study_date DESC',
            [req.user.id]
        );

        return res.status(200).json({ schedule: schedule });

    } catch (error) {
        console.error('Get schedule error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Create schedule entry
router.post('/schedule', verifyToken, async (req, res) => {
    try {
        const { subject, studyDate, startTime, endTime, notes } = req.body;

        if (!subject || !studyDate || !startTime || !endTime) {
            return res.status(400).json({ error: 'Subject, date, start time, and end time are required' });
        }

        const [result] = await pool.query(
            'INSERT INTO study_schedule (user_id, subject, study_date, start_time, end_time, notes) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, subject, studyDate, startTime, endTime, notes || null]
        );

        return res.status(201).json({
            id: result.insertId,
            message: 'Schedule created successfully'
        });

    } catch (error) {
        console.error('Create schedule error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Delete schedule entry
router.delete('/schedule/:id', verifyToken, async (req, res) => {
    try {
        const scheduleId = req.params.id;

        // Verify ownership
        const [schedules] = await pool.query(
            'SELECT user_id FROM study_schedule WHERE id = ?',
            [scheduleId]
        );

        if (schedules.length === 0 || schedules[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await pool.query('DELETE FROM study_schedule WHERE id = ?', [scheduleId]);

        return res.status(200).json({ message: 'Schedule entry deleted successfully' });

    } catch (error) {
        console.error('Delete schedule error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

// ===== DECKS =====

router.get('/decks', verifyToken, async (req, res) => {
    try {
        const [decks] = await pool.query(
            'SELECT id, name, created_at, updated_at FROM decks WHERE user_id = ? ORDER BY name ASC',
            [req.user.id]
        );
        return res.status(200).json({ decks });
    } catch (error) {
        console.error('Get decks error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

router.post('/decks', verifyToken, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Deck name is required' });
        }

        const [result] = await pool.query(
            'INSERT INTO decks (user_id, name) VALUES (?, ?)',
            [req.user.id, name]
        );
        return res.status(201).json({ id: result.insertId, name });
    } catch (error) {
        console.error('Create deck error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/decks/:id', verifyToken, async (req, res) => {
    try {
        const deckId = req.params.id;
        const [decks] = await pool.query(
            'SELECT user_id FROM decks WHERE id = ?',
            [deckId]
        );

        if (decks.length === 0 || decks[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await pool.query('DELETE FROM decks WHERE id = ?', [deckId]);
        return res.status(200).json({ message: 'Deck deleted successfully' });
    } catch (error) {
        console.error('Delete deck error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

// ===== FLASHCARDS =====

router.get('/flashcards', verifyToken, async (req, res) => {
    try {
        const deckId = req.query.deckId ? Number(req.query.deckId) : null;
        const query = deckId
            ? 'SELECT * FROM flashcards WHERE user_id = ? AND deck_id = ? ORDER BY updated_at DESC'
            : 'SELECT * FROM flashcards WHERE user_id = ? ORDER BY updated_at DESC';
        const params = deckId ? [req.user.id, deckId] : [req.user.id];
        const [flashcards] = await pool.query(query, params);
        return res.status(200).json({ flashcards });
    } catch (error) {
        console.error('Get flashcards error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

router.post('/flashcards', verifyToken, async (req, res) => {
    try {
        const { deckId, front, back } = req.body;
        if (!front || !back) {
            return res.status(400).json({ error: 'Front and back are required' });
        }

        const [result] = await pool.query(
            'INSERT INTO flashcards (user_id, deck_id, front, back, next_review_at) VALUES (?, ?, ?, ?, NOW())',
            [req.user.id, deckId || null, front, back]
        );
        return res.status(201).json({ id: result.insertId, front, back });
    } catch (error) {
        console.error('Create flashcard error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

router.put('/flashcards/:id', verifyToken, async (req, res) => {
    try {
        const cardId = req.params.id;
        const { deckId, front, back, reviewCount, correctCount, ease, intervalDays, nextReviewAt, lastReviewed } = req.body;

        const [cards] = await pool.query('SELECT user_id FROM flashcards WHERE id = ?', [cardId]);
        if (cards.length === 0 || cards[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await pool.query(
            `UPDATE flashcards
             SET deck_id = ?, front = ?, back = ?, review_count = ?, correct_count = ?, ease = ?, interval_days = ?,
                 next_review_at = ?, last_reviewed = ?
             WHERE id = ?`,
            [
                deckId || null,
                front,
                back,
                reviewCount ?? 0,
                correctCount ?? 0,
                ease ?? 2.5,
                intervalDays ?? 0,
                nextReviewAt || null,
                lastReviewed || null,
                cardId
            ]
        );

        return res.status(200).json({ message: 'Flashcard updated successfully' });
    } catch (error) {
        console.error('Update flashcard error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/flashcards/:id', verifyToken, async (req, res) => {
    try {
        const cardId = req.params.id;
        const [cards] = await pool.query('SELECT user_id FROM flashcards WHERE id = ?', [cardId]);
        if (cards.length === 0 || cards[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        await pool.query('DELETE FROM flashcards WHERE id = ?', [cardId]);
        return res.status(200).json({ message: 'Flashcard deleted successfully' });
    } catch (error) {
        console.error('Delete flashcard error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

// ===== SESSIONS =====

router.get('/sessions', verifyToken, async (req, res) => {
    try {
        const sessionType = req.query.type;
        const query = sessionType
            ? 'SELECT * FROM sessions WHERE user_id = ? AND session_type = ? ORDER BY created_at DESC'
            : 'SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC';
        const params = sessionType ? [req.user.id, sessionType] : [req.user.id];
        const [sessions] = await pool.query(query, params);
        return res.status(200).json({ sessions });
    } catch (error) {
        console.error('Get sessions error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

router.post('/sessions', verifyToken, async (req, res) => {
    try {
        const { sessionType, subject, minutes, startedAt, endedAt } = req.body;
        if (!sessionType) {
            return res.status(400).json({ error: 'Session type is required' });
        }

        const [result] = await pool.query(
            'INSERT INTO sessions (user_id, session_type, subject, minutes, started_at, ended_at) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, sessionType, subject || null, minutes || 0, startedAt || null, endedAt || null]
        );
        return res.status(201).json({ id: result.insertId, sessionType });
    } catch (error) {
        console.error('Create session error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/sessions/:id', verifyToken, async (req, res) => {
    try {
        const sessionId = req.params.id;
        const [sessions] = await pool.query('SELECT user_id FROM sessions WHERE id = ?', [sessionId]);
        if (sessions.length === 0 || sessions[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        await pool.query('DELETE FROM sessions WHERE id = ?', [sessionId]);
        return res.status(200).json({ message: 'Session deleted successfully' });
    } catch (error) {
        console.error('Delete session error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
