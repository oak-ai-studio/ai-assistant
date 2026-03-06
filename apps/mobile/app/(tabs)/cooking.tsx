import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '@/constants/tokens';
import { typography } from '@/constants/typography';
import { shadows } from '@/constants/shadows';

export default function CookingPlaceholderScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={18} color={colors.ink} />
          <Text style={[typography.bodyL, styles.backText]}>返回首页</Text>
        </Pressable>

        <View style={styles.card}>
          <Text style={[typography.titleL, styles.title]}>做饭助理</Text>
          <Text style={[typography.bodyL, styles.subtitle]}>做饭助理页面占位</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sand,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 18,
  },
  backText: {
    color: colors.ink60,
  },
  card: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ink10,
    padding: 20,
    ...shadows.sm,
  },
  title: {
    color: colors.ink,
    marginBottom: 8,
  },
  subtitle: {
    color: colors.ink60,
  },
});
