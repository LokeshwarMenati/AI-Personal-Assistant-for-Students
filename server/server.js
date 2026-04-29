require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const fs = require('fs/promises');
const multer = require('multer');
const nodemailer = require('nodemailer');
const { PDFParse } = require('pdf-parse');
const path = require('path');
const { Server } = require('socket.io');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const chatRoutes = require('./routes/chat');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});
const PORT = process.env.PORT || 3001;
const MAIL_USER = process.env.MAIL_USER || '';
const MAIL_APP_PASSWORD = process.env.MAIL_APP_PASSWORD || '';
const EMAIL_ALERT_TO = process.env.EMAIL_ALERT_TO || '';

const mailTransporter = MAIL_USER && MAIL_APP_PASSWORD
    ? nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: MAIL_USER,
            pass: MAIL_APP_PASSWORD
        }
    })
    : null;

const uploadsDir = path.join(__dirname, '../uploads');
const upload = multer({
    dest: uploadsDir,
    limits: { fileSize: 5 * 1024 * 1024 }
});

async function sendEmailAlert(message, recipientEmail = '') {
    if (!mailTransporter) {
        return { sent: false, reason: 'Mail transporter is not configured' };
    }

    const to = String(recipientEmail || EMAIL_ALERT_TO || '').trim();
    if (!to) {
        return { sent: false, reason: 'No recipient configured' };
    }

    await mailTransporter.sendMail({
        from: MAIL_USER,
        to,
        subject: 'New StudyBuddy Message',
        text: `New message received:\n\n${message}`
    });

    return { sent: true };
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

    if (hasAny(text, ['study plan', 'timetable', 'schedule', 'exam prep', 'prepare for exam'])) {
        return [
            'Here is a simple study plan:',
            '1. List the chapters or topics you need to cover.',
            '2. Mark each topic as easy, medium, or hard.',
            '3. Study the hard topics first in 25-40 minute focus blocks.',
            '4. After each topic, solve 3-5 practice questions.',
            '5. End the day with a 10-minute recap and flashcards.',
            '',
            'Send me your subject and exam date, and I can make this more specific.'
        ].join('\n');
    }

    if (hasAny(text, ['photosynthesis'])) {
        return [
            'Photosynthesis is how green plants make food.',
            '',
            'Simple idea:',
            'Plants use sunlight, carbon dioxide from air, and water from soil to make glucose. Oxygen is released as a byproduct.',
            '',
            'Formula:',
            'Carbon dioxide + water + light energy -> glucose + oxygen',
            '',
            'Key parts:',
            '1. Chlorophyll captures sunlight.',
            '2. Leaves take in carbon dioxide through stomata.',
            '3. Roots absorb water.',
            '4. Glucose gives the plant energy and helps it grow.'
        ].join('\n');
    }

    if (hasAny(text, ['calculus', 'derivative', 'integration', 'integral'])) {
        return [
            'Calculus studies change and accumulation.',
            '',
            'Derivatives answer: how fast is something changing?',
            'Example: if position changes over time, derivative gives speed.',
            '',
            'Integrals answer: how much has accumulated?',
            'Example: if speed changes over time, integral gives distance.',
            '',
            'A good way to start is to master limits, then derivatives, then integrals.'
        ].join('\n');
    }

    if (hasAny(text, ['algebra', 'equation', 'linear equation'])) {
        return [
            'For algebra equations, the goal is to isolate the unknown.',
            '',
            'Method:',
            '1. Simplify both sides.',
            '2. Move variable terms to one side.',
            '3. Move constants to the other side.',
            '4. Divide or multiply to get the variable alone.',
            '',
            'Example: 2x + 3 = 11',
            '2x = 8',
            'x = 4'
        ].join('\n');
    }

    if (hasAny(text, ['physics', 'force', 'motion', 'newton'])) {
        return [
            'Physics explains how matter and energy behave.',
            '',
            'For motion problems, start with:',
            '1. What is given?',
            '2. What must be found?',
            '3. Which formula connects them?',
            '',
            'Newton\'s second law is one of the most useful formulas:',
            'Force = mass x acceleration',
            'F = ma'
        ].join('\n');
    }

    if (hasAny(text, ['chemistry', 'atom', 'molecule', 'reaction'])) {
        return [
            'Chemistry is the study of matter and how substances change.',
            '',
            'Core ideas:',
            '1. Atoms are the building blocks of matter.',
            '2. Molecules form when atoms bond.',
            '3. Chemical reactions rearrange atoms into new substances.',
            '4. Equations must be balanced because atoms are conserved.'
        ].join('\n');
    }

    if (hasAny(text, ['biology', 'cell', 'organism'])) {
        return [
            'Biology studies living things.',
            '',
            'A strong foundation starts with cells:',
            '1. The cell membrane controls what enters and leaves.',
            '2. The nucleus stores genetic information.',
            '3. Mitochondria release energy from food.',
            '4. Ribosomes make proteins.'
        ].join('\n');
    }

    if (hasAny(text, ['history', 'war', 'revolution', 'civilization'])) {
        return [
            'For history, use this structure:',
            '1. Background: what was happening before?',
            '2. Causes: why did the event happen?',
            '3. Main events: what happened in order?',
            '4. Effects: what changed afterward?',
            '',
            'Send me the exact event or chapter name and I will summarize it clearly.'
        ].join('\n');
    }

    if (hasAny(text, ['english', 'essay', 'grammar', 'writing', 'letter'])) {
        return [
            'For English writing, use a clear structure:',
            '1. Introduction: state the main idea.',
            '2. Body paragraphs: one idea per paragraph with examples.',
            '3. Conclusion: restate the main point briefly.',
            '',
            'For grammar, send the sentence and I can correct it with an explanation.'
        ].join('\n');
    }

    if (hasAny(text, ['help', 'what can you do'])) {
        return [
            'I can help with:',
            '1. Explaining academic concepts.',
            '2. Creating study plans.',
            '3. Summarizing notes or PDFs.',
            '4. Making quiz questions.',
            '5. Breaking homework problems into steps.',
            '',
            'Ask a specific question like: "Explain photosynthesis" or "Make a study plan for math."'
        ].join('\n');
    }

    return [
        `Here is a focused way to study this: "${message}"`,
        '',
        '1. Identify the key terms in the question.',
        '2. Write what you already know about each term.',
        '3. Look for the formula, rule, event, or definition that connects them.',
        '4. Try one example, then check your answer.',
        '',
        'For a better answer, include the subject and chapter name, or paste the exact problem.'
    ].join('\n');
}

