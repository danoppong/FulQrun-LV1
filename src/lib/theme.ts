export type Theme = 'light' | 'dark' | 'blue' | 'purple' | 'green' | 'orange'

export interface ThemeConfig {
  name: string
  colors: {
    background: string
    foreground: string
    card: string
    cardForeground: string
    popover: string
    popoverForeground: string
    primary: string
    primaryForeground: string
    secondary: string
    secondaryForeground: string
    muted: string
    mutedForeground: string
    accent: string
    accentForeground: string
    destructive: string
    destructiveForeground: string
    border: string
    input: string
    ring: string
  }
  gradients: {
    primary: string
    secondary: string
    success: string
    warning: string
  }
}

export const themes: Record<Theme, ThemeConfig> = {
  light: {
    name: 'Light',
    colors: {
      background: '#fafafa',
      foreground: '#0f172a',
      card: '#ffffff',
      cardForeground: '#0f172a',
      popover: '#ffffff',
      popoverForeground: '#0f172a',
      primary: '#3b82f6',
      primaryForeground: '#f8fafc',
      secondary: '#f1f5f9',
      secondaryForeground: '#0f172a',
      muted: '#f1f5f9',
      mutedForeground: '#64748b',
      accent: '#f1f5f9',
      accentForeground: '#0f172a',
      destructive: '#ef4444',
      destructiveForeground: '#f8fafc',
      border: '#e2e8f0',
      input: '#e2e8f0',
      ring: '#3b82f6',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      warning: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    },
  },
  dark: {
    name: 'Dark',
    colors: {
      background: '#0f172a',
      foreground: '#f8fafc',
      card: '#1e293b',
      cardForeground: '#f8fafc',
      popover: '#1e293b',
      popoverForeground: '#f8fafc',
      primary: '#3b82f6',
      primaryForeground: '#f8fafc',
      secondary: '#334155',
      secondaryForeground: '#f8fafc',
      muted: '#334155',
      mutedForeground: '#94a3b8',
      accent: '#334155',
      accentForeground: '#f8fafc',
      destructive: '#ef4444',
      destructiveForeground: '#f8fafc',
      border: '#334155',
      input: '#334155',
      ring: '#3b82f6',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      warning: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    },
  },
  blue: {
    name: 'Ocean Blue',
    colors: {
      background: '#f0f9ff',
      foreground: '#0c4a6e',
      card: '#ffffff',
      cardForeground: '#0c4a6e',
      popover: '#ffffff',
      popoverForeground: '#0c4a6e',
      primary: '#0ea5e9',
      primaryForeground: '#ffffff',
      secondary: '#e0f2fe',
      secondaryForeground: '#0c4a6e',
      muted: '#e0f2fe',
      mutedForeground: '#0369a1',
      accent: '#e0f2fe',
      accentForeground: '#0c4a6e',
      destructive: '#ef4444',
      destructiveForeground: '#ffffff',
      border: '#bae6fd',
      input: '#bae6fd',
      ring: '#0ea5e9',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
      secondary: 'linear-gradient(135deg, #7dd3fc 0%, #0ea5e9 100%)',
      success: 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)',
      warning: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    },
  },
  purple: {
    name: 'Royal Purple',
    colors: {
      background: '#faf5ff',
      foreground: '#581c87',
      card: '#ffffff',
      cardForeground: '#581c87',
      popover: '#ffffff',
      popoverForeground: '#581c87',
      primary: '#8b5cf6',
      primaryForeground: '#ffffff',
      secondary: '#f3e8ff',
      secondaryForeground: '#581c87',
      muted: '#f3e8ff',
      mutedForeground: '#7c3aed',
      accent: '#f3e8ff',
      accentForeground: '#581c87',
      destructive: '#ef4444',
      destructiveForeground: '#ffffff',
      border: '#d8b4fe',
      input: '#d8b4fe',
      ring: '#8b5cf6',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      secondary: 'linear-gradient(135deg, #c4b5fd 0%, #8b5cf6 100%)',
      success: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
      warning: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    },
  },
  green: {
    name: 'Forest Green',
    colors: {
      background: '#f0fdf4',
      foreground: '#14532d',
      card: '#ffffff',
      cardForeground: '#14532d',
      popover: '#ffffff',
      popoverForeground: '#14532d',
      primary: '#22c55e',
      primaryForeground: '#ffffff',
      secondary: '#dcfce7',
      secondaryForeground: '#14532d',
      muted: '#dcfce7',
      mutedForeground: '#16a34a',
      accent: '#dcfce7',
      accentForeground: '#14532d',
      destructive: '#ef4444',
      destructiveForeground: '#ffffff',
      border: '#bbf7d0',
      input: '#bbf7d0',
      ring: '#22c55e',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      secondary: 'linear-gradient(135deg, #86efac 0%, #22c55e 100%)',
      success: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
      warning: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    },
  },
  orange: {
    name: 'Sunset Orange',
    colors: {
      background: '#fff7ed',
      foreground: '#9a3412',
      card: '#ffffff',
      cardForeground: '#9a3412',
      popover: '#ffffff',
      popoverForeground: '#9a3412',
      primary: '#f97316',
      primaryForeground: '#ffffff',
      secondary: '#fed7aa',
      secondaryForeground: '#9a3412',
      muted: '#fed7aa',
      mutedForeground: '#ea580c',
      accent: '#fed7aa',
      accentForeground: '#9a3412',
      destructive: '#ef4444',
      destructiveForeground: '#ffffff',
      border: '#fdba74',
      input: '#fdba74',
      ring: '#f97316',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      secondary: 'linear-gradient(135deg, #fed7aa 0%, #f97316 100%)',
      success: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
      warning: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    },
  },
}

