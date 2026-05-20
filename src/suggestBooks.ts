import type { SuggestBookDB } from './types'
import { getReading, buildReadingIndex } from './lib/japanese'

export interface SuggestBook {
  title: string
  author: string
  genre: string
  publisher: string
  totalPages: number
  isbn?: string
  ccode?: string
  catalogNumber?: string
  ndc?: string
}

export const SUGGEST_BOOKS: SuggestBook[] = [
  // 小説・文学（単巻で版が確定しているもの）
  { title: 'こころ',             author: '夏目漱石',               genre: '小説', publisher: '岩波書店',         totalPages: 256 },
  { title: '坊っちゃん',         author: '夏目漱石',               genre: '小説', publisher: '岩波書店',         totalPages: 200 },
  { title: '羅生門',             author: '芥川龍之介',             genre: '小説', publisher: '岩波書店',         totalPages: 176 },
  { title: '人間失格',           author: '太宰治',                 genre: '小説', publisher: '新潮社',           totalPages: 176 },
  { title: '走れメロス',         author: '太宰治',                 genre: '小説', publisher: '新潮社',           totalPages: 224 },
  { title: '斜陽',               author: '太宰治',                 genre: '小説', publisher: '新潮社',           totalPages: 224 },
  { title: '雪国',               author: '川端康成',               genre: '小説', publisher: '新潮社',           totalPages: 176 },
  { title: '伊豆の踊子',         author: '川端康成',               genre: '小説', publisher: '新潮社',           totalPages: 208 },
  { title: 'キッチン',           author: '吉本ばなな',             genre: '小説', publisher: '角川書店',         totalPages: 176 },
  { title: '博士の愛した数式',   author: '小川洋子',               genre: '小説', publisher: '新潮社',           totalPages: 256 },
  { title: '容疑者Xの献身',      author: '東野圭吾',               genre: '小説', publisher: '文藝春秋',         totalPages: 424 },
  { title: '白夜行',             author: '東野圭吾',               genre: '小説', publisher: '集英社',           totalPages: 880 },
  { title: '秘密',               author: '東野圭吾',               genre: '小説', publisher: '文藝春秋',         totalPages: 432 },
  { title: 'ナミヤ雑貨店の奇蹟', author: '東野圭吾',               genre: '小説', publisher: '角川書店',         totalPages: 496 },
  { title: '羊と鋼の森',         author: '宮下奈都',               genre: '小説', publisher: '文藝春秋',         totalPages: 272 },
  { title: 'コンビニ人間',       author: '村田沙耶香',             genre: '小説', publisher: '文藝春秋',         totalPages: 176 },
  { title: '阪急電車',           author: '有川浩',                 genre: '小説', publisher: '幻冬舎',           totalPages: 240 },
  { title: '図書館戦争',         author: '有川浩',                 genre: '小説', publisher: '角川書店',         totalPages: 448 },
  { title: '君の膵臓をたべたい', author: '住野よる',               genre: '小説', publisher: '双葉社',           totalPages: 304 },
  { title: 'また、同じ夢を見ていた', author: '住野よる',           genre: '小説', publisher: '双葉社',           totalPages: 288 },
  { title: '夜は短し歩けよ乙女', author: '森見登美彦',             genre: '小説', publisher: '角川書店',         totalPages: 352 },
  { title: '精霊の守り人',       author: '上橋菜穂子',             genre: '小説', publisher: '新潮社',           totalPages: 466 },
  { title: '塩狩峠',             author: '三浦綾子',               genre: '小説', publisher: '新潮社',           totalPages: 416 },
  // 歴史
  { title: '武士道',             author: '新渡戸稲造',             genre: '歴史', publisher: '岩波書店',         totalPages: 192 },
  // ビジネス・経済
  { title: '7つの習慣',         author: 'スティーブン・R・コヴィー', genre: 'ビジネス', publisher: 'キングベアー出版', totalPages: 528 },
  { title: 'ゼロ・トゥ・ワン',   author: 'ピーター・ティール',     genre: 'ビジネス', publisher: 'NHK出版',        totalPages: 272 },
  { title: 'FACTFULNESS',        author: 'ハンス・ロスリング',     genre: 'ビジネス', publisher: '日経BP',         totalPages: 400 },
  { title: 'ビジョナリー・カンパニー', author: 'ジム・コリンズ',  genre: 'ビジネス', publisher: '日経BP',         totalPages: 368 },
  { title: 'ゼロ秒思考',         author: '赤羽雄二',               genre: 'ビジネス', publisher: 'ダイヤモンド社', totalPages: 224 },
  { title: 'エッセンシャル思考', author: 'グレッグ・マキューン',   genre: 'ビジネス', publisher: 'かんき出版',     totalPages: 304 },
  { title: 'イノベーションのジレンマ', author: 'クレイトン・クリステンセン', genre: 'ビジネス', publisher: '翔泳社', totalPages: 352 },
  // 自己啓発
  { title: '嫌われる勇気',       author: '岸見一郎・古賀史健',     genre: '自己啓発', publisher: 'ダイヤモンド社', totalPages: 296 },
  { title: '幸せになる勇気',     author: '岸見一郎・古賀史健',     genre: '自己啓発', publisher: 'ダイヤモンド社', totalPages: 304 },
  { title: '夢をかなえるゾウ',   author: '水野敬也',               genre: '自己啓発', publisher: '飛鳥新社',       totalPages: 320 },
  { title: 'メモの魔力',         author: '前田裕二',               genre: '自己啓発', publisher: '幻冬舎',         totalPages: 256 },
  { title: 'アウトプット大全',   author: '樺沢紫苑',               genre: '自己啓発', publisher: 'サンクチュアリ出版', totalPages: 256 },
  { title: 'インプット大全',     author: '樺沢紫苑',               genre: '自己啓発', publisher: 'サンクチュアリ出版', totalPages: 256 },
  { title: '限りある時間の使い方', author: 'オリバー・バークマン', genre: '自己啓発', publisher: 'かんき出版',     totalPages: 264 },
  { title: '反応しない練習',     author: '草薙龍瞬',               genre: '自己啓発', publisher: 'KADOKAWA',       totalPages: 256 },
  { title: 'DIE WITH ZERO',      author: 'ビル・パーキンス',       genre: '自己啓発', publisher: 'ダイヤモンド社', totalPages: 272 },
  // 技術
  { title: 'リーダブルコード',   author: 'ダスティン・ボズウェル', genre: '技術', publisher: 'オライリー・ジャパン', totalPages: 260 },
  { title: 'Clean Code',         author: 'Robert C. Martin',       genre: '技術', publisher: 'アスキードワンゴ',   totalPages: 432 },
  { title: 'プログラマー脳',     author: 'フェリエンヌ・ヘルマンス', genre: '技術', publisher: '秀和システム',    totalPages: 304 },
  { title: '達人プログラマー',   author: 'David Thomas / Andrew Hunt', genre: '技術', publisher: 'オーム社',      totalPages: 480 },
  { title: 'ゼロから作るDeep Learning', author: '斎藤康毅',       genre: '技術', publisher: 'オライリー・ジャパン', totalPages: 320 },
  { title: '世界でもっとも強力な9のアルゴリズム', author: 'ジョン・マコーミック', genre: '技術', publisher: '日経BP', totalPages: 272 },
  // 小説・文学（多巻作品）
  { title: 'ノルウェイの森（上巻）',        author: '村上春樹',                   genre: '小説', publisher: '講談社',           totalPages: 296 },
  { title: 'ノルウェイの森（下巻）',        author: '村上春樹',                   genre: '小説', publisher: '講談社',           totalPages: 296 },
  { title: '海辺のカフカ（上巻）',          author: '村上春樹',                   genre: '小説', publisher: '新潮社',           totalPages: 480 },
  { title: '海辺のカフカ（下巻）',          author: '村上春樹',                   genre: '小説', publisher: '新潮社',           totalPages: 448 },
  { title: '1Q84 BOOK1',                    author: '村上春樹',                   genre: '小説', publisher: '新潮社',           totalPages: 576 },
  { title: '1Q84 BOOK2',                    author: '村上春樹',                   genre: '小説', publisher: '新潮社',           totalPages: 512 },
  { title: '1Q84 BOOK3',                    author: '村上春樹',                   genre: '小説', publisher: '新潮社',           totalPages: 496 },
  { title: '蜜蜂と遠雷（上巻）',            author: '恩田陸',                     genre: '小説', publisher: '幻冬舎',           totalPages: 480 },
  { title: '蜜蜂と遠雷（下巻）',            author: '恩田陸',                     genre: '小説', publisher: '幻冬舎',           totalPages: 480 },
  { title: '鹿の王（上巻）',                author: '上橋菜穂子',                 genre: '小説', publisher: '角川書店',         totalPages: 432 },
  { title: '鹿の王（下巻）',                author: '上橋菜穂子',                 genre: '小説', publisher: '角川書店',         totalPages: 432 },
  { title: '氷点（上巻）',                  author: '三浦綾子',                   genre: '小説', publisher: '角川書店',         totalPages: 368 },
  { title: '氷点（下巻）',                  author: '三浦綾子',                   genre: '小説', publisher: '角川書店',         totalPages: 368 },
  // 歴史（多巻作品）
  { title: '燃えよ剣（上巻）',              author: '司馬遼太郎',                 genre: '歴史', publisher: '新潮社',           totalPages: 400 },
  { title: '燃えよ剣（下巻）',              author: '司馬遼太郎',                 genre: '歴史', publisher: '新潮社',           totalPages: 400 },
  { title: '竜馬がゆく（一）',              author: '司馬遼太郎',                 genre: '歴史', publisher: '文藝春秋',         totalPages: 352 },
  { title: '竜馬がゆく（二）',              author: '司馬遼太郎',                 genre: '歴史', publisher: '文藝春秋',         totalPages: 352 },
  { title: '竜馬がゆく（三）',              author: '司馬遼太郎',                 genre: '歴史', publisher: '文藝春秋',         totalPages: 352 },
  { title: '竜馬がゆく（四）',              author: '司馬遼太郎',                 genre: '歴史', publisher: '文藝春秋',         totalPages: 352 },
  { title: '竜馬がゆく（五）',              author: '司馬遼太郎',                 genre: '歴史', publisher: '文藝春秋',         totalPages: 352 },
  { title: '竜馬がゆく（六）',              author: '司馬遼太郎',                 genre: '歴史', publisher: '文藝春秋',         totalPages: 352 },
  { title: '竜馬がゆく（七）',              author: '司馬遼太郎',                 genre: '歴史', publisher: '文藝春秋',         totalPages: 352 },
  { title: '竜馬がゆく（八）',              author: '司馬遼太郎',                 genre: '歴史', publisher: '文藝春秋',         totalPages: 352 },
  // ビジネス（追加）
  { title: 'マネジメント（エッセンシャル版）', author: 'ピーター・ドラッカー',    genre: 'ビジネス', publisher: 'ダイヤモンド社', totalPages: 224 },
  // 海外文学（多巻作品）
  { title: '罪と罰（上巻）',                author: 'ドストエフスキー',           genre: '小説', publisher: '新潮社',           totalPages: 560 },
  { title: '罪と罰（下巻）',                author: 'ドストエフスキー',           genre: '小説', publisher: '新潮社',           totalPages: 448 },
  { title: 'カラマーゾフの兄弟（上巻）',    author: 'ドストエフスキー',           genre: '小説', publisher: '新潮社',           totalPages: 576 },
  { title: 'カラマーゾフの兄弟（中巻）',    author: 'ドストエフスキー',           genre: '小説', publisher: '新潮社',           totalPages: 544 },
  { title: 'カラマーゾフの兄弟（下巻）',    author: 'ドストエフスキー',           genre: '小説', publisher: '新潮社',           totalPages: 544 },
  { title: 'ダ・ヴィンチ・コード（上巻）',  author: 'ダン・ブラウン',             genre: '小説', publisher: '角川書店',         totalPages: 464 },
  { title: 'ダ・ヴィンチ・コード（下巻）',  author: 'ダン・ブラウン',             genre: '小説', publisher: '角川書店',         totalPages: 448 },
  // 海外文学（単巻）
  { title: '老人と海',           author: 'アーネスト・ヘミングウェイ', genre: '小説', publisher: '新潮社',       totalPages: 176 },
  { title: '変身',               author: 'フランツ・カフカ',       genre: '小説', publisher: '新潮社',           totalPages: 160 },
  { title: '星の王子さま',       author: 'サン=テグジュペリ',      genre: '小説', publisher: '岩波書店',         totalPages: 144 },
  { title: '百年の孤独',         author: 'ガルシア・マルケス',     genre: '小説', publisher: '新潮社',           totalPages: 736 },
  { title: '1984年',             author: 'ジョージ・オーウェル',   genre: '小説', publisher: '早川書房',         totalPages: 512 },
  { title: '動物農場',           author: 'ジョージ・オーウェル',   genre: '小説', publisher: '角川書店',         totalPages: 160 },
  { title: '華氏451度',          author: 'レイ・ブラッドベリ',     genre: '小説', publisher: '早川書房',         totalPages: 256 },
  { title: 'ハリー・ポッターと賢者の石', author: 'J.K.ローリング', genre: '小説', publisher: '静山社',          totalPages: 320 },
  { title: 'アルケミスト',       author: 'パウロ・コエーリョ',     genre: '小説', publisher: '角川書店',         totalPages: 256 },
]