function hasAny(text, keywords) {
    return keywords.some(keyword => text.includes(keyword));
}

function generateNotesOutline(topic, tone = 'summary') {
    const safeTopic = String(topic || 'Topic');
    if (tone === 'exam') {
        return [
            `Topic: ${safeTopic}`,
            'Key points:',
            '- Define core terms and formulas.',
            '- Note common pitfalls and exam traps.',
            '- Practice with 3 sample questions.',
            'Quick questions:',
            `1) Explain ${safeTopic} in 3 steps.`,
            `2) List two real-world examples of ${safeTopic}.`
        ].join('\n');
    }
    if (tone === 'flash') {
        return [
            `Topic: ${safeTopic}`,
            'Flashcard prompts:',
            `- What is ${safeTopic}?`,
            `- Why does ${safeTopic} matter?`,
            `- Give an example of ${safeTopic}.`,
            'Summary:',
            `Write a 2-sentence summary of ${safeTopic}.`
        ].join('\n');
    }
    return [
        `Topic: ${safeTopic}`,
        'Summary:',
        '- 4-6 bullet overview.',
        '- Key definitions and formulas.',
        '- One example or use case.',
        'Questions:',
        `1) What is the main idea behind ${safeTopic}?`,
        `2) How would you teach ${safeTopic} to a friend?`
    ].join('\n');
}


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);

app.post('/upload-pdf', upload.single('pdf'), async (req, res) => {
    const filePath = req.file?.path;

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'PDF file is required' });
        }

        if (req.file.mimetype !== 'application/pdf') {
            return res.status(400).json({ error: 'Only PDF files are allowed' });
        }

        const dataBuffer = await fs.readFile(filePath);
        const parser = new PDFParse({ data: dataBuffer });
        let pdfData;
        try {
            pdfData = await parser.getText();
        } finally {
            await parser.destroy().catch(() => {});
        }
        const rawText = String(pdfData?.text || '').replace(/\s+/g, ' ').trim();

        if (!rawText) {
            return res.status(200).json({ summary: 'No content found in PDF.' });
        }

        const summary = rawText.split('. ').slice(0, 5).join('. ').trim();
        return res.status(200).json({
            summary: summary || 'No content found in PDF.'
        });
    } catch (error) {
        console.error('PDF processing error:', error.message || error);
        return res.status(500).json({ error: 'Failed to process PDF' });
    } finally {
        if (filePath) {
            await fs.unlink(filePath).catch(() => {});
        }
    }
});

