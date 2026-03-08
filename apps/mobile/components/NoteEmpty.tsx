import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/tokens';
import { typography } from '@/constants/typography';
import { Button } from '@/components/ui/Button';

type NoteEmptyProps = {
  title?: string;
  description?: string;
  onCreatePress: () => void;
};

export function NoteEmpty({
  title = '暂无笔记',
  description = '记录下想法，随时补充细节。',
  onCreatePress,
}: NoteEmptyProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name="document-text-outline" size={24} color={colors.ink60} />
      </View>
      <Text style={[typography.titleM, styles.title]}>{title}</Text>
      <Text style={[typography.bodyM, styles.description]}>{description}</Text>
      <Button size="sm" onPress={onCreatePress}>
        添加笔记
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
    gap: 10,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink05,
    borderWidth: 1,
    borderColor: colors.ink10,
  },
  title: {
    color: colors.ink,
    textAlign: 'center',
  },
  description: {
    color: colors.ink60,
    textAlign: 'center',
  },
});
