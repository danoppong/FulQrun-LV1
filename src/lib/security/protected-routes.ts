// Centralized list of app route prefixes that require authentication
// Keep strings simple; middleware will match exact or subpath startsWith

export const PROTECTED_PREFIXES: string[] = [
  '/dashboard',
  '/pharmaceutical-bi',
  '/contacts',
  '/companies',
  '/leads',
  '/opportunities',
  '/settings',
  '/performance',
  '/pipeline',
  '/sales-performance',
  '/admin',
]
