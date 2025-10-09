// src/design-system/tokens/pharmaceutical-tokens.ts
// Phase 3.0: Pharmaceutical Design System Tokens
// Core design tokens for pharmaceutical industry interface

export const pharmaceuticalTokens = {
  // Color System - Pharmaceutical Industry Focused
  colors: {
    // Primary pharmaceutical colors
    primary: {
      50: '#eff6ff',   // Lightest medical blue
      100: '#dbeafe',  // Light medical blue
      200: '#bfdbfe',  // Medical blue 200
      300: '#93c5fd',  // Medical blue 300
      400: '#60a5fa',  // Medical blue 400
      500: '#3b82f6',  // Medical blue (primary)
      600: '#2563eb',  // Darker medical blue
      700: '#1d4ed8',  // Dark medical blue
      800: '#1e40af',  // Darker medical blue
      900: '#1e3a8a',  // Darkest medical blue
      950: '#172554'   // Deepest medical blue
    },
    
    // Clinical green for success and positive metrics
    clinical: {
      50: '#f0fdf4',   // Lightest clinical green
      100: '#dcfce7',  // Light clinical green
      200: '#bbf7d0',  // Clinical green 200
      300: '#86efac',  // Clinical green 300
      400: '#4ade80',  // Clinical green 400
      500: '#22c55e',  // Clinical green (success)
      600: '#16a34a',  // Darker clinical green
      700: '#15803d',  // Dark clinical green
      800: '#166534',  // Darker clinical green
      900: '#14532d',  // Darkest clinical green
      950: '#052e16'   // Deepest clinical green
    },
    
    // Regulatory red for compliance and warnings
    regulatory: {
      50: '#fef2f2',   // Lightest regulatory red
      100: '#fee2e2',  // Light regulatory red
      200: '#fecaca',  // Regulatory red 200
      300: '#fca5a5',  // Regulatory red 300
      400: '#f87171',  // Regulatory red 400
      500: '#ef4444',  // Regulatory red (error)
      600: '#dc2626',  // Darker regulatory red
      700: '#b91c1c',  // Dark regulatory red
      800: '#991b1b',  // Darker regulatory red
      900: '#7f1d1d',  // Darkest regulatory red
      950: '#450a0a'   // Deepest regulatory red
    },
    
    // Therapeutic purple for research and innovation
    therapeutic: {
      50: '#faf5ff',   // Lightest therapeutic purple
      100: '#f3e8ff',  // Light therapeutic purple
      200: '#e9d5ff',  // Therapeutic purple 200
      300: '#d8b4fe',  // Therapeutic purple 300
      400: '#c084fc',  // Therapeutic purple 400
      500: '#a855f7',  // Therapeutic purple
      600: '#9333ea',  // Darker therapeutic purple
      700: '#7c3aed',  // Dark therapeutic purple
      800: '#6b21a8',  // Darker therapeutic purple
      900: '#581c87',  // Darkest therapeutic purple
      950: '#3b0764'   // Deepest therapeutic purple
    },
    
    // Pharmaceutical context colors
    pharma: {
      hcp: '#6366f1',        // Healthcare Provider (indigo)
      patient: '#ec4899',    // Patient focus (pink)
      research: '#8b5cf6',   // Research (violet)
      commercial: '#06b6d4', // Commercial (cyan)
      medical: '#10b981',    // Medical affairs (emerald)
      regulatory: '#f59e0b', // Regulatory affairs (amber)
      manufacturing: '#84cc16', // Manufacturing (lime)
      quality: '#ef4444'     // Quality assurance (red)
    },
    
    // Semantic colors
    semantic: {
      success: '#10b981',    // Success green
      warning: '#f59e0b',    // Warning amber
      error: '#ef4444',      // Error red
      info: '#3b82f6',       // Info blue
      neutral: '#6b7280'     // Neutral gray
    },
    
    // Gray scale for pharmaceutical interfaces
    gray: {
      50: '#f9fafb',   // Lightest gray
      100: '#f3f4f6',  // Light gray
      200: '#e5e7eb',  // Gray 200
      300: '#d1d5db',  // Gray 300
      400: '#9ca3af',  // Gray 400
      500: '#6b7280',  // Gray 500 (text secondary)
      600: '#4b5563',  // Gray 600 (text primary)
      700: '#374151',  // Gray 700
      800: '#1f2937',  // Gray 800
      900: '#111827',  // Gray 900
      950: '#030712'   // Deepest gray
    },
    
    // Pharmaceutical background colors
    background: {
      primary: '#ffffff',      // Primary background
      secondary: '#f9fafb',    // Secondary background
      tertiary: '#f3f4f6',     // Tertiary background
      inverse: '#111827',      // Dark background
      clinical: '#f0fdf4',     // Clinical background
      warning: '#fffbeb',      // Warning background
      error: '#fef2f2',        // Error background
      info: '#eff6ff'          // Info background
    },
    
    // Text colors
    text: {
      primary: '#111827',      // Primary text
      secondary: '#4b5563',    // Secondary text
      tertiary: '#6b7280',     // Tertiary text
      inverse: '#ffffff',      // Inverse text
      link: '#2563eb',         // Link text
      linkHover: '#1d4ed8',    // Link hover
      success: '#166534',      // Success text
      warning: '#92400e',      // Warning text
      error: '#991b1b',        // Error text
      info: '#1e40af'          // Info text
    },
    
    // Border colors
    border: {
      primary: '#e5e7eb',      // Primary border
      secondary: '#d1d5db',    // Secondary border
      focus: '#3b82f6',        // Focus border
      success: '#22c55e',      // Success border
      warning: '#f59e0b',      // Warning border
      error: '#ef4444',        // Error border
      info: '#3b82f6'          // Info border
    }
  },
  
  // Typography System
  typography: {
    // Font families
    fontFamily: {
      pharmaceutical: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      medical: ['Source Sans Pro', 'Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', 'monospace'],
      display: ['Inter', 'system-ui', 'sans-serif']
    },
    
    // Font sizes with pharmaceutical context
    fontSize: {
      xs: '0.75rem',      // 12px - Small annotations
      sm: '0.875rem',     // 14px - Secondary text
      base: '1rem',       // 16px - Body text
      lg: '1.125rem',     // 18px - Large body
      xl: '1.25rem',      // 20px - Large text
      '2xl': '1.5rem',    // 24px - Small headings
      '3xl': '1.875rem',  // 30px - Medium headings
      '4xl': '2.25rem',   // 36px - Large headings
      '5xl': '3rem',      // 48px - Display text
      '6xl': '3.75rem',   // 60px - Hero text
      '7xl': '4.5rem',    // 72px - Large display
      '8xl': '6rem',      // 96px - Extra large display
      '9xl': '8rem'       // 128px - Maximum display
    },
    
    // Font weights
    fontWeight: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900'
    },
    
    // Line heights
    lineHeight: {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2'
    },
    
    // Letter spacing
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em'
    }
  },
  
  // Spacing System - Pharmaceutical Workflow Focused
  spacing: {
    // Base spacing scale
    0: '0',
    px: '1px',
    0.5: '0.125rem',   // 2px
    1: '0.25rem',      // 4px
    1.5: '0.375rem',   // 6px
    2: '0.5rem',       // 8px
    2.5: '0.625rem',   // 10px
    3: '0.75rem',      // 12px
    3.5: '0.875rem',   // 14px
    4: '1rem',         // 16px
    5: '1.25rem',      // 20px
    6: '1.5rem',       // 24px
    7: '1.75rem',      // 28px
    8: '2rem',         // 32px
    9: '2.25rem',      // 36px
    10: '2.5rem',      // 40px
    11: '2.75rem',     // 44px
    12: '3rem',        // 48px
    14: '3.5rem',      // 56px
    16: '4rem',        // 64px
    20: '5rem',        // 80px
    24: '6rem',        // 96px
    28: '7rem',        // 112px
    32: '8rem',        // 128px
    36: '9rem',        // 144px
    40: '10rem',       // 160px
    44: '11rem',       // 176px
    48: '12rem',       // 192px
    52: '13rem',       // 208px
    56: '14rem',       // 224px
    60: '15rem',       // 240px
    64: '16rem',       // 256px
    72: '18rem',       // 288px
    80: '20rem',       // 320px
    96: '24rem',       // 384px
    
    // Pharmaceutical specific spacing
    pharmaceutical: {
      compact: '0.5rem',     // Dense interfaces
      standard: '1rem',      // Standard spacing
      comfortable: '1.5rem', // Comfortable spacing
      spacious: '2rem',      // Spacious interfaces
      section: '3rem',       // Section spacing
      page: '4rem'           // Page-level spacing
    }
  },
  
  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',    // 2px
    base: '0.25rem',   // 4px
    md: '0.375rem',    // 6px
    lg: '0.5rem',      // 8px
    xl: '0.75rem',     // 12px
    '2xl': '1rem',     // 16px
    '3xl': '1.5rem',   // 24px
    full: '9999px',    // Circular
    
    // Pharmaceutical specific
    pharmaceutical: {
      card: '0.5rem',      // Card radius
      button: '0.375rem',  // Button radius
      input: '0.375rem',   // Input radius
      modal: '0.75rem',    // Modal radius
      widget: '0.5rem'     // Widget radius
    }
  },
  
  // Shadows
  boxShadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: 'none',
    
    // Pharmaceutical specific shadows
    pharmaceutical: {
      card: '0 2px 8px 0 rgb(0 0 0 / 0.08)',
      widget: '0 4px 12px 0 rgb(0 0 0 / 0.1)',
      modal: '0 20px 40px -4px rgb(0 0 0 / 0.2)',
      dropdown: '0 8px 24px 0 rgb(0 0 0 / 0.12)',
      focus: '0 0 0 3px rgb(59 130 246 / 0.3)'
    }
  },
  
  // Animation & Transitions
  animation: {
    duration: {
      instant: '0ms',
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
      slower: '750ms',
      slowest: '1000ms'
    },
    
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      
      // Custom pharmaceutical easing
      pharmaceutical: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        snap: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        gentle: 'cubic-bezier(0.25, 0.1, 0.25, 1)'
      }
    }
  },
  
  // Z-Index Scale
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
    
    // Pharmaceutical specific layers
    pharmaceutical: {
      navigation: 100,
      sidebar: 200,
      header: 300,
      content: 1,
      overlay: 1000,
      modal: 1100,
      toast: 1200,
      tooltip: 1300
    }
  },
  
  // Breakpoints for Pharmaceutical Responsive Design
  breakpoints: {
    // Mobile-first pharmaceutical breakpoints
    mobile: '320px',     // Field sales phones
    mobileLg: '414px',   // Large phones
    tablet: '768px',     // Field sales tablets
    tabletLg: '1024px',  // Large tablets
    laptop: '1280px',    // Office laptops
    desktop: '1440px',   // Office desktops
    wide: '1920px',      // Conference displays
    ultrawide: '2560px', // Ultra-wide displays
    
    // Pharmaceutical context breakpoints
    pharmaceutical: {
      fieldSales: '320px',    // Mobile field sales
      office: '1024px',       // Office interface
      conference: '1440px',   // Conference room
      presentation: '1920px'  // Presentation mode
    }
  }
} as const;

// Type definitions for pharmaceutical tokens
export type PharmaceuticalTokens = typeof pharmaceuticalTokens;
export type ColorScale = keyof typeof pharmaceuticalTokens.colors.primary;
export type SpacingScale = keyof typeof pharmaceuticalTokens.spacing;
export type FontSize = keyof typeof pharmaceuticalTokens.typography.fontSize;
export type FontWeight = keyof typeof pharmaceuticalTokens.typography.fontWeight;

// Export individual token categories
export const {
  colors,
  typography,
  spacing,
  borderRadius,
  boxShadow,
  animation,
  zIndex,
  breakpoints
} = pharmaceuticalTokens;