export const D = {
  // Backgrounds
  bg:          '#F0EEFF',
  bgAlt:       '#E9E6F8',
  card:        '#FFFFFF',
  cardMuted:   '#F7F5FF',

  // Primary — soft purple
  primary:     '#7C6EF5',
  primaryDark: '#5A4FBF',
  primaryLight:'#EDE9FD',
  primaryMuted:'#C3BDFB',
  onPrimary:   '#FFFFFF',

  // Accent — soft green
  accent:      '#7ED66A',
  accentDark:  '#5AAE48',
  accentLight: '#E4F7DC',
  onAccent:    '#FFFFFF',

  // Text
  text:        '#1E1B40',
  textMuted:   '#8A87AA',
  textLight:   '#C0BCE8',
  onCard:      '#1E1B40',

  // Danger — soft red/pink
  danger:      '#FF6B8A',
  dangerLight: '#FFE4EC',
  onDanger:    '#FFFFFF',

  // Warning — amber
  warning:     '#FFB76B',
  warningLight:'#FFF0DC',

  // Borders & dividers
  border:      '#E9E5FB',
  divider:     '#F2F0FB',

  // Medal colors
  gold:   '#FFD84D',
  silver: '#C8C8D8',
  bronze: '#E8A87C',
} as const;

export const R = {
  card:   20,
  cardLg: 24,
  pill:   999,
  chip:   999,
  sm:     10,
  md:     14,
  lg:     18,
} as const;

export const SP = {
  xs:   4,
  sm:   8,
  md:  12,
  base:16,
  lg:  20,
  xl:  24,
  xxl: 32,
  xxxl:48,
} as const;

export const SH = {
  card: {
    shadowColor: '#7C6EF5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 4,
  },
  button: {
    shadowColor: '#7C6EF5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  soft: {
    shadowColor: '#7C6EF5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;
