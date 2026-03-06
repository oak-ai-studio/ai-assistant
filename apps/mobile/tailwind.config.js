/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        orange: { DEFAULT: '#E8571A', dim: '#C44A14', bg: '#F5E8E1' },
        sand: { DEFAULT: '#E8E4DC', dark: '#D6D0C4', light: '#F2EFE9' },
        ink: '#1A1814',
        'off-white': '#FAFAF8',
        success: { DEFAULT: '#3A8C5C', bg: '#E6F4ED' },
        danger: '#D94F3D',
      },
      fontFamily: {
        display: ['Syne_800ExtraBold'],
        'display-bold': ['Syne_700Bold'],
        body: ['DMSans_400Regular'],
        'body-medium': ['DMSans_500Medium'],
        mono: ['DMMonoRegular'],
      },
      borderRadius: {
        xs: 4,
        sm: 8,
        md: 14,
        lg: 20,
        xl: 28,
        full: 999,
      },
      boxShadow: {
        sm: '0 1px 3px rgba(26,24,20,0.08)',
        md: '0 4px 12px rgba(26,24,20,0.10)',
        lg: '0 12px 32px rgba(26,24,20,0.14)',
        orange: '0 6px 20px rgba(232,87,26,0.30)',
      },
    },
  },
  plugins: [],
};
