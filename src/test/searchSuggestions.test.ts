import { describe, it, expect } from 'vitest'
import { searchSuggestions } from '../suggestBooks'

describe('searchSuggestions — IME 変換中ひらがな入力', () => {
  it('変換確定前のひらがな "こころ" で一致する書籍が返る（直接ひらがなマッチ）', () => {
    const results = searchSuggestions('こころ')
    expect(results.length).toBeGreaterThan(0)
    expect(results.some(r => r.title.includes('こころ') || r.title.includes('心'))).toBe(true)
  })

  it('変換中のひらがな入力 "はりー" でハリー・ポッターが見つかる', () => {
    const results = searchSuggestions('はりー')
    expect(results.length).toBeGreaterThan(0)
    expect(results.some(r => r.title.includes('ハリー'))).toBe(true)
  })

  it('空文字列では結果が返らない', () => {
    expect(searchSuggestions('')).toHaveLength(0)
  })

  it('半角スペースのみでは結果が返らない', () => {
    expect(searchSuggestions('   ')).toHaveLength(0)
  })

  it('最大 6 件に制限される', () => {
    const results = searchSuggestions('の')
    expect(results.length).toBeLessThanOrEqual(6)
  })
})
