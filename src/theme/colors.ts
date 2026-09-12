export const COLORS = {
  // Monochromatic Dark Canvas & Surfaces
  background: '#090A0E',        // Deep pitch graphite canvas
  surface: '#121419',           // Primary card surface
  surfaceSubtle: '#181A21',     // Secondary tile surface
  surfaceElevated: '#20222B',   // Elevated bottom bar / modals
  surfaceHighlight: '#2A2C37',  // Interactive / pressed state

  // Monochromatic Borders
  border: '#23252E',            // Subtle card border
  borderSubtle: '#1A1C23',      // Row separator
  borderActive: '#FFFFFF',      // Active / focused stroke
  borderMuted: '#2E303C',

  // HEEYAKU Brand Identity (Header & Signature)
  brandNavy: '#0B1F33',         // Official HEEYAKU Navy
  brandBlue: '#2563EB',         // HEEYAKU Electric Blue dot
  brandCyan: '#38BDF8',         // "Call Tracker • Pro" subtitle accent
  brandSubtle: 'rgba(56, 189, 248, 0.1)',

  // Monochromatic Semantic Tones (No multicolor circus)
  monoWhite: '#FFFFFF',
  monoSilver: '#E2E8F0',
  monoMuted: '#64748B',
  monoDark: '#1E293B',

  // Clean status indicators (subtle & restrained)
  statusActive: '#FFFFFF',
  statusInactive: '#64748B',
  statusDot: '#38BDF8',

  // Typography
  textPrimary: '#F8FAFC',       // Pure high-contrast white
  textSecondary: '#94A3B8',     // Muted slate gray
  textTertiary: '#64748B',      // Inactive / subtle labels
  textInverse: '#090A0E',       // Text on white accents
  white: '#FFFFFF',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADII = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  full: 9999,
};

export const THEME = {
  colors: COLORS,
  spacing: SPACING,
  radii: RADII,
};

export default THEME;
