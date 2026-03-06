import { View, Text } from 'react-native';
import { colors, radius } from '@/constants/tokens';

type Variant = 'orange' | 'ink' | 'ghost' | 'success';

const variantStyles = {
  orange:  { bg: colors.orangeBg,  text: colors.orangeDim, border: 'rgba(232,87,26,0.18)' },
  ink:     { bg: colors.ink,       text: colors.sand,      border: 'transparent' },
  ghost:   { bg: 'transparent',    text: colors.ink60,     border: colors.ink10 },
  success: { bg: colors.successBg, text: colors.success,   border: 'rgba(58,140,92,0.2)' },
};

export function Badge({
  variant = 'orange',
  children,
}: {
  variant?: Variant;
  children: string;
}) {
  const v = variantStyles[variant];
  return (
    <View
      style={{
        backgroundColor: v.bg,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: v.border,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{ fontFamily: 'DMMonoRegular', fontSize: 11, color: v.text }}
      >
        {children}
      </Text>
    </View>
  );
}
