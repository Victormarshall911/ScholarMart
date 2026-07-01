/**
 * ScholarMart Premium Design System Tokens & Global Theme Architecture
 * Designed to align with Apple, Stripe, Linear, and Airbnb design aesthetics.
 */

// 1. Spacing System (8pt Grid)
export const Spacing = {
  space_05: '4px',
  space_1: '8px',
  space_2: '16px',
  space_3: '24px',
  space_4: '32px',
  space_6: '48px',
  space_8: '64px',
};

// 2. Radius Scale
export const Radius = {
  xs: '6px',
  sm: '10px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  full: '9999px',
};

// 3. Typography System
export const Typography = {
  fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  sizes: {
    xs: '11px',
    sm: '12px',
    body_sm: '13px',
    body_md: '14px',
    body_lg: '15px',
    h5: '17px',
    h4: '19px',
    h3: '20px',
    h2: '22px',
    h1: '26px',
    display: '28px',
  },
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  lineHeights: {
    tight: 1.15,
    snug: 1.25,
    normal: 1.35,
    relaxed: 1.5,
    loose: 1.65,
  },
};

// 4. Animation & Motion tokens
export const Motion = {
  duration: {
    fast: '0.15s',
    normal: '0.3s',
    slow: '0.5s',
  },
  curves: {
    easeOutExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
};

// 5. Elevation Scale (Z-Index Library)
export const Elevation = {
  base: 1,
  header: 100,
  nav: 200,
  fab: 210,
  drawer: 250,
  autocomplete: 300,
  modal: 500,
  splash: 9999,
  toast: 99999,
};

// 6. Complete Color System (Hex values for brand, backgrounds, and neutrals)
export const Colors = {
  // Brand Colors (Elegant Green & Sophisticated Orange)
  green: {
    primary: '#00A86B',      // Trust Emerald (Light mode default)
    primaryHover: '#008f5a',
    primaryLight: 'rgba(0, 168, 107, 0.07)',
    primaryGlow: 'rgba(0, 168, 107, 0.15)',
    darkPrimary: '#00C880',  // Brighter Emerald for Dark mode
    darkHover: '#00A86B',
    darkLight: 'rgba(0, 200, 128, 0.1)',
    darkGlow: 'rgba(0, 200, 128, 0.22)',
  },
  orange: {
    primary: '#FF6B00',      // Warm excitement
    primaryHover: '#e56000',
    primaryLight: 'rgba(255, 107, 0, 0.08)',
    primaryGlow: 'rgba(255, 107, 0, 0.18)',
    darkPrimary: '#FF7D1F',  // Premium Coral Orange for dark mode
    darkHover: '#FF6B00',
    darkLight: 'rgba(255, 125, 31, 0.1)',
    darkGlow: 'rgba(255, 125, 31, 0.2)',
  },
  
  // Status Colors
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',

  // Semantic Categories
  categories: {
    electronics: { color: '#ff6b00', bg: 'rgba(255,107,0,0.08)' },
    fashion: { color: '#ff6b00', bg: 'rgba(255,107,0,0.08)' },
    books: { color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
    hostels: { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
    gadgets: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
    creative: { color: '#ec4899', bg: 'rgba(236,72,153,0.08)' },
    beauty: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
    sports: { color: '#06b6d4', bg: 'rgba(6,182,212,0.08)' },
    others: { color: '#64748b', bg: 'rgba(100,116,139,0.08)' },
    whatsapp: { color: '#fff', bg: '#25D366', glow: 'rgba(37, 211, 102, 0.25)' },
  },
};

// 7. Light Theme Specification
export const LightTheme = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceHover: '#F1F5F9',
  surfaceElevated: '#FFFFFF',
  bgCard: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  borderHover: '#CBD5E1',
  borderFocus: '#00A86B',
  shadows: {
    sm: '0 1px 3px rgba(15, 23, 42, 0.03)',
    md: '0 4px 14px rgba(15, 23, 42, 0.05)',
    lg: '0 12px 30px rgba(15, 23, 42, 0.07)',
    xl: '0 20px 40px rgba(15, 23, 42, 0.1)',
    green: '0 8px 24px rgba(0, 168, 107, 0.18)',
    orange: '0 8px 24px rgba(255, 107, 0, 0.18)',
  },
};

// 8. Dark Theme Specification
export const DarkTheme = {
  background: '#090D16',
  surface: '#0F1524',
  surfaceHover: '#172036',
  surfaceElevated: '#151F38',
  bgCard: '#0F1524',
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#64748B',
  border: '#1E293B',
  borderHover: '#334155',
  borderFocus: '#00C880',
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
    md: '0 4px 16px rgba(0, 0, 0, 0.4)',
    lg: '0 12px 30px rgba(0, 0, 0, 0.45)',
    xl: '0 24px 48px rgba(0, 0, 0, 0.55)',
    green: '0 8px 24px rgba(0, 200, 128, 0.22)',
    orange: '0 8px 24px rgba(255, 125, 31, 0.22)',
  },
};

// 9. Gradient Library
export const Gradients = {
  greenHero: 'linear-gradient(135deg, var(--primary-green) 0%, #007D54 60%, #00593B 100%)',
  orangeBanner: 'linear-gradient(135deg, var(--primary-orange) 0%, var(--primary-orange-hover) 100%)',
  btnPrimary: 'linear-gradient(135deg, var(--primary-green) 0%, var(--primary-green-hover) 100%)',
  btnOrange: 'linear-gradient(135deg, var(--primary-orange) 0%, var(--primary-orange-hover) 100%)',
  darkHeader: 'linear-gradient(135deg, #090D16 0%, #151e33 100%)',
  legalHeader: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
};

// 10. ThemeData object
export const ThemeData = {
  light: LightTheme,
  dark: DarkTheme,
  gradients: Gradients,
  elevation: Elevation,
  motion: Motion,
  typography: Typography,
  radius: Radius,
  spacing: Spacing,
};

// 11. Global Constants
export const GlobalConstants = {
  campuses: ['Uli', 'Igbariam', 'Awka'],
  categories: [
    'Textbooks',
    'Electronics',
    'Fashion & Clothing',
    'Hostel Essentials',
    'Gadgets',
    'Creative & Handmade',
    'Beauty & Personal Care',
    'Sports & Fitness',
    'Others',
  ],
  whatsappSupportNumber: '2347014109517',
  supportEmail: 'support@scholarmart.com',
};

// Guidelines:
// - Always prefer using CSS variables like var(--primary-green) in components
// - For dynamic inline styles, import this file and query ThemeData
export default ThemeData;
