import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MotiView } from 'moti';
import { colors, radius } from '@/constants/tokens';
import { typography } from '@/constants/typography';
import type { ToastVariant } from '@/hooks/useToast';

type ToastProps = {
  visible: boolean;
  message: string;
  onHide: () => void;
  variant?: ToastVariant;
  duration?: number;
};

const toneStyles: Record<ToastVariant, { bg: string; border: string; text: string }> = {
  error: {
    bg: 'rgba(217,79,61,0.14)',
    border: 'rgba(217,79,61,0.32)',
    text: colors.danger,
  },
  success: {
    bg: colors.successBg,
    border: 'rgba(58,140,92,0.25)',
    text: colors.success,
  },
};

export function Toast({
  visible,
  message,
  onHide,
  variant = 'error',
  duration = 2200,
}: ToastProps) {
  useEffect(() => {
    if (!visible || message.length === 0) {
      return;
    }

    const timer = setTimeout(() => {
      onHide();
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [duration, message, onHide, visible]);

  if (!visible || message.length === 0) {
    return null;
  }

  const tone = toneStyles[variant];

  return (
    <View pointerEvents="box-none" style={styles.container}>
      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 180 }}
        style={[
          styles.toast,
          {
            backgroundColor: tone.bg,
            borderColor: tone.border,
          },
        ]}
      >
        <Text style={[typography.bodyM, styles.text, { color: tone.text }]}>{message}</Text>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
    zIndex: 80,
  },
  toast: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  text: {
    textAlign: 'center',
  },
});
