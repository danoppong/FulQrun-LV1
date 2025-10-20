// Tiny CSV parser for RFC4180-like CSV. No external deps. Handles quotes, commas, CRLF.
// Returns rows as array of string arrays. Caller can map to objects using headers.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let cur: string[] = []
  let field = ''
  let i = 0
  const N = text.length
  let inQuotes = false

  while (i < N) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        // Possible escaped quote
        const next = text[i + 1]
        if (next === '"') {
          field += '"'
          i += 2
          continue
        } else {
          inQuotes = false
          i++
          continue
        }
      } else {
        field += ch
        i++
        continue
      }
    } else {
      if (ch === '"') {
        inQuotes = true
        i++
        continue
      }
      if (ch === ',') {
        cur.push(field)
        field = ''
        i++
        continue
      }
      if (ch === '\n') {
        cur.push(field)
        field = ''
        rows.push(cur)
        cur = []
        i++
        continue
      }
      if (ch === '\r') {
        // swallow CR; handle CRLF as single newline (\r\n)
        const next = text[i + 1]
        if (next === '\n') {
          i += 2
        } else {
          i++
        }
        cur.push(field)
        field = ''
        rows.push(cur)
        cur = []
        continue
      }
      field += ch
      i++
    }
  }
  // Flush last field/row
  cur.push(field)
  rows.push(cur)
  // Remove possible trailing empty row if text ended with newline
  if (rows.length && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '' && text.endsWith('\n')) {
    rows.pop()
  }
  return rows
}

export function rowsToObjects(rows: string[][]): Array<Record<string, string>> {
  if (!rows.length) return []
  const [header, ...data] = rows
  const headers = header.map(h => h.trim())
  return data.map(r => {
    const obj: Record<string, string> = {}
    headers.forEach((h, idx) => { obj[h] = r[idx] ?? '' })
    return obj
  })
}