const USER_SUGGEST_KEY = 'pr_user_suggestions'

let _adminBooks: SuggestBookDB[] = []

export function setAdminBooksCache(books: SuggestBookDB[]): void {
  _adminBooks = books
}

export function addToAdminBooksCache(book: SuggestBook): void {
  if (isDuplicate(book.title, book.author, book.publisher)) return
  _adminBooks = [..._adminBooks, { ...book, id: crypto.randomUUID() }]
  buildReadingIndex([book.title, book.author])
}

/** 表記揺れ正規化 */
export function normalize(s: string): string {
  return s
    // 全角英数字 → 半角
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    // 半角カタカナ（濁点結合）→ 全角カタカナ
    .replace(/ｶﾞ/g,'ガ').replace(/ｷﾞ/g,'ギ').replace(/ｸﾞ/g,'グ').replace(/ｹﾞ/g,'ゲ').replace(/ｺﾞ/g,'ゴ')
    .replace(/ｻﾞ/g,'ザ').replace(/ｼﾞ/g,'ジ').replace(/ｽﾞ/g,'ズ').replace(/ｾﾞ/g,'ゼ').replace(/ｿﾞ/g,'ゾ')
    .replace(/ﾀﾞ/g,'ダ').replace(/ﾁﾞ/g,'ヂ').replace(/ﾂﾞ/g,'ヅ').replace(/ﾃﾞ/g,'デ').replace(/ﾄﾞ/g,'ド')
    .replace(/ﾊﾞ/g,'バ').replace(/ﾋﾞ/g,'ビ').replace(/ﾌﾞ/g,'ブ').replace(/ﾍﾞ/g,'ベ').replace(/ﾎﾞ/g,'ボ')
    .replace(/ﾊﾟ/g,'パ').replace(/ﾋﾟ/g,'ピ').replace(/ﾌﾟ/g,'プ').replace(/ﾍﾟ/g,'ペ').replace(/ﾎﾟ/g,'ポ')
    .replace(/ｳﾞ/g,'ヴ')
    .replace(/[ｦ-ﾟ]/g, c => {
      const map = 'ヲァィゥェォャュョッーアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンﾞﾟ'
      const i = c.charCodeAt(0) - 0xFF66
      return i >= 0 && i < map.length ? map[i] : c
    })
    // ヴ → ブ行（カタカナ→ひらがな変換の前に処理）
    .replace(/ヴァ/g,'バ').replace(/ヴィ/g,'ビ').replace(/ヴェ/g,'ベ').replace(/ヴォ/g,'ボ').replace(/ヴ/g,'ブ')
    // カタカナ → ひらがな（ひらがな・カタカナ混在での検索を統一）
    .replace(/[ァ-ン]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60))
    // 括弧類を除去（全角・半角・各種ブラケット）
    .replace(/[（）()「」『』【】〔〕[\]{}｛｝]/g, '')
    // 全角感嘆符・疑問符 → 半角
    .replace(/[！]/g, '!').replace(/[？]/g, '?')
    // 波ダッシュ・チルダ統一
    .replace(/[～〜]/g, '~')
    // スペース・中点除去
    .replace(/[\s　・･]/g, '')
    .toLowerCase()
}

