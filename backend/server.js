require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes      = require('./routes/auth');
const notesRoutes     = require('./routes/notes');
const qnaRoutes       = require('./routes/qna');
const remindersRoutes = require('./routes/reminders');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.use('/api/auth',      authRoutes);
app.use('/api/notes',     notesRoutes);
app.use('/api/qna',       qnaRoutes);
app.use('/api/reminders', remindersRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));
app.use((req, res, next) => { res.setTimeout(120000); next(); });

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    const server = app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    );
    server.timeout = 120000;
  })
  .catch(err => { console.error(err); process.exit(1); });
