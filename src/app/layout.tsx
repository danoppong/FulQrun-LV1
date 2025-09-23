import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ConditionalLayout from "@/components/ConditionalLayout";
import { CriticalErrorBoundary } from '@/components/error-boundaries/CriticalErrorBoundary';
import { PerformanceToggle } from '@/components/performance/PerformanceToggle';
import ThemeProvider from '@/components/ThemeProvider';

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
              // Apply theme immediately to prevent FOUC (client-side only)
              if (typeof window !== 'undefined') {
                (function() {
                  const theme = localStorage.getItem('theme') || 'light';
                  const themes = {
                    light: {
                      background: '#fafafa',
                      foreground: '#0f172a',
                      card: '#ffffff',
                      'card-foreground': '#0f172a',
                      popover: '#ffffff',
                      'popover-foreground': '#0f172a',
                      primary: '#3b82f6',
                      'primary-foreground': '#f8fafc',
                      secondary: '#f1f5f9',
                      'secondary-foreground': '#0f172a',
                      muted: '#f1f5f9',
                      'muted-foreground': '#64748b',
                      accent: '#f1f5f9',
                      'accent-foreground': '#0f172a',
                      destructive: '#ef4444',
                      'destructive-foreground': '#f8fafc',
                      border: '#e2e8f0',
                      input: '#e2e8f0',
                      ring: '#3b82f6',
                      'gradient-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      'gradient-secondary': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      'gradient-success': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      'gradient-warning': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
                    },
                    dark: {
                      background: '#0f172a',
                      foreground: '#f8fafc',
                      card: '#1e293b',
                      'card-foreground': '#f8fafc',
                      popover: '#1e293b',
                      'popover-foreground': '#f8fafc',
                      primary: '#3b82f6',
                      'primary-foreground': '#f8fafc',
                      secondary: '#334155',
                      'secondary-foreground': '#f8fafc',
                      muted: '#334155',
                      'muted-foreground': '#94a3b8',
                      accent: '#334155',
                      'accent-foreground': '#f8fafc',
                      destructive: '#ef4444',
                      'destructive-foreground': '#f8fafc',
                      border: '#334155',
                      input: '#334155',
                      ring: '#3b82f6',
                      'gradient-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      'gradient-secondary': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      'gradient-success': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      'gradient-warning': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
                    }
                  };
                  
                  const config = themes[theme] || themes.light;
                  const root = document.documentElement;
                  
                  Object.entries(config).forEach(([key, value]) => {
                    root.style.setProperty('--' + key, value);
                  });
                })();
                
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
