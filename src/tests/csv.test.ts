import { toCsv } from '@/lib/csv'

describe('toCsv', () => {
  it('returns empty string for empty rows', () => {
    expect(toCsv([])).toBe('')
  })

  it('uses provided headers and preserves order', () => {
    const rows = [
      { b: 2, a: 1 },
      { a: 3, b: 4 },
    ]
    const csv = toCsv(rows, ['a', 'b'])
    const lines = csv.split('\r\n')
    expect(lines[0]).toBe('a,b')
    expect(lines[1]).toBe('1,2')
    expect(lines[2]).toBe('3,4')
  })

  it('auto-derives headers when not provided', () => {
    const rows = [
      { alpha: 'x', beta: 'y' },
      { beta: 'z', gamma: 'w' },
    ]
    const csv = toCsv(rows)
    const lines = csv.split('\r\n')
    // Header contains all keys; order is set-like (cannot assume strict order), so just verify presence and count
    const header = lines[0].split(',')
    expect(header.sort()).toEqual(['alpha', 'beta', 'gamma'].sort())
  })

  it('escapes commas, quotes, and newlines', () => {
    const rows = [
      { text: 'hello, world', note: 'he said "hi"' },
      { text: 'line1\nline2', note: 'plain' },
    ]
    const csv = toCsv(rows, ['text', 'note'])
    const lines = csv.split('\r\n')
    expect(lines[0]).toBe('text,note')
    expect(lines[1]).toBe('"hello, world","he said ""hi"""')
    expect(lines[2]).toBe('"line1\nline2",plain')
  })

  it('renders null/undefined as empty cells', () => {
    const rows = [
      { a: null, b: undefined, c: 0 },
    ]
    const csv = toCsv(rows, ['a', 'b', 'c'])
    const lines = csv.split('\r\n')
    expect(lines[0]).toBe('a,b,c')
    expect(lines[1]).toBe(',,0')
  })
})
