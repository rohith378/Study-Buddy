const router = require('express').Router();
const Groq = require('groq-sdk');
const multer = require('multer');
const auth = require('../middleware/auth');
const Note = require('../models/Note');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Multer — store PDF in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

// Helper: call Groq and parse JSON
async function generateWithGroq(text) {
  const prompt = `You are a study assistant. Given the following notes, return ONLY valid JSON (no markdown, no extra text) with this structure:
{
  "topic": "<short topic name, 2-4 words>",
  "summary": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "quiz": [
    {"question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "correct": 0},
    {"question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "correct": 2},
    {"question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "correct": 1},
    {"question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "correct": 3},
    {"question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "correct": 0}
  ],
  "flashcards": [
    {"term": "...", "definition": "..."},
    {"term": "...", "definition": "..."},
    {"term": "...", "definition": "..."},
    {"term": "...", "definition": "..."},
    {"term": "...", "definition": "..."}
  ]
}

Notes:
${text.slice(0, 6000)}`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
  });

  const raw = completion.choices[0].message.content.replace(/```json|```/g, '').trim();
  return JSON.parse(raw);
}

// POST /api/notes/generate — paste text
router.post('/generate', auth, async (req, res) => {
  try {
    const { text, subject = 'General' } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Notes text is required' });
    const parsed = await generateWithGroq(text);
    const note = await Note.create({
      user: req.user.id,
      topic: parsed.topic || 'My Notes',
      subject,
      rawText: text,
      summary: parsed.summary || [],
      quiz: parsed.quiz || [],
      flashcards: parsed.flashcards || [],
    });
    res.status(201).json(note);
  } catch (err) {
    console.error('Generate error:', err.message);
    res.status(500).json({ message: 'Generation failed', error: err.message });
  }
});

// POST /api/notes/upload-pdf — PDF file upload
router.post('/upload-pdf', auth, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No PDF file uploaded' });

    console.log('PDF received:', req.file.originalname, req.file.size, 'bytes');

    // Dynamically require pdf-parse to avoid startup crash
    const pdfParse = require('pdf-parse');
    const pdfData = await pdfParse(req.file.buffer);
    const text = pdfData.text?.trim();

    console.log('Extracted text length:', text?.length);

    if (!text || text.length < 30) {
      return res.status(400).json({ message: 'Could not extract text from this PDF. Try pasting the text manually instead.' });
    }

    const subject = req.body.subject || 'General';
    const parsed = await generateWithGroq(text);

    const note = await Note.create({
      user: req.user.id,
      topic: parsed.topic || req.file.originalname.replace('.pdf', ''),
      subject,
      rawText: text,
      summary: parsed.summary || [],
      quiz: parsed.quiz || [],
      flashcards: parsed.flashcards || [],
    });

    res.status(201).json(note);
  } catch (err) {
    console.error('PDF upload error:', err.message);
    res.status(500).json({ message: 'PDF processing failed', error: err.message });
  }
});

// GET /api/notes
router.get('/', auth, async (req, res) => {
  const notes = await Note.find({ user: req.user.id }).sort('-createdAt').select('-rawText');
  res.json(notes);
});

// GET /api/notes/:id
router.get('/:id', auth, async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, user: req.user.id });
  if (!note) return res.status(404).json({ message: 'Note not found' });
  res.json(note);
});

// DELETE /api/notes/:id
router.delete('/:id', auth, async (req, res) => {
  await Note.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  res.json({ message: 'Deleted' });
});

module.exports = router;
