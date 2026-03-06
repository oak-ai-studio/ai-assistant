import { StyleSheet } from 'react-native';
import { fontSize } from './tokens';

export const typography = StyleSheet.create({
  display: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: fontSize.display,
    lineHeight: fontSize.display * 0.95,
    letterSpacing: -0.8,
  },
  titleL: {
    fontFamily: 'Syne_700Bold',
    fontSize: fontSize.titleL,
    lineHeight: fontSize.titleL * 1.2,
  },
  titleM: {
    fontFamily: 'Syne_700Bold',
    fontSize: fontSize.titleM,
    lineHeight: fontSize.titleM * 1.3,
  },
  bodyL: {
    fontFamily: 'DMSans_400Regular',
    fontSize: fontSize.bodyL,
    lineHeight: fontSize.bodyL * 1.6,
  },
  bodyM: {
    fontFamily: 'DMSans_400Regular',
    fontSize: fontSize.bodyM,
    lineHeight: fontSize.bodyM * 1.6,
  },
  caption: {
    fontFamily: 'DMSans_400Regular',
    fontSize: fontSize.caption,
    lineHeight: fontSize.caption * 1.5,
  },
  mono: {
    fontFamily: 'DMMonoRegular',
    fontSize: fontSize.mono,
    letterSpacing: 0.6,
  },
});
