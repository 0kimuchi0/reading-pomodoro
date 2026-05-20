import type { Book, Session, Profile, UserRole, AdminAction, AdminActionType, SuggestBookDB, Feedback, FeedbackStatus } from '../types'
import { getBooks as lsGetBooks, saveBooks as lsSaveBooks, getSessions as lsGetSessions, saveSessions as lsSaveSessions } from '../storage'
import { supabase } from './supabase'

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

function fromRow(row: Record<string, unknown>): Book {
  return {
    id: row.id as string,
    title: row.title as string,
    author: row.author as string,
    publisher: row.publisher as string,
    genre: row.genre as Book['genre'],
    totalPages: row.total_pages as number,
    currentPage: row.current_page as number,
    sessions: row.sessions as number,
    status: row.status as Book['status'],
    createdAt: row.created_at as string,
    isbn: (row.isbn as string) || undefined,
    ccode: (row.c_code as string) || undefined,
    catalogNumber: (row.catalog_number as string) || undefined,
    ndc: (row.ndc as string) || undefined,
    memo: (row.memo as string) || undefined,
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

function sessionFromRow(row: Record<string, unknown>): Session {
  return {
    id: row.id as string,
    bookId: row.book_id as string,
    bookTitle: row.book_title as string,
    date: row.date as string,
    duration: row.duration as number,
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
  return (data ?? []).map(r => fromRow(r as Record<string, unknown>))
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
  return (data ?? []).map(r => sessionFromRow(r as Record<string, unknown>))
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

function profileFromRow(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    email: (row.email as string) ?? '',
    role: (row.role as UserRole) ?? 'user',
    banned: (row.banned as boolean) ?? false,
    createdAt: row.created_at as string,
  }
}

export async function getMyProfile(userId?: string): Promise<Profile | null> {
  const id = userId ?? (await supabase.auth.getSession()).data.session?.user.id
  if (!id) return null
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
  if (error || !data) return null
  return profileFromRow(data as Record<string, unknown>)
}

export async function getAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map(r => profileFromRow(r as Record<string, unknown>))
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
  return (data ?? []).map(r => fromRow(r as Record<string, unknown>))
}

export async function getAllSessionsAdmin(): Promise<Session[]> {
  const { data, error } = await supabase.from('sessions').select('*').order('date', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map(r => sessionFromRow(r as Record<string, unknown>))
}

// ---- admin actions ----

function adminActionFromRow(row: Record<string, unknown>): AdminAction {
  return {
    id: row.id as string,
    adminId: row.admin_id as string,
    targetUserId: row.target_user_id as string,
    actionType: row.action_type as AdminActionType,
    previousValue: row.previous_value as string,
    newValue: row.new_value as string,
    reason: row.reason as string,
    createdAt: row.created_at as string,
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
  return (data ?? []).map(r => adminActionFromRow(r as Record<string, unknown>))
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
  return (data ?? []).map(r => ({
    id: r.id as string,
    title: r.title as string,
    author: r.author as string,
    genre: r.genre as string,
    publisher: r.publisher as string,
    totalPages: r.total_pages as number,
    isbn: r.isbn as string | undefined,
    ccode: r.ccode as string | undefined,
    catalogNumber: r.catalog_number as string | undefined,
    ndc: r.ndc as string | undefined,
  }))
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
  return (data ?? []).map(r => ({
    id: r.id as string,
    userId: r.user_id as string | null,
    content: r.content as string,
    status: (r.status as FeedbackStatus) ?? 'pending',
    createdAt: r.created_at as string,
  }))
}

export async function updateFeedbackStatus(id: string, status: FeedbackStatus): Promise<void> {
  const { error } = await supabase.from('feedback').update({ status }).eq('id', id)
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
