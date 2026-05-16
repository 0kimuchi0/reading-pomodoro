import type { Book, Session } from './types'

const KEYS = {
  books: 'pr_books',
  sessions: 'pr_sessions',
} as const

export function getBooks(): Book[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.books) ?? '[]')
  } catch {
    return []
  }
}

export function saveBooks(books: Book[]): void {
  localStorage.setItem(KEYS.books, JSON.stringify(books))
}

export function getSessions(): Session[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.sessions) ?? '[]')
  } catch {
    return []
  }
}

export function saveSessions(sessions: Session[]): void {
  localStorage.setItem(KEYS.sessions, JSON.stringify(sessions))
}
