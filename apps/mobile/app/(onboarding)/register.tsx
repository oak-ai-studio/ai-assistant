import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { MotiView } from 'moti';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors } from '@/constants/tokens';
import { typography } from '@/constants/typography';

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = () => {
    router.push('/(onboarding)/name');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          style={styles.content}
        >
          <Text style={[typography.display, styles.title]}>注册</Text>

          <View style={styles.form}>
            <Input
              label="用户名"
              placeholder="xxx"
              value={username}
              onChangeText={setUsername}
            />
            <Input
              label="密码"
              placeholder="xxx"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <Input
              label="确认密码"
              placeholder="xxx"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 200 }}
          style={styles.buttonSection}
        >
          <Button onPress={handleRegister}>注册</Button>
          <Button variant="secondary" onPress={() => router.back()}>
            返回
          </Button>

          <View style={styles.footer}>
            <Pressable>
              <Text style={[typography.caption, styles.footerLink]}>服务条款</Text>
            </Pressable>
            <Text style={[typography.caption, styles.footerSep]}>·</Text>
            <Pressable>
              <Text style={[typography.caption, styles.footerLink]}>隐私政策</Text>
            </Pressable>
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
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
  },
  title: {
    color: colors.ink,
    marginBottom: 36,
  },
  form: {
    gap: 20,
  },
  buttonSection: {
    gap: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  footerLink: {
    color: colors.ink60,
  },
  footerSep: {
    color: colors.ink30,
  },
});
