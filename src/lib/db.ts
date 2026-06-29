import type { Book, Session, Profile, UserRole, AdminAction, AdminActionType, SuggestBookDB, Feedback, FeedbackStatus } from '../types'
import { getBooks as lsGetBooks, saveBooks as lsSaveBooks, getSessions as lsGetSessions, saveSessions as lsSaveSessions } from '../storage'
import { supabase } from './supabase'

// ---- DB row types ----

interface BookRow {
  id: string; user_id: string; title: string; author: string; publisher: string
  genre: string; total_pages: number; current_page: number; sessions: number
  status: string; created_at: string; isbn: string; c_code: string
  catalog_number: string; ndc: string; memo: string
}

interface SessionRow {
  id: string; user_id: string; book_id: string; book_title: string
  date: string; duration: number
}

interface ProfileRow {
  id: string; email: string; role: string; banned: boolean; created_at: string
}

interface AdminActionRow {
  id: string; admin_id: string; target_user_id: string; action_type: string
  previous_value: string; new_value: string; reason: string; created_at: string
}

interface SuggestBookRow {
  id: string; title: string; author: string; genre: string; publisher: string
  total_pages: number; isbn?: string; ccode?: string; catalog_number?: string; ndc?: string
}

interface FeedbackRow {
  id: string; user_id: string | null; content: string; status: string; created_at: string
}

// ---- helpers ----

function toRow(book: Book, userId: string) {
  return {
    id: book.id,
    user_id: userId,
    title: book.title,
    author: book.author,
    publisher: book.publisher ?? '',
    genre: book.genre,
    total_pages: book.totalPages,
    current_page: book.currentPage,
    sessions: book.sessions,
    status: book.status,
    created_at: book.createdAt,
    isbn: book.isbn ?? '',
    c_code: book.ccode ?? '',
    catalog_number: book.catalogNumber ?? '',
    ndc: book.ndc ?? '',
    memo: book.memo ?? '',
  }
}

function fromRow(row: BookRow): Book {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    publisher: row.publisher,
    genre: row.genre as Book['genre'],
    totalPages: row.total_pages,
    currentPage: row.current_page,
    sessions: row.sessions,
    status: row.status as Book['status'],
    createdAt: row.created_at,
    isbn: row.isbn || undefined,
    ccode: row.c_code || undefined,
    catalogNumber: row.catalog_number || undefined,
    ndc: row.ndc || undefined,
    memo: row.memo || undefined,
  }
}

function sessionToRow(s: Session, userId: string) {
  return {
    id: s.id,
    user_id: userId,
    book_id: s.bookId,
    book_title: s.bookTitle,
    date: s.date,
    duration: s.duration,
  }
}

function sessionFromRow(row: SessionRow): Session {
  return {
    id: row.id,
    bookId: row.book_id,
    bookTitle: row.book_title,
    date: row.date,
    duration: row.duration,
  }
}

// ---- books ----

export async function getBooks(): Promise<Book[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return lsGetBooks()

  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
  if (error) return lsGetBooks()
  return (data ?? []).map(r => fromRow(r as unknown as BookRow))
}

export async function saveBook(book: Book): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const books = lsGetBooks()
    const idx = books.findIndex(b => b.id === book.id)
    if (idx >= 0) books[idx] = book; else books.push(book)
    lsSaveBooks(books)
    return
  }
  const { error } = await supabase.from('books').upsert(toRow(book, user.id))
  if (error) throw new Error(error.message)
}

export async function saveAllBooks(books: Book[]): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    lsSaveBooks(books)
    return
  }
  const { error } = await supabase.from('books').upsert(books.map(b => toRow(b, user.id)))
  if (error) throw new Error(error.message)
}

export async function deleteBook(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    lsSaveBooks(lsGetBooks().filter(b => b.id !== id))
    return
  }
  await supabase.from('books').delete().eq('id', id).eq('user_id', user.id)
}

// ---- sessions ----

export async function getSessions(): Promise<Session[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return lsGetSessions()

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: true })
  if (error) return lsGetSessions()
  return (data ?? []).map(r => sessionFromRow(r as unknown as SessionRow))
}

export async function saveSession(session: Session): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const sessions = lsGetSessions()
    lsSaveSessions([...sessions, session])
    return
  }
  await supabase.from('sessions').upsert(sessionToRow(session, user.id))
}

// ---- profiles ----

function profileFromRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email ?? '',
    role: (row.role as UserRole) ?? 'user',
    banned: row.banned ?? false,
    createdAt: row.created_at,
  }
}

export async function getMyProfile(userId?: string): Promise<Profile | null> {
  const id = userId ?? (await supabase.auth.getSession()).data.session?.user.id
  if (!id) return null
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
  if (error) return null
  if (!data) return null
  return profileFromRow(data as unknown as ProfileRow)
}

export async function getAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map(r => profileFromRow(r as unknown as ProfileRow))
}

export async function updateUserRole(userId: string, role: UserRole): Promise<void> {
  await supabase.from('profiles').update({ role }).eq('id', userId)
}

export async function updateUserBanned(userId: string, banned: boolean): Promise<void> {
  await supabase.from('profiles').update({ banned }).eq('id', userId)
}

