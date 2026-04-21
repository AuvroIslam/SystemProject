/**
 * Atelier Design System — colour + typography tokens
 * Translated from the Material 3 custom-colour HTML design system.
 */

export const C = {
  // Surfaces
  surface: '#fff8f7',
  surfaceBright: '#fff8f7',
  surfaceDim: '#e0d8d8',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#faf2f2',
  surfaceContainer: '#f4ecec',
  surfaceContainerHigh: '#eee6e6',
  surfaceContainerHighest: '#e8e1e1',
  surfaceVariant: '#e8e1e1',

  // Glass
  glass: 'rgba(241,233,233,0.80)',

  // Primary
  primary: '#000000',
  primaryContainer: '#15173d',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#7e80ac',
  onPrimaryFixed: '#15173d',
  onPrimaryFixedVariant: '#41436b',
  primaryFixedDim: '#c1c3f3',

  // Secondary (magenta)
  secondary: '#9d2a9d',
  secondaryContainer: '#fe82f7',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#7b007d',
  secondaryFixedDim: '#ffaaf5',

  // Tertiary
  tertiary: '#000000',
  tertiaryContainer: '#3a0030',
  onTertiaryContainer: '#b76aa0',
  tertiaryFixedDim: '#ffade3',

  // Error
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onError: '#ffffff',
  onErrorContainer: '#93000a',

  // On-surface
  onSurface: '#1e1b1b',
  onSurfaceVariant: '#46464e',
  onBackground: '#1e1b1b',

  // Outline
  outline: '#77767f',
  outlineVariant: '#c7c5cf',

  // Inverse
  inverseSurface: '#332f30',
  inverseOnSurface: '#f7efef',
  inversePrimary: '#c1c3f3',

  // Accent alias used in mockups
  accent: '#982598',
  accentLight: '#E491C9',
} as const;

export const FONT = {
  headline: 'System', // fallback — Manrope if installed
  body: 'System',     // fallback — Inter if installed
  label: 'System',
} as const;

/**
 * Re-usable shadow presets
 */
export const SHADOW = {
  card: {
    shadowColor: C.primaryContainer,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.04,
    shadowRadius: 32,
    elevation: 4,
  },
  navBottom: {
    shadowColor: C.primaryContainer,
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 8,
  },
  button: {
    shadowColor: C.secondary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 6,
  },
} as const;
