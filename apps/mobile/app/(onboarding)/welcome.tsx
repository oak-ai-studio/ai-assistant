import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Button } from '@/components/ui/Button';
import { colors, radius } from '@/constants/tokens';
import { typography } from '@/constants/typography';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        {/* Main content */}
        <View style={styles.content}>
          {/* Avatar */}
          <MotiView
            from={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>助</Text>
          </MotiView>

          {/* Title & Subtitle */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 120 }}
          >
            <Text style={[typography.display, styles.title]}>
              你好，我是小助
            </Text>
            <Text style={[typography.bodyL, styles.subtitle]}>
              一个越用越懂你的 AI 助理
            </Text>
          </MotiView>
        </View>

        {/* Bottom actions */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 320 }}
          style={styles.actions}
        >
          <Button onPress={() => router.push('/(onboarding)/name')}>
            开始使用
          </Button>

          <Pressable style={styles.loginLink}>
            <Text style={[typography.bodyM, styles.loginText]}>
              已有账号？
              <Text style={styles.loginHighlight}>登录</Text>
            </Text>
          </Pressable>
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
    paddingTop: 60,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    backgroundColor: colors.orange,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  avatarText: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: 34,
    color: '#fff',
  },
  title: {
    color: colors.ink,
    marginBottom: 12,
  },
  subtitle: {
    color: colors.ink60,
  },
  actions: {
    gap: 16,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  loginText: {
    color: colors.ink60,
  },
  loginHighlight: {
    color: colors.orange,
    fontFamily: 'DMSans_400Regular',
  },
});