export async function getAllBooksAdmin(): Promise<Book[]> {
  const { data, error } = await supabase.from('books').select('*').order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map(r => fromRow(r as unknown as BookRow))
}

export async function getAllSessionsAdmin(): Promise<Session[]> {
  const { data, error } = await supabase.from('sessions').select('*').order('date', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map(r => sessionFromRow(r as unknown as SessionRow))
}

// ---- admin actions ----

function adminActionFromRow(row: AdminActionRow): AdminAction {
  return {
    id: row.id,
    adminId: row.admin_id,
    targetUserId: row.target_user_id,
    actionType: row.action_type as AdminActionType,
    previousValue: row.previous_value,
    newValue: row.new_value,
    reason: row.reason,
    createdAt: row.created_at,
  }
}

export async function logAdminAction(
  targetUserId: string,
  actionType: AdminActionType,
  previousValue: string,
  newValue: string,
  reason: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('admin_actions').insert({
    admin_id: user.id,
    target_user_id: targetUserId,
    action_type: actionType,
    previous_value: previousValue,
    new_value: newValue,
    reason,
  })
}

export async function getAdminActions(): Promise<AdminAction[]> {
  const { data, error } = await supabase
    .from('admin_actions')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(r => adminActionFromRow(r as unknown as AdminActionRow))
}

export async function revertAdminAction(action: AdminAction): Promise<void> {
  if (action.actionType === 'role_change') {
    await supabase.from('profiles').update({ role: action.previousValue }).eq('id', action.targetUserId)
  } else {
    const banned = action.previousValue === 'true'
    await supabase.from('profiles').update({ banned }).eq('id', action.targetUserId)
  }
  await logAdminAction(
    action.targetUserId,
    action.actionType,
    action.newValue,
    action.previousValue,
    `[巻き戻し] ${action.reason}`
  )
}

// ---- suggest books ----

export async function getSuggestBooks(): Promise<SuggestBookDB[]> {
  const { data, error } = await supabase
    .from('suggest_books')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) return []
  return (data ?? []).map((r: unknown) => {
    const row = r as SuggestBookRow
    return {
      id: row.id,
      title: row.title,
      author: row.author,
      genre: row.genre,
      publisher: row.publisher,
      totalPages: row.total_pages,
      isbn: row.isbn || undefined,
      ccode: row.ccode || undefined,
      catalogNumber: row.catalog_number || undefined,
      ndc: row.ndc || undefined,
    }
  })
}

export async function addSuggestBook(book: Omit<SuggestBookDB, 'id'>): Promise<void> {
  const { data: existing } = await supabase
    .from('suggest_books')
    .select('id')
    .eq('title', book.title)
    .eq('author', book.author)
    .eq('publisher', book.publisher)
    .maybeSingle()
  if (existing) return
  const { error } = await supabase.from('suggest_books').insert({
    title: book.title,
    author: book.author,
    genre: book.genre,
    publisher: book.publisher,
    total_pages: book.totalPages,
    isbn: book.isbn || null,
    ccode: book.ccode || null,
    catalog_number: book.catalogNumber || null,
    ndc: book.ndc || null,
  })
  if (error) throw new Error(error.message)
}

export async function updateSuggestBook(book: SuggestBookDB): Promise<void> {
  const { error } = await supabase.from('suggest_books').update({
    title: book.title,
    author: book.author,
    genre: book.genre,
    publisher: book.publisher,
    total_pages: book.totalPages,
    isbn: book.isbn || null,
    ccode: book.ccode || null,
    catalog_number: book.catalogNumber || null,
    ndc: book.ndc || null,
  }).eq('id', book.id)
  if (error) throw new Error(error.message)
}

export async function deleteSuggestBook(id: string): Promise<void> {
  await supabase.from('suggest_books').delete().eq('id', id)
}

// ---- feedback ----

export async function submitFeedback(content: string, userId: string | null): Promise<void> {
  const insertPromise = supabase.from('feedback').insert({
    user_id: userId ?? null,
    content,
  }).then(({ error }) => { if (error) throw error })
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), 10000)
  )
  await Promise.race([insertPromise, timeoutPromise])
}

export async function getFeedbackList(): Promise<Feedback[]> {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return []
  return (data ?? []).map((r: unknown) => {
    const row = r as FeedbackRow
    return {
      id: row.id,
      userId: row.user_id,
      content: row.content,
      status: (row.status as FeedbackStatus) ?? 'pending',
      createdAt: row.created_at,
    }
  })
}

export async function updateFeedbackStatus(id: string, status: FeedbackStatus): Promise<void> {
  const { error } = await supabase.from('feedback').update({ status }).eq('id', id)
  if (error) throw error
}

// ---- account ----

export async function deleteAccount(): Promise<void> {
  const { error } = await supabase.rpc('delete_user_account')
  if (error) throw error
}

// ---- migration ----

export async function migrateLocalDataToSupabase(userId: string): Promise<void> {
  if (localStorage.getItem('pr_migrated') === '1') return

  const books = lsGetBooks()
  const sessions = lsGetSessions()

  if (books.length > 0) {
    await supabase.from('books').upsert(books.map(b => toRow(b, userId)))
  }
  if (sessions.length > 0) {
    await supabase.from('sessions').upsert(sessions.map(s => sessionToRow(s, userId)))
  }

  localStorage.setItem('pr_migrated', '1')
}