export function getThemeCSS(theme: Theme): string {
  const config = themes[theme]
  
  return `
    :root {
      --background: ${config.colors.background};
      --foreground: ${config.colors.foreground};
      --card: ${config.colors.card};
      --card-foreground: ${config.colors.cardForeground};
      --popover: ${config.colors.popover};
      --popover-foreground: ${config.colors.popoverForeground};
      --primary: ${config.colors.primary};
      --primary-foreground: ${config.colors.primaryForeground};
      --secondary: ${config.colors.secondary};
      --secondary-foreground: ${config.colors.secondaryForeground};
      --muted: ${config.colors.muted};
      --muted-foreground: ${config.colors.mutedForeground};
      --accent: ${config.colors.accent};
      --accent-foreground: ${config.colors.accentForeground};
      --destructive: ${config.colors.destructive};
      --destructive-foreground: ${config.colors.destructiveForeground};
      --border: ${config.colors.border};
      --input: ${config.colors.input};
      --ring: ${config.colors.ring};
      
      --gradient-primary: ${config.gradients.primary};
      --gradient-secondary: ${config.gradients.secondary};
      --gradient-success: ${config.gradients.success};
      --gradient-warning: ${config.gradients.warning};
    }
  `
}

export function applyTheme(theme: Theme) {
  // Only apply theme on client side to prevent hydration mismatches
  if (typeof window === 'undefined') return
  
  const css = getThemeCSS(theme)
  
  // Remove existing theme style
  const existingStyle = document.getElementById('theme-style')
  if (existingStyle) {
    existingStyle.remove()
  }
  
  // Add new theme style
  const style = document.createElement('style')
  style.id = 'theme-style'
  style.textContent = css
  document.head.appendChild(style)
  
  // Control Tailwind's dark mode class based on theme
  const htmlElement = document.documentElement
  if (theme === 'dark') {
    htmlElement.classList.add('dark')
  } else {
    htmlElement.classList.remove('dark')
  }
  
  // Store theme preference
  localStorage.setItem('theme', theme)
}

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  
  const stored = localStorage.getItem('theme')
  return (stored as Theme) || 'light'
}
