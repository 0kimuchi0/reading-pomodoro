export type BookStatus = 'want' | 'reading' | 'done'
export type UserRole = 'user' | 'admin'

export interface Profile {
  id: string
  email: string
  role: UserRole
  banned: boolean
  createdAt: string
}

export type Genre = '小説' | 'ビジネス' | '自己啓発' | '技術' | '歴史' | 'その他'

export interface Book {
  id: string
  title: string
  author: string
  publisher?: string
  totalPages: number
  currentPage: number
  genre: Genre
  status: BookStatus
  sessions: number
  createdAt: string
  isbn?: string
  ccode?: string
  catalogNumber?: string
  ndc?: string
}

export interface Session {
  id: string
  bookId: string
  bookTitle: string
  date: string
  duration: number
}

export type AdminActionType = 'role_change' | 'ban' | 'unban'

export interface AdminAction {
  id: string
  adminId: string
  targetUserId: string
  actionType: AdminActionType
  previousValue: string
  newValue: string
  reason: string
  createdAt: string
}
