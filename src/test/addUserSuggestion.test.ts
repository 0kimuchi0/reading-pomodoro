import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/japanese', () => ({
  buildReadingIndex: vi.fn().mockResolvedValue(undefined),
  getReading: vi.fn().mockReturnValue(undefined),
}))

import { buildReadingIndex } from '../lib/japanese'
import { addUserSuggestion } from '../suggestBooks'

describe('addUserSuggestion — buildReadingIndex 登録', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('追加した書籍のタイトルと著者を buildReadingIndex に渡す', () => {
    addUserSuggestion({
      title: '新規テスト本',
      author: 'テスト著者',
      genre: '小説',
      publisher: 'テスト出版社',
      totalPages: 100,
    })

    expect(buildReadingIndex).toHaveBeenCalledWith(['新規テスト本', 'テスト著者'])
  })

  it('重複書籍は buildReadingIndex を呼び出さない', () => {
    addUserSuggestion({
      title: '重複テスト本',
      author: '著者',
      genre: '小説',
      publisher: '出版社',
      totalPages: 100,
    })
    vi.clearAllMocks()

    addUserSuggestion({
      title: '重複テスト本',
      author: '著者',
      genre: '小説',
      publisher: '出版社',
      totalPages: 100,
    })

    expect(buildReadingIndex).not.toHaveBeenCalled()
  })
})
