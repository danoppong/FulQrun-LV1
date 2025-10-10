# Revert Note: Discard Marketing Page

This note documents that the temporary marketing route and asset added during a previous session were requested to be discarded.

Changes reverted:
- Keep `Hero` background reference pointing to a non-committed placeholder (`/images/landing/hero-fallback.jpg`).
- The page file `src/app/marketing/page.tsx` should be removed if not desired. If you still see it, delete the file and its folder.
- If `public/images/landing/hero-fallback.svg` exists, it can be deleted safely.

Reason: The user requested to “discard this.”
