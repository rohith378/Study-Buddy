const router = require('express').Router();
const Groq = require('groq-sdk');
const auth = require('../middleware/auth');
const Note = require('../models/Note');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post('/ask', auth, async (req, res) => {
  try {
    const { question, context, history = [] } = req.body;
    if (!question?.trim()) return res.status(400).json({ message: 'Question is required' });

    // Fetch user's latest notes for context
    const notes = await Note.find({ user: req.user.id })
      .sort('-createdAt')
      .limit(5)
      .select('topic subject summary flashcards quiz');

    const notesContext = notes.length > 0
      ? notes.map(n =>
          `Topic: ${n.topic} (${n.subject})\n` +
          `Key points: ${n.summary?.slice(0, 3).join('. ')}\n` +
          `Flashcard terms: ${n.flashcards?.slice(0, 5).map(f => f.term).join(', ')}`
        ).join('\n\n')
      : 'No notes uploaded yet.';

    const systemPrompt = `You are Study Buddy AI, a helpful and friendly study assistant for engineering students.

You have access to the student's uploaded notes:
${notesContext}

Guidelines:
- Answer clearly and concisely (3-6 sentences for most questions)
- If the question relates to their notes, use that context
- For general study questions, give accurate educational answers
- Be encouraging and supportive
- If asked for a quiz question, give one MCQ with 4 options and the answer
- Use simple language suitable for students
- Never make up facts`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6),
      { role: 'user', content: question }
    ]

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.5,
      max_tokens: 500,
    })

    const answer = completion.choices[0].message.content.trim()
    res.json({ answer })
  } catch (err) {
    console.error('Assistant error:', err.message)
    res.status(500).json({ message: 'Failed to get answer', error: err.message })
  }
});

module.exports = router;
