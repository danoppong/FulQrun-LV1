import { parseCsv, rowsToObjects } from '@/lib/csv-parse'

describe('parseCsv', () => {
  it('parses simple CSV', () => {
    const text = 'a,b\n1,2\n3,4\n'
    expect(parseCsv(text)).toEqual([
      ['a','b'],
      ['1','2'],
      ['3','4']
    ])
  })
  it('handles quotes and commas/newlines', () => {
    const text = 'text,note\n"hello, world","he said ""hi"""\n"line1\nline2",plain\n'
    const rows = parseCsv(text)
    expect(rows[0]).toEqual(['text','note'])
    expect(rows[1]).toEqual(['hello, world','he said "hi"'])
    expect(rows[2]).toEqual(['line1\nline2','plain'])
  })
})

describe('rowsToObjects', () => {
  it('maps header row to objects', () => {
    const rows = [
      ['first_name','last_name','email'],
      ['Jane','Doe','jane@example.com']
    ]
    expect(rowsToObjects(rows)).toEqual([
      { first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com' }
    ])
  })
})
