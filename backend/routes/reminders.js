const router = require('express').Router();
const { Resend } = require('resend');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Note = require('../models/Note');

const resend = new Resend(process.env.RESEND_API_KEY);

// Save reminder settings
router.post('/settings', auth, async (req, res) => {
  try {
    const { email, frequency, enabled } = req.body;
    await User.findByIdAndUpdate(req.user.id, {
      reminderEmail: email,
      reminderFrequency: frequency,
      reminderEnabled: enabled,
    });
    res.json({ message: 'Settings saved' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save settings' });
  }
});

// Get reminder settings
router.get('/settings', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      email: user.reminderEmail || user.email,
      frequency: user.reminderFrequency || 'daily',
      enabled: user.reminderEnabled || false,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get settings' });
  }
});

// Send test reminder email
router.post('/send-test', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const notes = await Note.find({ user: req.user.id }).sort('-createdAt').limit(5);
    const toEmail = user.reminderEmail || user.email;

    const notesList = notes.map((n) =>
      `<tr style="border-bottom:1px solid #f0f0f0">
        <td style="padding:10px 12px;font-size:13px;color:#1a1a2e;font-weight:500">${n.topic}</td>
        <td style="padding:10px 12px;font-size:12px;color:#6b7280">${n.subject}</td>
        <td style="padding:10px 12px;font-size:12px;color:#6b7280">${n.quiz?.length || 0} questions</td>
        <td style="padding:10px 12px;font-size:12px;color:#6b7280">${n.flashcards?.length || 0} cards</td>
      </tr>`
    ).join('')

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F7F7FB;font-family:DM Sans,ui-sans-serif,system-ui">
  <div style="max-width:560px;margin:32px auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
    <div style="background:#534AB7;padding:28px 32px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <div style="background:rgba(255,255,255,0.2);border-radius:8px;padding:6px">
          <span style="font-size:18px">📚</span>
        </div>
        <span style="color:white;font-size:18px;font-weight:700">Study Buddy</span>
      </div>
      <h1 style="color:white;font-size:22px;font-weight:700;margin:0">Time to review, ${user.name?.split(' ')[0] || 'Student'}! 👋</h1>
      <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:6px 0 0">Your study reminder is here. Keep your streak going!</p>
    </div>
    <div style="padding:28px 32px">
      <p style="font-size:14px;color:#4b5563;margin:0 0 20px">You have <strong>${notes.length} topic${notes.length !== 1 ? 's' : ''}</strong> ready for review.</p>
      <div style="border:1px solid #f0f0f0;border-radius:12px;overflow:hidden;margin-bottom:24px">
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#f9f9ff">
              <th style="padding:10px 12px;text-align:left;font-size:11px;color:#9ca3af;text-transform:uppercase">Topic</th>
              <th style="padding:10px 12px;text-align:left;font-size:11px;color:#9ca3af;text-transform:uppercase">Subject</th>
              <th style="padding:10px 12px;text-align:left;font-size:11px;color:#9ca3af;text-transform:uppercase">Quiz</th>
              <th style="padding:10px 12px;text-align:left;font-size:11px;color:#9ca3af;text-transform:uppercase">Cards</th>
            </tr>
          </thead>
          <tbody>${notesList}</tbody>
        </table>
      </div>
      <div style="text-align:center;margin-bottom:24px">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="display:inline-block;background:#534AB7;color:white;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600">
          Start Studying Now →
        </a>
      </div>
      <div style="background:#EEEDFE;border-radius:12px;padding:16px 20px">
        <p style="font-size:13px;font-weight:600;color:#3C3489;margin:0 0 6px">💡 Study tip of the day</p>
        <p style="font-size:13px;color:#534AB7;margin:0">Use the flashcard "Got it ✓" feature to track mastered cards. Review ones marked "Still learning" first!</p>
      </div>
    </div>
    <div style="padding:16px 32px;background:#f9f9ff;border-top:1px solid #f0f0f0">
      <p style="font-size:12px;color:#9ca3af;margin:0;text-align:center">Study Buddy · AI Learning Assistant</p>
    </div>
  </div>
</body>
</html>`

    const { data, error } = await resend.emails.send({
      from: 'Study Buddy <onboarding@resend.dev>',
      to: toEmail,
      subject: `📚 Study reminder — ${notes.length} topic${notes.length !== 1 ? 's' : ''} to review today`,
      html,
    })

    if (error) {
      console.error('Resend error:', error)
      return res.status(500).json({ message: 'Failed to send email: ' + error.message })
    }

    res.json({ message: ` email sent to ${toEmail}` })
  } catch (err) {
    console.error('Email error:', err.message)
    res.status(500).json({ message: 'Failed to send email: '  })
  }
});

module.exports = router;
