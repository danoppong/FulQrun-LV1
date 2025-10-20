/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable class-based dark mode control
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        // Phase 3 Enterprise Colors
        'phase3-purple': {
          50: 'var(--phase3-purple-50)',
          100: 'var(--phase3-purple-100)',
          200: 'var(--phase3-purple-200)',
          300: 'var(--phase3-purple-300)',
          400: 'var(--phase3-purple-400)',
          500: 'var(--phase3-purple-500)',
          600: 'var(--phase3-purple-600)',
          700: 'var(--phase3-purple-700)',
          800: 'var(--phase3-purple-800)',
          900: 'var(--phase3-purple-900)',
        },
        'phase3-pink': {
          50: 'var(--phase3-pink-50)',
          100: 'var(--phase3-pink-100)',
          200: 'var(--phase3-pink-200)',
          300: 'var(--phase3-pink-300)',
          400: 'var(--phase3-pink-400)',
          500: 'var(--phase3-pink-500)',
          600: 'var(--phase3-pink-600)',
          700: 'var(--phase3-pink-700)',
          800: 'var(--phase3-pink-800)',
          900: 'var(--phase3-pink-900)',
        },
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-secondary': 'var(--gradient-secondary)',
        'gradient-success': 'var(--gradient-success)',
        'gradient-warning': 'var(--gradient-warning)',
        'gradient-phase3-primary': 'var(--gradient-phase3-primary)',
        'gradient-phase3-secondary': 'var(--gradient-phase3-secondary)',
        'gradient-phase3-accent': 'var(--gradient-phase3-accent)',
        'gradient-phase3-hover': 'var(--gradient-phase3-hover)',
      },
      boxShadow: {
        'custom': 'var(--shadow-custom)',
        'custom-lg': 'var(--shadow-custom-lg)',
        'phase3-sm': 'var(--shadow-phase3-sm)',
        'phase3': 'var(--shadow-phase3)',
        'phase3-md': 'var(--shadow-phase3-md)',
        'phase3-lg': 'var(--shadow-phase3-lg)',
        'phase3-xl': 'var(--shadow-phase3-xl)',
        'phase3-2xl': 'var(--shadow-phase3-2xl)',
      },
    },
  },
  plugins: [],
}

