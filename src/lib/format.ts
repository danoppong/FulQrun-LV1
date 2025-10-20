// Small shared formatting helpers used across dashboards
// Prefer importing this instead of re-implementing per component.

export function formatCurrencySafe(value: unknown, options?: { compact?: boolean; currency?: string }) {
  const currency = options?.currency || 'USD'
  const compact = options?.compact || false

  const n = typeof value === 'number' ? value : Number(value)
  const v = Number.isFinite(n) ? n : 0

  if (compact) {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`
    return `$${v.toFixed(0)}`
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(v)
  } catch {
    // Fallback if Intl throws for some reason
    return `$${v.toFixed(0)}`
  }
}

export function toFiniteNumber(value: unknown, fallback = 0) {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}
