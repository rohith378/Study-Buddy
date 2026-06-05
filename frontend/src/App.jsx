import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import Summary from './pages/Summary'
import Quiz from './pages/Quiz'
import Flashcards from './pages/Flashcards'
import Progress from './pages/Progress'
import ExamPrep from './pages/ExamPrep'
import Search from './pages/Search'
import Reminders from './pages/Reminders'
import Login from './pages/Login'
import { AuthProvider, useAuth } from './context/AuthContext'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="upload" element={<Upload />} />
            <Route path="summary/:id?" element={<Summary />} />
            <Route path="quiz/:id?" element={<Quiz />} />
            <Route path="flashcards/:id?" element={<Flashcards />} />
            <Route path="progress" element={<Progress />} />
            <Route path="exam-prep" element={<ExamPrep />} />
            <Route path="search" element={<Search />} />
            <Route path="reminders" element={<Reminders />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
