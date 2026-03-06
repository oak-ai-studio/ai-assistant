import { Platform } from 'react-native';
import { colors } from './tokens';

export const shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: colors.ink,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
    },
    android: { elevation: 2 },
    default: {},
  }),
  md: Platform.select({
    ios: {
      shadowColor: colors.ink,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
    },
    android: { elevation: 6 },
    default: {},
  }),
  lg: Platform.select({
    ios: {
      shadowColor: colors.ink,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.14,
      shadowRadius: 32,
    },
    android: { elevation: 12 },
    default: {},
  }),
  orange: Platform.select({
    ios: {
      shadowColor: colors.orange,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
    },
    android: { elevation: 8 },
    default: {},
  }),
};
