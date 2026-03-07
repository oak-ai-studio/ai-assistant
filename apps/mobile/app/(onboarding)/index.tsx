import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/tokens';
import { typography } from '@/constants/typography';

export default function LandingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          style={styles.content}
        >
          <Text style={[typography.display, styles.title]}>AI小助理</Text>
          <Text style={[typography.bodyL, styles.subtitle]}>一个真懂你的朋友</Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 300 }}
          style={styles.actions}
        >
          <View style={styles.buttonWrap}>
            <Button onPress={() => router.push('/(onboarding)/login')}>
              手机号登录
            </Button>
          </View>
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
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
  },
  title: {
    color: colors.ink,
    marginBottom: 12,
  },
  subtitle: {
    color: colors.ink60,
  },
  actions: {},
  buttonWrap: {
    width: '100%',
  },
});
