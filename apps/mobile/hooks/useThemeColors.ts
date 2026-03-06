import { useColorScheme } from 'nativewind';
import { dark, light } from '@/constants/tokens';

export function useThemeColors() {
  const { colorScheme } = useColorScheme();
  return colorScheme === 'dark' ? dark : light;
}
