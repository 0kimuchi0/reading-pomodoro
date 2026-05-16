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
import { getBooks, saveBook, saveAllBooks, deleteBook, getSessions, saveSession } from './lib/db'

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
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)

  // Load data whenever auth state settles or user changes
  useEffect(() => {
    if (authLoading) return
    setSyncState('syncing')
    const timeout = setTimeout(() => {
      setSyncState('offline')
      setDataLoaded(true)
    }, 8000)
    Promise.all([getBooks(), getSessions()])
      .then(([b, s]) => {
        clearTimeout(timeout)
        setBooks(b)
        setSessions(s)
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

  if (authLoading || !dataLoaded) {
    return (
      <div className="app-loading">
        <div className="app-loading-spinner" />
        <p>読み込み中...</p>
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
          className={`tab-btn ${tab === 'bookshelf' ? 'active' : ''}`}
          onClick={() => setTab('bookshelf')}
        >
          <IconBooks size={18} />
          本棚
        </button>
        <button
          className={`tab-btn ${tab === 'stats' ? 'active' : ''}`}
          onClick={() => setTab('stats')}
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
          <TimerTab books={books} onSessionComplete={handleSessionComplete} onStatusChange={handleStatusChange} />
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
