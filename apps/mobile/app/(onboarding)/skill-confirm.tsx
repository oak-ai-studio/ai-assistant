import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { MotiView } from 'moti';
import { Button } from '@/components/ui/Button';
import { colors, radius } from '@/constants/tokens';
import { typography } from '@/constants/typography';
import { trpcClient } from '@/utils/trpc';
import { useAuth } from '@/hooks/useAuth';

export default function SkillConfirmScreen() {
  const router = useRouter();
  const { updateUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = async () => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await trpcClient.user.completeOnboarding.mutate();
      await updateUser(result.user);
      router.replace('/(tabs)');
    } catch {
      setError('完成引导失败，请重试。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.content}>
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>助</Text>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 120 }}
          >
            <Text style={[typography.display, styles.title]}>AI 小助理</Text>
            <Text style={[typography.bodyL, styles.subtitle]}>你的智能助手已就绪</Text>
          </MotiView>
        </View>

        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 200 }}
          style={styles.actions}
        >
          <Button onPress={handleComplete} loading={submitting}>
            OK
          </Button>
          <Button
            variant="secondary"
            style={styles.waitButton}
            onPress={() => router.back()}
            disabled={submitting}
          >
            不，等等...
          </Button>
          {error ? <Text style={[typography.caption, styles.errorText]}>{error}</Text> : null}
        </MotiView>
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
    paddingTop: 48,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 48,
  },
  avatar: {
    width: 80,
    height: 80,
    backgroundColor: colors.orange,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  avatarText: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: 34,
    color: '#fff',
  },
  title: {
    color: colors.orange,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: colors.ink60,
    textAlign: 'center',
  },
  actions: {
    gap: 10,
  },
  waitButton: {
    backgroundColor: colors.offWhite,
    borderColor: colors.ink,
  },
  errorText: {
    color: colors.danger,
    textAlign: 'center',
  },
});
