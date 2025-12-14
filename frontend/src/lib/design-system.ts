/**
 * SEKA Design System
 * Central configuration for colors, spacing, typography, and components
 * Ensures consistency across the entire application
 */

// ========== COLOR PALETTE ==========
export const COLORS = {
  // Primary brand colors (Teal/Dark Green)
  primary: {
    50: '#e6f2f1',
    100: '#b3d9d6',
    200: '#80c0ba',
    300: '#4da79d',
    400: '#268e81',
    500: '#0d4a44',  // Main brand color
    600: '#0a3d38',  // Hover state
    700: '#08302c',
    800: '#062320',
    900: '#041614',
  },
  
  // Accent colors for secondary actions
  accent: {
    cyan: '#06b6d4',
    blue: '#3b82f6',
    purple: '#8b5cf6',
    orange: '#f97316',
    teal: '#14b8a6',
  },

  // Status colors for feedback
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
  },

  // Neutral colors for backgrounds and text
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

// ========== SPACING ==========
export const SPACING = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '2.5rem', // 40px
  '3xl': '3rem',   // 48px
};

// ========== BORDER RADIUS ==========
export const BORDER_RADIUS = {
  none: '0',
  sm: '0.375rem',   // 6px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.5rem',  // 24px
};

// ========== SHADOWS ==========
export const SHADOWS = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
};

// ========== TYPOGRAPHY ==========
export const FONT_SIZES = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
};

export const FONT_WEIGHTS = {
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

// ========== BUTTON VARIANTS ==========
export const BUTTON_VARIANTS = {
  primary: {
    bg: 'bg-primary-500',
    text: 'text-white',
    hover: 'hover:bg-primary-600',
    active: 'active:bg-primary-700',
    focus: 'focus:ring-primary-500',
  },
  secondary: {
    bg: 'bg-neutral-100',
    text: 'text-neutral-900',
    hover: 'hover:bg-neutral-200',
    active: 'active:bg-neutral-300',
    focus: 'focus:ring-neutral-300',
  },
  danger: {
    bg: 'bg-status-danger',
    text: 'text-white',
    hover: 'hover:bg-red-700',
    active: 'active:bg-red-800',
    focus: 'focus:ring-status-danger',
  },
  success: {
    bg: 'bg-status-success',
    text: 'text-white',
    hover: 'hover:bg-green-600',
    active: 'active:bg-green-700',
    focus: 'focus:ring-status-success',
  },
};

// ========== FORM VARIANTS ==========
export const INPUT_VARIANTS = {
  default: 'border-neutral-200 bg-white',
  subtle: 'border-transparent bg-neutral-100',
  error: 'border-2 border-status-danger focus:ring-status-danger/20',
};

// ========== LAYOUT BREAKPOINTS ==========
export const BREAKPOINTS = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// ========== Z-INDEX SCALE ==========
export const Z_INDEX = {
  hide: -1,
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modal: 40,
  popover: 50,
  tooltip: 60,
};

// ========== TRANSITIONS ==========
export const TRANSITIONS = {
  fast: 'transition-all duration-150',
  normal: 'transition-all duration-200',
  slow: 'transition-all duration-300',
};

// ========== COMMON UTILITIES ==========
export const UTILITIES = {
  // Card containers
  card: 'bg-white border border-neutral-200 rounded-lg shadow-sm',
  cardElevated: 'bg-white border border-neutral-100 rounded-lg shadow-lg',
  cardOutlined: 'bg-transparent border border-neutral-300 rounded-lg',

  // Form inputs
  inputBase: 'block w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:ring-2 transition-colors',
  inputDefault: 'border-neutral-200 bg-white focus:ring-primary-500/20 focus:border-primary-500',

  // Buttons
  buttonBase: 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',

  // Typography
  headingLg: 'text-2xl font-bold text-neutral-900',
  headingMd: 'text-xl font-semibold text-neutral-900',
  headingSm: 'text-lg font-semibold text-neutral-900',
  textBase: 'text-base text-neutral-700',
  textSm: 'text-sm text-neutral-600',
  textXs: 'text-xs text-neutral-500',

  // Spacing utilities
  sectionPadding: 'px-6 py-8',
  containerPadding: 'px-4 py-4',
  gridGap: 'gap-6',
};
