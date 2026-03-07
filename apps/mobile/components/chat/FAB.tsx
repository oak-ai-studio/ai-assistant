import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '@/constants/tokens';
import { shadows } from '@/constants/shadows';

type FABProps = {
  bottom: number;
  onPress: () => void;
};

export function FAB({ bottom, onPress }: FABProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="打开对话抽屉"
      onPress={onPress}
      style={[styles.fab, { bottom }]}
    >
      <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 24,
    zIndex: 40,
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.orange,
  },
});
