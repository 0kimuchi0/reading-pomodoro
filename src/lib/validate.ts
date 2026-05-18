export interface FieldErrors {
  isbn?: string
  ccode?: string
  ndc?: string
  catalogNumber?: string
}

function validateIsbn(raw: string): string | undefined {
  const s = raw.replace(/[- ]/g, '')
  if (s.length === 10) {
    if (!/^\d{9}[\dX]$/.test(s)) return 'ISBN-10は数字9桁＋数字orXの形式です'
    const sum = s.split('').reduce((acc, c, i) => acc + (c === 'X' ? 10 : Number(c)) * (10 - i), 0)
    if (sum % 11 !== 0) return 'ISBNのチェックディジットが正しくありません'
  } else if (s.length === 13) {
    if (!/^\d{13}$/.test(s)) return 'ISBN-13は13桁の数字です'
    if (!/^97[89]/.test(s)) return 'ISBN-13は978または979から始まります'
    const sum = s.split('').reduce((acc, c, i) => acc + Number(c) * (i % 2 === 0 ? 1 : 3), 0)
    if (sum % 10 !== 0) return 'ISBNのチェックディジットが正しくありません'
  } else {
    return 'ISBNは10桁または13桁（ハイフン可）で入力してください'
  }
}

function validateCcode(s: string): string | undefined {
  if (!/^C\d{4}$/.test(s)) return 'CコードはC＋4桁数字の形式です（例：C0093）'
}

function validateNdc(s: string): string | undefined {
  if (!/^\d{3}(\.\d+)?$/.test(s)) return 'NDCは3桁数字（小数点以下任意）の形式です（例：913.6）'
}

function validateCatalogNumber(s: string): string | undefined {
  if (!/^[\w\-ぁ-んァ-ヶー一-龠々〆〤]+$/.test(s))
    return '整理番号に使用できない文字が含まれています'
}

export function validateBookFields(fields: { isbn?: string; ccode?: string; ndc?: string; catalogNumber?: string }): FieldErrors {
  const errors: FieldErrors = {}
  if (fields.isbn?.trim()) {
    const e = validateIsbn(fields.isbn.trim())
    if (e) errors.isbn = e
  }
  if (fields.ccode?.trim()) {
    const e = validateCcode(fields.ccode.trim())
    if (e) errors.ccode = e
  }
  if (fields.ndc?.trim()) {
    const e = validateNdc(fields.ndc.trim())
    if (e) errors.ndc = e
  }
  if (fields.catalogNumber?.trim()) {
    const e = validateCatalogNumber(fields.catalogNumber.trim())
    if (e) errors.catalogNumber = e
  }
  return errors
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0
}
