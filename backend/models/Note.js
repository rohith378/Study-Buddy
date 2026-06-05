const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic:   { type: String, default: 'My Notes' },
  subject: { type: String, default: 'General' },
  rawText: { type: String, required: true },
  summary: [String],
  quiz: [{
    question: String,
    options:  [String],
    correct:  Number,
  }],
  flashcards: [{
    term:       String,
    definition: String,
  }],
  // Spaced repetition: next review date per flashcard index
  nextReview: { type: Map, of: Date, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);
