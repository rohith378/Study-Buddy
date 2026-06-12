import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AIAssistant from './AIAssistant'

const navMain = [
  { to: '/', label: 'Dashboard', icon: GridIcon },
  { to: '/upload', label: 'Upload notes', icon: FileIcon },
]
const navTools = [
  { to: '/summary',    label: 'Summary',    icon: ListIcon },
  { to: '/quiz',       label: 'Quiz',        icon: QuizIcon },
  { to: '/flashcards', label: 'Flashcards',  icon: CardIcon },
  { to: '/progress',   label: 'Progress',    icon: ChartIcon },
]
const navExam = [
  { to: '/exam-prep', label: 'Exam Prep', icon: ExamIcon, badge: 'New', badgeColor: 'bg-amber-50 text-amber-700' },
]
const navMore = [
  { to: '/search',    label: 'Search Topics',   icon: SearchIcon },
  { to: '/reminders', label: 'Email Reminders', icon: BellIcon },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'SB'
  const closeSidebar = () => setSidebarOpen(false)

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><rect x="2" y="2" width="12" height="12" rx="3" fill="#534AB7"/><path d="M5 6h6M5 9h4" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/></svg>
        </div>
        <div>
          <p className="font-display text-sm font-semibold leading-none">Study Buddy</p>
          <p className="text-xs text-gray-400 mt-0.5">AI learning assistant</p>
        </div>
      </div>
      <nav className="flex-1 px-2 py-3 overflow-auto space-y-0.5">
        <p className="text-[10px] uppercase tracking-widest text-gray-400 px-2 pb-1">Main</p>
        {navMain.map(n => <SideItem key={n.to} {...n} onClick={closeSidebar} />)}
        <p className="text-[10px] uppercase tracking-widest text-gray-400 px-2 pt-3 pb-1">Tools</p>
        {navTools.map(n => <SideItem key={n.to} {...n} onClick={closeSidebar} />)}
        <p className="text-[10px] uppercase tracking-widest text-gray-400 px-2 pt-3 pb-1">Exam Prep</p>
        {navExam.map(n => <SideItem key={n.to} {...n} onClick={closeSidebar} />)}
        <p className="text-[10px] uppercase tracking-widest text-gray-400 px-2 pt-3 pb-1">More</p>
        {navMore.map(n => <SideItem key={n.to} {...n} onClick={closeSidebar} />)}
      </nav>
      <div className="px-3 py-3 border-t border-gray-100 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-xs font-semibold text-primary-800 flex-shrink-0">{initials}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{user?.name || 'Student'}</p>
          <p className="text-xs text-gray-400">student</p>
        </div>
        <button onClick={() => { logout(); navigate('/login') }} className="text-gray-300 hover:text-gray-500 transition-colors" title="Logout">
          <LogoutIcon />
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[210px] flex-shrink-0 bg-white border-r border-gray-100 flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={closeSidebar} />
          <aside className="absolute left-0 top-0 bottom-0 w-[230px] bg-white flex flex-col z-50 shadow-xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5"><path d="M3 5h14M3 10h14M3 15h14" stroke="#374151" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary-50 flex items-center justify-center">
              <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5"><rect x="2" y="2" width="12" height="12" rx="3" fill="#534AB7"/><path d="M5 6h6M5 9h4" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/></svg>
            </div>
            <span className="font-display text-sm font-semibold">Study Buddy</span>
          </div>
          <button onClick={() => navigate('/search')} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5"><circle cx="9" cy="9" r="6" stroke="#374151" strokeWidth="1.5"/><path d="M15 15l-2.5-2.5" stroke="#374151" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        <main className="flex-1 overflow-auto">
          <div className="page-enter"><Outlet /></div>
        </main>
      </div>

      {/* AI Assistant — floating on every page */}
      <AIAssistant />
    </div>
  )
}

function SideItem({ to, label, icon: Icon, badge, badgeColor, onClick }) {
  return (
    <NavLink to={to} end={to === '/'} onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all
        ${isActive ? 'bg-primary-50 text-primary-800 font-medium' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}>
      <span className="w-4 h-4 flex-shrink-0"><Icon /></span>
      <span className="flex-1">{label}</span>
      {badge && <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${badgeColor || 'bg-primary-50 text-primary-800'}`}>{badge}</span>}
    </NavLink>
  )
}

function GridIcon()   { return <svg viewBox="0 0 15 15" fill="none" className="w-full h-full"><rect x="1" y="1" width="5.5" height="5.5" rx="1.5" fill="currentColor" opacity=".5"/><rect x="8.5" y="1" width="5.5" height="5.5" rx="1.5" fill="currentColor"/><rect x="1" y="8.5" width="5.5" height="5.5" rx="1.5" fill="currentColor"/><rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1.5" fill="currentColor" opacity=".5"/></svg> }
function FileIcon()   { return <svg viewBox="0 0 15 15" fill="none" className="w-full h-full"><rect x="2" y="1" width="11" height="13" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M5 5h5M5 8h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> }
function ListIcon()   { return <svg viewBox="0 0 15 15" fill="none" className="w-full h-full"><path d="M2 3h11M2 6h8M2 9h10M2 12h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> }
function QuizIcon()   { return <svg viewBox="0 0 15 15" fill="none" className="w-full h-full"><circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.2"/><path d="M7.5 5.5c0-1 .8-1.5 1.5-1 .6.4.7 1.3 0 1.8L7.5 7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="7.5" cy="10" r=".7" fill="currentColor"/></svg> }
function CardIcon()   { return <svg viewBox="0 0 15 15" fill="none" className="w-full h-full"><rect x="1" y="3" width="13" height="9" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M5 7h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> }
function ChartIcon()  { return <svg viewBox="0 0 15 15" fill="none" className="w-full h-full"><path d="M2 12L5 8l3 2 3-4 2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ExamIcon()   { return <svg viewBox="0 0 15 15" fill="none" className="w-full h-full"><rect x="1" y="1" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M4 5h7M4 8h5M4 11h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> }
function SearchIcon() { return <svg viewBox="0 0 15 15" fill="none" className="w-full h-full"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.2"/><path d="M11 11l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> }
function BellIcon()   { return <svg viewBox="0 0 15 15" fill="none" className="w-full h-full"><path d="M7.5 1.5a5 5 0 015 5v3l1 1.5H1.5L2.5 9.5v-3a5 5 0 015-5z" stroke="currentColor" strokeWidth="1.2"/><path d="M6 12.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.2"/></svg> }
function LogoutIcon() { return <svg viewBox="0 0 15 15" fill="none" className="w-4 h-4"><path d="M6 2H3a1 1 0 00-1 1v9a1 1 0 001 1h3M10 10l3-3-3-3M13 7H6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
