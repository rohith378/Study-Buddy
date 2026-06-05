const router = require('express').Router();
const Groq = require('groq-sdk');
const auth = require('../middleware/auth');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function cleanAndParseJSON(raw) {
  // Remove markdown fences
  raw = raw.replace(/```json/g, '').replace(/```/g, '').trim()

  // Extract JSON object
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON found in response')
  raw = raw.slice(start, end + 1)

  // Remove bad control characters (newlines/tabs inside strings)
  raw = raw
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ') // remove control chars except \n \r \t
    .replace(/\n/g, ' ')   // replace newlines with space
    .replace(/\r/g, ' ')   // replace carriage returns
    .replace(/\t/g, ' ')   // replace tabs
    .replace(/ +/g, ' ')   // collapse multiple spaces

  try {
    return JSON.parse(raw)
  } catch (e) {
    // Last resort: try to fix unescaped quotes inside strings
    raw = raw.replace(/(?<=: ")(.*?)(?="[,\}])/gs, m => m.replace(/"/g, '\\"'))
    return JSON.parse(raw)
  }
}

async function callGroq(prompt) {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
    max_tokens: 4000,
  })
  const raw = completion.choices[0].message.content
  return cleanAndParseJSON(raw)
}

router.post('/answers', auth, async (req, res) => {
  try {
    const { text, type } = req.body
    if (!text?.trim()) return res.status(400).json({ message: 'Text is required' })
    if (!type) return res.status(400).json({ message: 'Type is required' })

    const answerGuide = {
      '2marks':  'Write a precise answer in 4-6 sentences. Cover the definition and key points. No headings needed.',
      '5marks':  'Write a structured answer with a brief intro, then 3-4 key points each in 2-3 sentences, then a short conclusion.',
      '10marks': 'Write a detailed answer with introduction, then 6-8 headed points each thoroughly explained with examples, then a conclusion.',
    }

    const markLabels = {
      '2marks':  '2M or 2 marks',
      '5marks':  '5M or 5 marks or 4M or 6M',
      '10marks': '10M or 10 marks',
    }

    const isShort = type === '2marks'

    const prompt = `You are an exam answer writer for engineering students. Return ONLY a JSON object, nothing else.

Task: From the question bank below, extract all ${markLabels[type]} questions and write answers.
Answer style: ${answerGuide[type]}
Rules:
- Do NOT repeat the question in the answer
- Keep answers on one line (no line breaks inside answer text)
- Extract questions from ALL units
- For sub-parts (a)(b), write one combined answer

JSON format to return (no markdown, no explanation, just the JSON):
{"topic":"subject name","type":"${type}","questions":[{"sno":1,"unit":"Unit 1","question":"question text","marks":"2M",${isShort ? '"answer":"answer text here"' : '"answer":{"introduction":"intro text","points":[{"heading":"point 1","explanation":"explanation text"}],"conclusion":"conclusion text"}'}}]}

QUESTION BANK:
${text.slice(0, 6000)}`

    const parsed = await callGroq(prompt)

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      return res.status(500).json({ message: 'AI returned unexpected format. Please try again.' })
    }

    res.json(parsed)
  } catch (err) {
    console.error('QnA error:', err.message)
    res.status(500).json({ message: 'Generation failed: ' + err.message })
  }
})

module.exports = router;
