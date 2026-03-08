import { Pressable, StyleSheet, Text } from 'react-native';
import type { MemoryType } from '@ai-assistant/shared';
import { radius } from '@/constants/tokens';
import { typography } from '@/constants/typography';
import { MEMORY_TYPE_META, getMemoryTypeLabel } from '@/constants/memory';

type MemoryTypeTagProps = {
  type: MemoryType;
  selected?: boolean;
  onPress?: () => void;
};

export function MemoryTypeTag({ type, selected = false, onPress }: MemoryTypeTagProps) {
  const meta = MEMORY_TYPE_META[type];

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.tag,
        {
          backgroundColor: selected ? meta.bgColor : 'transparent',
          borderColor: selected ? meta.borderColor : meta.borderColor,
        },
      ]}
    >
      <Text style={[typography.mono, styles.text, { color: meta.color }]}>{getMemoryTypeLabel(type)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tag: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  text: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
