import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ConditionalLayout from "@/components/ConditionalLayout";
import { CriticalErrorBoundary } from '@/components/error-boundaries/CriticalErrorBoundary';
import { PerformanceToggle } from '@/components/performance/PerformanceToggle';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
  icons: {
    icon: [
      { url: "/icon-144x144.png", sizes: "144x144", type: "image/png" },
      { url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/icon-144x144.png", sizes: "144x144", type: "image/png" },
      { url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased`}
        suppressHydrationWarning={true}
      >
        <CriticalErrorBoundary context="Application Root">
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
          <PerformanceToggle />
        </CriticalErrorBoundary>
      </body>
    </html>
  );
}
