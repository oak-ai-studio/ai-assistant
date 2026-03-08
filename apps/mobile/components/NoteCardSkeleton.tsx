import { StyleSheet, View } from 'react-native';
import { MotiView } from 'moti';
import { colors, radius } from '@/constants/tokens';
import { shadows } from '@/constants/shadows';

export function NoteCardSkeleton() {
  return (
    <MotiView
      from={{ opacity: 0.45 }}
      animate={{ opacity: 1 }}
      transition={{ loop: true, type: 'timing', duration: 680 }}
      style={styles.card}
    >
      <View style={[styles.line, { width: '72%' }]} />
      <View style={[styles.line, { width: '90%' }]} />
      <View style={[styles.line, { width: '64%' }]} />
      <View style={styles.footerRow}>
        <View style={[styles.line, { width: 90 }]} />
      </View>
    </MotiView>
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
  line: {
    height: 12,
    borderRadius: radius.full,
    backgroundColor: colors.ink10,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 6,
  },
});
