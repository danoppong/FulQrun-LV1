import Link from "next/link";
import { HeroBackground } from "@/components/marketing/hero-bg";

export default function Home() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden">
      {/* Background: user‑provided image with dark overlay for contrast */}
      <div aria-hidden className="absolute inset-0">
        <HeroBackground />
        <div className="absolute inset-0 bg-slate-900/70 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-white/10 backdrop-blur-sm ring-1 ring-white/15 flex items-center justify-center">
              <span className="text-white font-bold">FQ</span>
            </div>
            <span className="sr-only">FulQrun</span>
          </div>
           {/* Navigation and portal access removed as requested */}
        </header>

        <section aria-labelledby="hero-title" className="grid min-h-[70vh] md:min-h-[78vh] items-center">
          <div className="max-w-2xl py-16 md:py-24">
            <div className="mb-4">
              <h2 className="text-white font-extrabold text-lg md:text-xl tracking-tight">Welcome to LivFul&apos;s Sales Fulqrun</h2>
            </div>
            <h1 id="hero-title" className="text-4xl md:text-6xl font-semibold tracking-tight text-white">Repellent technology for real‑world protection</h1>
            <p className="mt-6 text-lg md:text-xl text-white/90">Welcome to LivFul&apos;s sales platform with MEDDPICC + PEAK methodologies and enterprise BI—built for clarity and speed.</p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/auth/signup" className="inline-flex items-center justify-between gap-3 rounded-full bg-white/90 px-6 py-3 text-slate-900 text-sm font-medium hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white">
                <span>Get started</span>
                <span aria-hidden>›</span>
              </Link>
              <Link href="/dashboard" className="inline-flex items-center justify-between gap-3 rounded-full bg-white/15 px-6 py-3 text-white text-sm font-medium hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/60">
                <span>View dashboard</span>
                <span aria-hidden>›</span>
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom info bar (offices) */}
      <div className="relative mt-12 border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-xs tracking-widest text-white/80">
            OFFICES: BRAZIL | GHANA | NIGERIA | SINGAPORE | UNITED KINGDOM | UNITED STATES
          </p>
        </div>
      </div>
    </main>
  )
}