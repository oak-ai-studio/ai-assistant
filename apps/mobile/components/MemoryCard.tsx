import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MemoryType } from '@ai-assistant/shared';
import { colors, radius } from '@/constants/tokens';
import { typography } from '@/constants/typography';
import { shadows } from '@/constants/shadows';
import { formatMemoryListTime, getMemoryGroupLabel } from '@/constants/memory';
import { MemoryTypeTag } from '@/components/MemoryTypeTag';

type MemoryCardProps = {
  memory: {
    id: string;
    content: string;
    type: MemoryType;
    updatedAt: string;
  };
  onPress: () => void;
};

export function MemoryCard({ memory, onPress }: MemoryCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <Text style={[typography.bodyL, styles.content]} numberOfLines={3}>
        {memory.content}
      </Text>
      <View style={styles.metaRow}>
        <MemoryTypeTag type={memory.type} />
        <Text style={[typography.caption, styles.time]}>{formatMemoryListTime(memory.updatedAt)}</Text>
      </View>
      <Text style={[typography.caption, styles.groupText]}>{getMemoryGroupLabel(memory.type)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ink10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
    ...shadows.sm,
  },
  content: {
    color: colors.ink,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  time: {
    color: colors.ink30,
  },
  groupText: {
    color: colors.ink60,
  },
});
