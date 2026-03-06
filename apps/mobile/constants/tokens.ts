export const colors = {
  sand: '#E8E4DC',
  sandDark: '#D6D0C4',
  sandLight: '#F2EFE9',
  ink: '#1A1814',
  offWhite: '#FAFAF8',
  orange: '#E8571A',
  orangeDim: '#C44A14',
  orangeBg: '#F5E8E1',
  success: '#3A8C5C',
  successBg: '#E6F4ED',
  danger: '#D94F3D',

  ink80: 'rgba(26,24,20,0.80)',
  ink60: 'rgba(26,24,20,0.60)',
  ink30: 'rgba(26,24,20,0.30)',
  ink10: 'rgba(26,24,20,0.10)',
  ink05: 'rgba(26,24,20,0.05)',

  orange80: 'rgba(232,87,26,0.80)',
  orange50: 'rgba(232,87,26,0.50)',
  orange20: 'rgba(232,87,26,0.20)',
  orange10: 'rgba(232,87,26,0.10)',
};

export const light = {
  bg: colors.sand,
  surface: colors.offWhite,
  surfaceSub: colors.sandLight,
  border: colors.ink10,
  borderStrong: colors.ink30,
  text: colors.ink,
  textSub: colors.ink60,
  textDisabled: colors.ink30,
  accent: colors.orange,
  accentHover: colors.orangeDim,
};

export const dark = {
  bg: '#141210',
  surface: '#1F1D19',
  surfaceSub: '#2A2823',
  border: 'rgba(232,228,220,0.10)',
  borderStrong: 'rgba(232,228,220,0.22)',
  text: colors.sand,
  textSub: 'rgba(232,228,220,0.55)',
  textDisabled: 'rgba(232,228,220,0.25)',
  accent: colors.orange,
  accentHover: colors.orangeDim,
};

export const spacing = {
  1: 2,
  2: 4,
  3: 8,
  4: 12,
  5: 16,
  6: 20,
  8: 24,
  10: 32,
  12: 40,
  16: 48,
  20: 64,
};

export const radius = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
};

export const fontSize = {
  display: 40,
  titleL: 22,
  titleM: 16,
  bodyL: 15,
  bodyM: 13,
  caption: 11,
  mono: 11,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  bold: '700' as const,
  black: '800' as const,
};

export const duration = {
  instant: 80,
  fast: 160,
  normal: 240,
  slow: 380,
  enter: 420,
};
