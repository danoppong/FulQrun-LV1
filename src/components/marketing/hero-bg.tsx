'use client'
import { useEffect, useState } from 'react'

interface HeroBackgroundProps {
  candidates?: string[]
}

export function HeroBackground({
  candidates = [
    '/images/landing/staytec-bg.jpg',
    // Fallback to a lightweight SVG that exists in the repo to avoid 404 noise
    '/images/landing/hero-fallback.svg',
  ],
}: HeroBackgroundProps) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function tryLoad(paths: string[]) {
      for (const p of paths) {
        const ok = await new Promise<boolean>((resolve) => {
          const img = new Image()
          img.onload = () => resolve(true)
          img.onerror = () => resolve(false)
          img.src = p
        })
        if (ok) {
          if (!cancelled) setUrl(p)
          break
        }
      }
    }

    tryLoad(candidates)
    return () => {
      cancelled = true
    }
  }, [candidates])

  return (
    <div
      aria-hidden
      className="absolute inset-0 bg-cover bg-center bg-gradient-to-br from-slate-800 via-slate-800/95 to-slate-900"
      style={url ? { backgroundImage: `url(${url})` } : undefined}
    />
  )
}
