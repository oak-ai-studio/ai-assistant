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
  primary:   { bg: colors.orange,    disabledBg: colors.orange50, text: '#fff',        border: 'transparent' },
  secondary: { bg: 'transparent',    disabledBg: 'transparent',   text: colors.ink,    border: colors.ink30  },
  ghost:     { bg: colors.sandLight, disabledBg: colors.sandLight,text: colors.ink60,  border: 'transparent' },
  danger:    { bg: colors.offWhite,  disabledBg: colors.offWhite, text: colors.danger, border: 'rgba(217,79,61,0.35)' },
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

const LAYOUT_KEYS = new Set(['flex', 'flexGrow', 'flexShrink', 'flexBasis', 'alignSelf', 'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'marginHorizontal', 'marginVertical']);

function splitStyle(s?: ViewStyle): { layout: ViewStyle; visual: ViewStyle } {
  if (!s) return { layout: {}, visual: {} };
  const layout: Record<string, unknown> = {};
  const visual: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(s)) {
    if (LAYOUT_KEYS.has(k)) {
      layout[k] = val;
    } else {
      visual[k] = val;
    }
  }
  return { layout: layout as ViewStyle, visual: visual as ViewStyle };
}

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
  const { layout, visual } = splitStyle(style);

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
      style={layout}
    >
      <Animated.View
        style={[
          animStyle,
          {
            backgroundColor: disabled ? v.disabledBg : v.bg,
            borderRadius: radius.full,
            borderWidth: v.border !== 'transparent' ? 1.5 : 0,
            borderColor: v.border,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            opacity: disabled ? 0.6 : 1,
          },
          containerS,
          visual,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={v.text} />
        ) : typeof children === 'string' ? (
          <Text
            style={{
              fontFamily: 'DMSans_500Medium',
              fontSize: textS.fontSize,
              color: v.text,
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
