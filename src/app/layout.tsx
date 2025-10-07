import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ConditionalLayout from "@/components/ConditionalLayout";
import { CriticalErrorBoundary } from '@/components/error-boundaries/CriticalErrorBoundary'
import { PerformanceToggle } from '@/components/performance/PerformanceToggle'
import ThemeProvider from '@/components/ThemeProvider';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "arial"],
  preload: true,
});

export const metadata: Metadata = {
  title: "FulQrun - Sales Operations Platform",
  description: "PEAK + MEDDPICC embedded sales operations platform",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FulQrun",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  icons: {
    icon: [
      { url: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#4f46e5",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Prevent browser extensions from adding attributes that cause hydration mismatches
              if (typeof window !== 'undefined') {
                (function() {
                  const originalSetAttribute = Element.prototype.setAttribute;
                  Element.prototype.setAttribute = function(name, value) {
                    // Block problematic attributes from being added to the body
                    if (this === document.body && (
                      name.startsWith('data-gr-') ||
                      name.startsWith('data-gramm') ||
                      name.startsWith('data-lastpass') ||
                      name.startsWith('data-1password') ||
                      name.startsWith('data-bitwarden')
                    )) {
                      return;
                    }
                    return originalSetAttribute.call(this, name, value);
                  };
                })();
              }
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased`}
        suppressHydrationWarning={true}
      >
        <CriticalErrorBoundary context="Application Root">
          <ThemeProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
            <PerformanceToggle />
          </ThemeProvider>
        </CriticalErrorBoundary>
      </body>
    </html>
  );
}
