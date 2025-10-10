interface HeroProps {
  title?: string
  subtitle?: string
  primaryHref?: string
  primaryLabel?: string
  secondaryHref?: string
  secondaryLabel?: string
}

export function Hero({
  title = 'Exclusive technology for next‑generation protection',
  subtitle = 'Join us and protect your teams and communities with long‑lasting, skin‑friendly defense.',
  primaryHref = '/technology',
  primaryLabel = 'Discover',
  secondaryHref = '/partners',
  secondaryLabel = 'Partner with us',
}: HeroProps) {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      {/* Background image placeholder block (replace with your own asset) */}
      <div aria-hidden className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-900 via-sky-800 to-sky-700" />
        <div className="absolute inset-0 bg-[url('/images/landing/hero-fallback.jpg')] bg-cover bg-center opacity-30" />
      </div>

      {/* Subtle vignette and overlay for readability */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-tr from-background/60 via-background/20 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="min-h-[70vh] md:min-h-[78vh] grid items-center">
          <div className="max-w-2xl py-16 md:py-24">
            <h1 id="hero-title" className="text-4xl md:text-6xl font-serif font-semibold tracking-tight text-white">
              {title}
            </h1>
            <p className="mt-6 text-lg md:text-xl text-white/90 max-w-xl">
              {subtitle}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <a
                href={primaryHref}
                className="inline-flex items-center justify-between gap-3 rounded-full bg-white/90 px-6 py-3 text-slate-900 text-sm font-medium hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
              >
                <span>{primaryLabel}</span>
                <span aria-hidden>›</span>
              </a>
              <a
                href={secondaryHref}
                className="inline-flex items-center justify-between gap-3 rounded-full bg-white/20 px-6 py-3 text-white text-sm font-medium hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/60"
              >
                <span>{secondaryLabel}</span>
                <span aria-hidden>›</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
