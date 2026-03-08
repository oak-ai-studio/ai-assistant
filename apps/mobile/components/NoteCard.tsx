import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/constants/tokens';
import { typography } from '@/constants/typography';
import { shadows } from '@/constants/shadows';
import { formatNoteListTime, type NoteListItem } from '@/constants/notes';

const getNoteTitle = (note: NoteListItem) =>
  note.title && note.title.trim().length > 0 ? note.title.trim() : '未命名笔记';

const getNoteSnippet = (note: NoteListItem) => {
  const lines = note.content.split('\n').map((line) => line.trim()).filter(Boolean);
  return lines[0] ?? note.content.trim();
};

type NoteCardProps = {
  note: NoteListItem;
  onPress: () => void;
};

export function NoteCard({ note, onPress }: NoteCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <Text style={[typography.titleM, styles.title]} numberOfLines={1}>
        {getNoteTitle(note)}
      </Text>
      <Text style={[typography.bodyM, styles.content]} numberOfLines={2}>
        {getNoteSnippet(note)}
      </Text>
      <View style={styles.metaRow}>
        <Text style={[typography.caption, styles.time]}>
          更新 {formatNoteListTime(note.updatedAt)}
        </Text>
      </View>
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
    gap: 8,
    ...shadows.sm,
  },
  title: {
    color: colors.ink,
  },
  content: {
    color: colors.ink60,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  time: {
    color: colors.ink30,
  },
});