export function getUserSuggestions(): SuggestBook[] {
  try {
    return JSON.parse(localStorage.getItem(USER_SUGGEST_KEY) ?? '[]')
  } catch {
    return []
  }
}

/** タイトル＋著者＋出版社が同じ（正規化後）なら同一本と判定 */
export function isDuplicate(title: string, author: string, publisher?: string): boolean {
  const nt = normalize(title)
  const na = normalize(author)
  const np = normalize(publisher ?? '')
  const allBooks = [...SUGGEST_BOOKS, ...getUserSuggestions(), ..._adminBooks]
  return allBooks.some(b =>
    normalize(b.title) === nt &&
    normalize(b.author) === na &&
    normalize(b.publisher ?? '') === np
  )
}

export function addUserSuggestion(book: SuggestBook): void {
  if (isDuplicate(book.title, book.author, book.publisher)) return
  const current = getUserSuggestions()
  localStorage.setItem(USER_SUGGEST_KEY, JSON.stringify([...current, book]))
}

export function searchSuggestions(query: string): SuggestBook[] {
  if (!query.trim()) return []
  const q = normalize(query)
  const allBooks = [...SUGGEST_BOOKS, ...getUserSuggestions(), ..._adminBooks]
  return allBooks.filter(b => {
    if (normalize(b.title).includes(q) || normalize(b.author).includes(q)) return true
    const titleReading = getReading(b.title)
    const authorReading = getReading(b.author)
    return (titleReading?.includes(q) ?? false) || (authorReading?.includes(q) ?? false)
  }).slice(0, 6)
}
