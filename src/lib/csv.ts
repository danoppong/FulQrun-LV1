// Lightweight CSV stringifier (RFC4180-like) with no external deps.
// Escapes quotes and wraps fields that contain commas, quotes, or newlines.

export function toCsv(rows: Array<Record<string, unknown>>, headers?: string[]): string {
  if (!rows || rows.length === 0) return ''

  const cols = headers && headers.length > 0
    ? headers
    : Array.from(new Set(rows.flatMap(r => Object.keys(r || {}))))

  const esc = (v: unknown): string => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    if (/[",\r\n]/.test(s)) {
      return '"' + s.replace(/"/g, '""') + '"'
    }
    return s
  }

  const headerLine = cols.map(esc).join(',')
  const dataLines = rows.map(r => cols.map(c => esc((r as Record<string, unknown>)[c])).join(','))
  return [headerLine, ...dataLines].join('\r\n')
}
