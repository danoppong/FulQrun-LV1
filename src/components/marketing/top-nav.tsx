import Link from 'next/link'

// Server component: simple top navigation for the marketing landing page
export function TopNav() {
  return (
    <header className="relative z-20">
      <a
        href="#main"
        className="absolute left-2 top-2 -translate-y-16 focus:translate-y-0 bg-primary text-primary-foreground px-3 py-1 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        Skip to content
      </a>
      <nav className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold">FQ</span>
          </div>
          <span className="sr-only">FulQrun</span>
        </div>
        <ul className="hidden md:flex items-center gap-6 text-sm text-foreground/90">
          <li><Link href="/technology" className="hover:text-foreground">Technology</Link></li>
          <li><Link href="/public-health" className="hover:text-foreground">Public health</Link></li>
          <li><Link href="/updates" className="hover:text-foreground">Updates</Link></li>
          <li><Link href="/partners" className="hover:text-foreground">Partners</Link></li>
          <li><Link href="/about" className="hover:text-foreground">About</Link></li>
          <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
        </ul>
        <div className="hidden md:block">
          <Link
            href="/portal"
            className="inline-flex items-center rounded-full bg-foreground/10 px-4 py-2 text-sm font-medium text-foreground hover:bg-foreground/20"
          >
            Portal access
          </Link>
        </div>
      </nav>
    </header>
  )
}
