"use client"
import { useEffect, useState } from 'react'

interface OrgLogoProps {
  className?: string
}

export function OrgLogo({ className }: OrgLogoProps) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/branding/logo', { cache: 'no-store' })
        const json = await res.json()
        if (mounted && json?.url) setUrl(json.url as string)
      } catch {
        // ignore
      }
    })()
    return () => { mounted = false }
  }, [])

  return (
    <div className={`inline-flex items-center justify-center rounded-lg ring-1 ring-white/15 bg-white/5 backdrop-blur-sm p-1 shadow-lg shadow-black/20 ${className ?? ''}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url ?? '/icon.svg'}
        alt="Organization Logo"
        className="h-8 w-auto md:h-9 object-contain drop-shadow-sm"
      />
    </div>
  )
}
