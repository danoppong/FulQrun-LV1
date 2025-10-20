// Responsive Design Utilities for Pharmaceutical Platform
import { pharmaceuticalTokens } from '../tokens/pharmaceutical-tokens';

// Breakpoint Utilities
export const breakpoints = pharmaceuticalTokens.breakpoints;

// Responsive Hook for JavaScript breakpoint detection
export const useResponsive = () => {
  if (typeof window === 'undefined') {
    return { 
      isMobile: false, 
      isTablet: false, 
      isDesktop: true,
      isLarge: false,
      currentBreakpoint: 'lg' as keyof typeof breakpoints
    };
  }

  const width = window.innerWidth;
  
  return {
    isMobile: width < parseInt(breakpoints.tablet),
    isTablet: width >= parseInt(breakpoints.tablet) && width < parseInt(breakpoints.laptop),
    isDesktop: width >= parseInt(breakpoints.laptop),
    isLarge: width >= parseInt(breakpoints.desktop),
    currentBreakpoint: width < parseInt(breakpoints.tablet) 
      ? 'mobile' as keyof typeof breakpoints
      : width < parseInt(breakpoints.laptop) 
        ? 'tablet' as keyof typeof breakpoints
        : width < parseInt(breakpoints.desktop)
          ? 'laptop' as keyof typeof breakpoints
          : 'desktop' as keyof typeof breakpoints
  };
};

// Responsive Grid System
export const gridClasses = {
  container: 'mx-auto px-4 sm:px-6 lg:px-8',
  containerFluid: 'w-full px-4 sm:px-6 lg:px-8',
  grid: 'grid',
  gridCols: {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
    12: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-12'
  },
  gap: {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-12'
  }
};

// Pharmaceutical-specific responsive patterns
export const pharmaceuticalResponsive = {
  dashboard: {
    kpiGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6',
    chartGrid: 'grid grid-cols-1 lg:grid-cols-2 gap-6',
    tableGrid: 'grid grid-cols-1 gap-6'
  },
  forms: {
    fieldGrid: 'grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6',
    buttonGroup: 'flex flex-col sm:flex-row gap-3 sm:gap-4',
    meddpiccGrid: 'grid grid-cols-1 lg:grid-cols-2 gap-6'
  },
  navigation: {
    desktop: 'hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64',
    mobile: 'lg:hidden',
    overlay: 'fixed inset-0 z-50 lg:hidden'
  }
};

// Typography Responsive Classes
export const typographyResponsive = {
  heading: {
    h1: 'text-2xl sm:text-3xl lg:text-4xl font-bold',
    h2: 'text-xl sm:text-2xl lg:text-3xl font-bold',
    h3: 'text-lg sm:text-xl lg:text-2xl font-semibold',
    h4: 'text-base sm:text-lg lg:text-xl font-semibold',
    h5: 'text-sm sm:text-base lg:text-lg font-medium',
    h6: 'text-xs sm:text-sm lg:text-base font-medium'
  },
  body: {
    large: 'text-base sm:text-lg',
    base: 'text-sm sm:text-base',
    small: 'text-xs sm:text-sm'
  }
};

// Spacing Responsive Classes
export const spacingResponsive = {
  section: 'py-8 sm:py-12 lg:py-16',
  component: 'p-4 sm:p-6 lg:p-8',
  margin: {
    bottom: {
      sm: 'mb-4 sm:mb-6',
      md: 'mb-6 sm:mb-8',
      lg: 'mb-8 sm:mb-12'
    },
    top: {
      sm: 'mt-4 sm:mt-6',
      md: 'mt-6 sm:mt-8',
      lg: 'mt-8 sm:mt-12'
    }
  }
};

// Pharmaceutical Color Utilities
export const pharmaceuticalColors = {
  medical: {
    primary: 'bg-medical-blue-600 text-white',
    secondary: 'bg-medical-blue-100 text-medical-blue-600',
    hover: 'hover:bg-medical-blue-700',
    border: 'border-medical-blue-200'
  },
  clinical: {
    primary: 'bg-clinical-green-600 text-white',
    secondary: 'bg-clinical-green-100 text-clinical-green-600',
    hover: 'hover:bg-clinical-green-700',
    border: 'border-clinical-green-200'
  },
  regulatory: {
    primary: 'bg-regulatory-red-600 text-white',
    secondary: 'bg-regulatory-red-100 text-regulatory-red-600',
    hover: 'hover:bg-regulatory-red-700',
    border: 'border-regulatory-red-200'
  },
  therapeutic: {
    primary: 'bg-therapeutic-purple-600 text-white',
    secondary: 'bg-therapeutic-purple-100 text-therapeutic-purple-600',
    hover: 'hover:bg-therapeutic-purple-700',
    border: 'border-therapeutic-purple-200'
  }
};

// Animation Utilities
export const animationClasses = {
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  slideDown: 'animate-slide-down',
  spin: 'animate-spin',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce'
};

// Component Size Variants
export const sizeVariants = {
  button: {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl'
  },
  input: {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  },
  card: {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-12'
  }
};

// Shadow Utilities
export const shadowClasses = {
  card: 'shadow-lg hover:shadow-xl transition-shadow duration-200',
  modal: 'shadow-2xl',
  dropdown: 'shadow-xl',
  pharmaceutical: 'shadow-lg shadow-medical-blue-100/50'
};

// Focus and State Classes
export const stateClasses = {
  focus: 'focus:outline-none focus:ring-2 focus:ring-medical-blue-500 focus:border-medical-blue-500',
  disabled: 'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100',
  loading: 'opacity-75 pointer-events-none',
  error: 'border-regulatory-red-500 focus:ring-regulatory-red-500 focus:border-regulatory-red-500'
};

// Pharmaceutical-specific utilities for common patterns
export const pharmaceuticalUtils = {
  kpiCard: `${sizeVariants.card.md} bg-white rounded-xl ${shadowClasses.card} border border-gray-100`,
  dashboardWidget: `${sizeVariants.card.lg} bg-white rounded-xl ${shadowClasses.pharmaceutical}`,
  formContainer: `${sizeVariants.card.lg} bg-white rounded-xl border border-gray-200`,
  navigationItem: 'px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150',
  pharmaceuticalButton: `${sizeVariants.button.md} ${pharmaceuticalColors.medical.primary} ${pharmaceuticalColors.medical.hover} rounded-lg font-medium transition-colors duration-200 ${stateClasses.focus}`,
  pharmaceuticalInput: `${sizeVariants.input.md} border rounded-lg transition-all duration-200 ${stateClasses.focus} bg-white`
};

// Export utility functions
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export const getResponsiveClasses = (
  base: string, 
  md?: string, 
  lg?: string, 
  xl?: string
): string => {
  return cn(
    base,
    md && `md:${md}`,
    lg && `lg:${lg}`,
    xl && `xl:${xl}`
  );
};

export const getPharmaceuticalVariant = (
  variant: 'medical' | 'clinical' | 'regulatory' | 'therapeutic' = 'medical',
  type: 'primary' | 'secondary' = 'primary'
): string => {
  return pharmaceuticalColors[variant][type];
};