import { useState, useCallback, useEffect } from 'react'
import { IconClock, IconBooks, IconChartBar, IconSettings, IconShield } from '@tabler/icons-react'
import TimerTab from './components/TimerTab'
import BookshelfTab from './components/BookshelfTab'
import StatsTab from './components/StatsTab'
import SettingsTab from './components/SettingsTab'
import AdminTab from './components/AdminTab'
import SyncIndicator from './components/SyncIndicator'
import TutorialOverlay, { shouldShowTutorial } from './components/TutorialOverlay'
import AuthModal from './auth/AuthModal'
import { AuthProvider, useAuth } from './auth/AuthContext'
import type { Book, Session } from './types'
import { getBooks, saveBook, saveAllBooks, deleteBook, getSessions, saveSession, getSuggestBooks } from './lib/db'
import { setAdminBooksCache } from './suggestBooks'

type Tab = 'timer' | 'bookshelf' | 'stats' | 'settings' | 'admin'
export type Theme = 'light' | 'dark' | 'system'
export type SyncState = 'idle' | 'syncing' | 'synced' | 'offline'

function AppInner() {
  const { user, role, loading: authLoading, bannedError, clearBannedError } = useAuth()
  const [tab, setTab] = useState<Tab>('timer')
  const [books, setBooks] = useState<Book[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [theme, setTheme] = useState<Theme>(() =>
    (localStorage.getItem('pr_theme') as Theme) ?? 'system'
  )
  const [syncState, setSyncState] = useState<SyncState>('idle')
  const [timerRunning, setTimerRunning] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [splashDone, setSplashDone] = useState(false)
  const [splashVisible, setSplashVisible] = useState(true)
  const [showTutorial, setShowTutorial] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), 1000)
    return () => clearTimeout(t)
  }, [])

  // ローディング完了 & 5秒経過したらフェードアウト開始 → 600ms後に非表示
  useEffect(() => {
    if (!authLoading && dataLoaded && splashDone) {
      const t = setTimeout(() => setSplashVisible(false), 600)
      return () => clearTimeout(t)
    }
  }, [authLoading, dataLoaded, splashDone])

  // Load data whenever auth state settles or user changes
  useEffect(() => {
    if (authLoading) return
    setSyncState('syncing')
    const timeout = setTimeout(() => {
      setSyncState('offline')
      setDataLoaded(true)
    }, 8000)
    Promise.all([getBooks(), getSessions(), getSuggestBooks()])
      .then(([b, s, sb]) => {
        clearTimeout(timeout)
        setBooks(b)
        setSessions(s)
        setAdminBooksCache(sb)
        setSyncState('synced')
        setDataLoaded(true)
        if (shouldShowTutorial()) setShowTutorial(true)
      })
      .catch(() => { clearTimeout(timeout); setSyncState('offline'); setDataLoaded(true) })
  }, [authLoading, user])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') {
      root.removeAttribute('data-theme')
    } else {
      root.setAttribute('data-theme', theme)
    }
    localStorage.setItem('pr_theme', theme)
  }, [theme])

  const withSync = useCallback(async (fn: () => Promise<void>) => {
    setSyncState('syncing')
    try {
      await fn()
      setSyncState('synced')
    } catch {
      setSyncState('offline')
    }
  }, [])

  const handleAddBook = useCallback((book: Book) => {
    setBooks(prev => [...prev, book])
    withSync(() => saveBook(book))
  }, [withSync])

  const handleUpdateBook = useCallback((updated: Book) => {
    setBooks(prev => prev.map(b => b.id === updated.id ? updated : b))
    withSync(() => saveBook(updated))
  }, [withSync])

  const handleDeleteBook = useCallback((id: string) => {
    setBooks(prev => prev.filter(b => b.id !== id))
    withSync(() => deleteBook(id))
  }, [withSync])

  const handleSessionComplete = useCallback((bookId: string, session: Session) => {
    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, sessions: b.sessions + 1 } : b))
    setSessions(prev => [...prev, session])
    withSync(async () => {
      await saveSession(session)
      const updatedBook = books.find(b => b.id === bookId)
      if (updatedBook) await saveBook({ ...updatedBook, sessions: updatedBook.sessions + 1 })
    })
  }, [withSync, books])

  const handleStatusChange = useCallback((bookId: string, status: Book['status']) => {
    setBooks(prev => {
      const updated = prev.map(b => b.id === bookId ? { ...b, status } : b)
      withSync(() => saveAllBooks(updated))
      return updated
    })
  }, [withSync])

  if (splashVisible) {
    const exiting = !authLoading && dataLoaded && splashDone
    return (
      <div className={`app-splash${exiting ? ' exiting' : ''}`}>
        <div className="app-splash-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="96" height="96">
            <rect width="64" height="64" rx="14" fill="#534AB7"/>
            <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="3.5"/>
            <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="3.5"
              strokeDasharray="122.5 40.8" strokeLinecap="round"
              transform="rotate(-90 32 32)"/>
            <path d="M18 22 C18 21 20 20 25 20 C28.5 20 31 21.5 31 22.5 L31 43 C29 42 26 41.5 22 42 C19.5 42.5 18 42 18 41 Z" fill="white"/>
            <path d="M46 22 C46 21 44 20 39 20 C35.5 20 33 21.5 33 22.5 L33 43 C35 42 38 41.5 42 42 C44.5 42.5 46 42 46 41 Z" fill="rgba(255,255,255,0.7)"/>
            <line x1="32" y1="21" x2="32" y2="43" stroke="#534AB7" strokeWidth="1.5" opacity="0.5"/>
            <line x1="21" y1="27" x2="29" y2="26.5" stroke="#534AB7" strokeWidth="1.2" opacity="0.25" strokeLinecap="round"/>
            <line x1="21" y1="30.5" x2="29" y2="30" stroke="#534AB7" strokeWidth="1.2" opacity="0.25" strokeLinecap="round"/>
            <line x1="21" y1="34" x2="27" y2="33.5" stroke="#534AB7" strokeWidth="1.2" opacity="0.25" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 className="app-splash-title">PomRead</h1>
        <p className="app-splash-sub">読書ポモドーロタイマー</p>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">PomRead</h1>
        <SyncIndicator state={syncState} isLoggedIn={!!user} />
      </header>

      <nav className="tab-nav">
        <button
          className={`tab-btn ${tab === 'timer' ? 'active' : ''}`}
          onClick={() => setTab('timer')}
        >
          <IconClock size={18} />
          タイマー
        </button>
        <button
          className={`tab-btn ${tab === 'bookshelf' ? 'active' : ''}${timerRunning ? ' tab-btn-locked' : ''}`}
          onClick={() => { if (!timerRunning) setTab('bookshelf') }}
          disabled={timerRunning}
          title={timerRunning ? 'タイマー動作中は移動できません' : undefined}
        >
          <IconBooks size={18} />
          本棚
        </button>
        <button
          className={`tab-btn ${tab === 'stats' ? 'active' : ''}${timerRunning ? ' tab-btn-locked' : ''}`}
          onClick={() => { if (!timerRunning) setTab('stats') }}
          disabled={timerRunning}
          title={timerRunning ? 'タイマー動作中は移動できません' : undefined}
        >
          <IconChartBar size={18} />
          統計
        </button>
        <div className="tab-nav-right">
          {role === 'admin' && (
            <button
              className={`tab-btn admin-tab-btn ${tab === 'admin' ? 'active' : ''}`}
              onClick={() => setTab('admin')}
            >
              <IconShield size={18} />
              管理
            </button>
          )}
          <button
            className={`tab-btn ${tab === 'settings' ? 'active' : ''}`}
            onClick={() => setTab('settings')}
          >
            <IconSettings size={18} />
            設定
          </button>
        </div>
      </nav>

      <main className="app-main">
        {tab === 'timer' && (
          <TimerTab books={books} onSessionComplete={handleSessionComplete} onStatusChange={handleStatusChange} onRunningChange={setTimerRunning} />
        )}
        {tab === 'bookshelf' && (
          <BookshelfTab
            books={books}
            onAdd={handleAddBook}
            onUpdate={handleUpdateBook}
            onDelete={handleDeleteBook}
          />
        )}
        {tab === 'stats' && (
          <StatsTab books={books} sessions={sessions} />
        )}
        {tab === 'settings' && (
          <SettingsTab
            theme={theme}
            onThemeChange={setTheme}
            user={user}
            onOpenAuth={() => setShowAuthModal(true)}
            onSignOut={async () => { /* handled in SettingsTab via useAuth */ }}
          />
        )}
        {tab === 'admin' && role === 'admin' && <AdminTab />}
      </main>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showTutorial && <TutorialOverlay onDone={() => setShowTutorial(false)} onTabChange={setTab} />}
      {bannedError && (
        <div className="banned-toast">
          <span>{bannedError}</span>
          <button onClick={clearBannedError}>×</button>
        </div>
      )}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
