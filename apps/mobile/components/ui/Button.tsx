import { Pressable, Text, ActivityIndicator, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, radius } from '@/constants/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'default' | 'sm' | 'icon';

interface ButtonProps {
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
}

const variantStyles = {
  primary:   { bg: colors.orange,    text: '#fff',        border: 'transparent' },
  secondary: { bg: 'transparent',    text: colors.ink,    border: colors.ink30  },
  ghost:     { bg: colors.sandLight, text: colors.ink60,  border: 'transparent' },
  danger:    { bg: 'transparent',    text: colors.danger, border: 'rgba(217,79,61,0.3)' },
};

const sizeContainerStyles: Record<Size, ViewStyle> = {
  default: { paddingHorizontal: 22, paddingVertical: 12 },
  sm:      { paddingHorizontal: 14, paddingVertical: 7 },
  icon:    { width: 44, height: 44, padding: 0 },
};

const sizeTextStyles: Record<Size, { fontSize: number }> = {
  default: { fontSize: 14 },
  sm:      { fontSize: 12 },
  icon:    { fontSize: 14 },
};

export function Button({
  variant = 'primary',
  size = 'default',
  disabled,
  loading,
  onPress,
  children,
  style,
}: ButtonProps) {
  const scale = useSharedValue(1);
  const v = variantStyles[variant];
  const containerS = sizeContainerStyles[size];
  const textS = sizeTextStyles[size];

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 20, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 20, stiffness: 200 });
      }}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <Animated.View
        style={[
          animStyle,
          {
            backgroundColor: disabled ? colors.orange50 : v.bg,
            borderRadius: radius.full,
            borderWidth: v.border !== 'transparent' ? 1.5 : 0,
            borderColor: v.border,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            opacity: disabled ? 0.5 : 1,
          },
          containerS,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={v.text} />
        ) : typeof children === 'string' ? (
          <Text
            style={{
              fontFamily: 'DMSans_500Medium',
              fontSize: textS.fontSize,
              color: disabled ? v.text : v.text,
            }}
          >
            {children}
          </Text>
        ) : (
          children
        )}
      </Animated.View>
    </Pressable>
  );
}