app.post('/api/chat/send', async (req, res) => {
    try {
        const message = String(req.body?.message || '').trim();
        const email = String(req.body?.email || '').trim();
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        let emailStatus = { sent: false, reason: 'Not attempted' };
        try {
            emailStatus = await sendEmailAlert(message, email);
        } catch (mailError) {
            console.error('Email alert error:', mailError.message);
            emailStatus = { sent: false, reason: mailError.message };
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(200).json({
                reply: generateMockAIResponse(message),
                source: 'local',
                emailAlert: emailStatus
            });
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: [
                                'You are StudyBuddy AI, a helpful academic assistant for students.',
                                'Give clear, accurate, step-by-step explanations.',
                                'Keep answers concise unless the student asks for detail.',
                                'Use simple examples when helpful.',
                                '',
                                `Student question: ${message}`
                            ].join('\n')
                        }]
                    }]
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API error:', errorText);
            return res.status(200).json({
                reply: generateMockAIResponse(message),
                source: 'local',
                warning: 'Gemini API failed; used local study response instead.',
                emailAlert: emailStatus
            });
        }

        const data = await response.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!reply) {
            return res.status(200).json({
                reply: generateMockAIResponse(message),
                source: 'local',
                warning: 'Gemini returned an empty response; used local study response instead.',
                emailAlert: emailStatus
            });
        }

        return res.status(200).json({ reply, source: 'gemini', emailAlert: emailStatus });
    } catch (error) {
        console.error('Gemini API error:', error);
        return res.status(200).json({
            reply: generateMockAIResponse(req.body?.message),
            source: 'local',
            warning: 'AI request failed; used local study response instead.'
        });
    }
});

app.post('/api/notes/generate', async (req, res) => {
    try {
        const topic = String(req.body?.topic || '').trim();
        const tone = String(req.body?.tone || 'summary').trim();
        if (!topic) {
            return res.status(400).json({ error: 'Topic is required' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(200).json({ notes: generateNotesOutline(topic, tone), source: 'local' });
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: [
                                'You are an academic note-taking assistant.',
                                'Generate concise study notes with bullet points, a short summary, and 2 key questions.',
                                `Topic: ${topic}`,
                                `Tone: ${tone}`
                            ].join('\n')
                        }]
                    }]
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini notes error:', errorText);
            return res.status(200).json({ notes: generateNotesOutline(topic, tone), source: 'local' });
        }

        const data = await response.json();
        const notes = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        return res.status(200).json({ notes: notes || generateNotesOutline(topic, tone), source: 'gemini' });
    } catch (error) {
        console.error('Notes generation error:', error);
        return res.status(200).json({ notes: generateNotesOutline(req.body?.topic, req.body?.tone), source: 'local' });
    }
});

// Compatibility route for simple frontend clients using "/chat".
app.post('/chat', async (req, res) => {
    const message = String(req.body?.message || '').trim();
    const email = String(req.body?.email || '').trim();
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    let emailStatus = { sent: false, reason: 'Not attempted' };
    try {
        emailStatus = await sendEmailAlert(message, email);
    } catch (mailError) {
        console.error('Email alert error:', mailError.message);
        emailStatus = { sent: false, reason: mailError.message };
    }

    return res.status(200).json({
        reply: generateMockAIResponse(message),
        emailAlert: emailStatus
    });
});
// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

let sharedNoteText = '';
let boardState = [];

io.on('connection', (socket) => {
    socket.on('joinRoom', ({ room }) => {
        socket.join(room);
        socket.emit('sharedNote', { text: sharedNoteText });
        socket.emit('boardState', { state: boardState });
    });

    socket.on('collabMessage', ({ room, message, sender }) => {
        io.to(room).emit('collabMessage', {
            message,
            sender,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    });

    socket.on('sharedNote', ({ room, text }) => {
        sharedNoteText = String(text || '');
        socket.to(room).emit('sharedNote', { text: sharedNoteText });
    });

    socket.on('boardState', ({ room, state }) => {
        boardState = Array.isArray(state) ? state : boardState;
        socket.to(room).emit('boardState', { state: boardState });
    });
});

server.listen(PORT, () => {
    console.log(`
    ╔════════════════════════════════════════╗
    ║   AI Personal Assistant for Students   ║
    ║          Server Started                ║
    ║         Port: ${PORT}                    ║
    ║    http://localhost:${PORT}             ║
    ╚════════════════════════════════════════╝
    `);
});

module.exports = app;
