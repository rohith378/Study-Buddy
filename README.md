# Study Buddy — AI-Powered Learning Assistant

> Final Year Project | Vite + React + Tailwind + Node.js + MongoDB + Claude AI

## Features
- Upload notes (paste text or PDF drag & drop)
- AI-generated summaries, quiz questions, and flashcards
- Spaced repetition revision scheduler
- Progress dashboard with analytics
- JWT-based authentication (register / login)

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | Vite, React 18, Tailwind CSS, React Router v6 |
| Backend | Node.js, Express |
| Database | MongoDB Atlas (free tier) |
| AI Engine | Claude API (Anthropic) |
| Auth | JWT + bcryptjs |
| Hosting | Vercel (frontend) + Render (backend) |

---

## Quick Start

### 1. Backend
```bash
cd backend
npm install
cp .env                   # fill in your keys
npm run dev               # runs on http://localhost:5000
```

### 2. Frontend (new terminal)
```bash
cd frontend
npm install
npm run dev               # runs on http://localhost:3000
```

Open http://localhost:3000 — the Vite dev server proxies `/api` calls to the backend automatically.

---

## Environment Variables (`backend/.env`)
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/studybuddy
JWT_SECRET=your_secret_here
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Project Structure
```
study-buddy/
├── frontend/                   ← Vite + React
│   ├── index.html
│   ├── vite.config.js          ← proxy /api → localhost:5000
│   ├── tailwind.config.js
│   └── src/
│       ├── main.jsx            ← entry point
│       ├── App.jsx             ← routes
│       ├── index.css
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Upload.jsx
│       │   ├── Summary.jsx
│       │   ├── Quiz.jsx
│       │   ├── Flashcards.jsx
│       │   └── Progress.jsx
│       ├── components/
│       │   └── Layout.jsx      ← sidebar + nav
│       ├── context/
│       │   └── AuthContext.jsx ← JWT auth state
│       └── utils/
│           └── api.js          ← axios client
└── backend/                    ← Node.js + Express
    ├── server.js
    ├── .env.example
    ├── routes/
    │   ├── auth.js             ← register / login
    │   └── notes.js            ← AI generation + CRUD
    ├── models/
    │   ├── User.js
    │   └── Note.js
    └── middleware/
        └── auth.js             ← JWT verify
```

---

## API Endpoints
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | — | Register new user |
| POST | /api/auth/login | — | Login |
| POST | /api/notes/generate | ✓ | Generate AI content from notes |
| GET | /api/notes | ✓ | List all user notes |
| GET | /api/notes/:id | ✓ | Get single note |
| DELETE | /api/notes/:id | ✓ | Delete note |

---

## Deployment
- **Frontend** → [Vercel](https://vercel.com): connect GitHub, build command `npm run build`, output dir `dist`
- **Backend** → [Render](https://render.com): add env vars in dashboard, start command `node server.js`
- **Database** → [MongoDB Atlas](https://cloud.mongodb.com): free M0 cluster
- **AI API** → [console.anthropic.com](https://console.anthropic.com)
