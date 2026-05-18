import kuromoji from 'kuromoji'
import { normalize } from '../suggestBooks'

type Tokenizer = kuromoji.Tokenizer<kuromoji.IpadicFeatures>

let tokenizer: Tokenizer | null = null
let loadPromise: Promise<Tokenizer> | null = null

function loadTokenizer(): Promise<Tokenizer> {
  if (tokenizer) return Promise.resolve(tokenizer)
  if (loadPromise) return loadPromise
  loadPromise = new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath: '/dict' }).build((err, built) => {
      if (err) { reject(err); return }
      tokenizer = built
      resolve(built)
    })
  })
  return loadPromise
}

function katakanaToHiragana(s: string): string {
  return s.replace(/[ァ-ン]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60))
}

async function toReading(text: string): Promise<string> {
  const t = await loadTokenizer()
  return katakanaToHiragana(
    t.tokenize(text)
      .map(tok => tok.reading ?? tok.surface_form)
      .join('')
  )
}

// normalized original text → hiragana reading
const readingIndex = new Map<string, string>()

export async function buildReadingIndex(texts: string[]): Promise<void> {
  try {
    await loadTokenizer()
  } catch {
    return
  }
  await Promise.all(
    texts.map(async text => {
      const key = normalize(text)
      if (readingIndex.has(key)) return
      try {
        readingIndex.set(key, await toReading(text))
      } catch {
        // ignore individual failures
      }
    })
  )
}

export function getReading(text: string): string | undefined {
  return readingIndex.get(normalize(text))
}
