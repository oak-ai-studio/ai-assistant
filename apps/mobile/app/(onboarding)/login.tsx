import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { MotiView } from 'moti';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors } from '@/constants/tokens';
import { typography } from '@/constants/typography';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = () => {
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
          <Text style={[typography.display, styles.title]}>欢迎</Text>

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

            {/* 记住密码 + 忘记密码 */}
            <View style={styles.rememberRow}>
              <Pressable
                style={styles.checkboxRow}
                onPress={() => setRememberMe((v) => !v)}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[typography.bodyM, styles.rememberText]}>记住密码</Text>
              </Pressable>
              <Pressable>
                <Text style={[typography.bodyM, styles.forgotText]}>忘记密码?</Text>
              </Pressable>
            </View>
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 200 }}
          style={styles.buttonSection}
        >
          <Button onPress={handleLogin}>登录</Button>
          <Button variant="secondary" onPress={() => router.back()}>
            返回
          </Button>
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
  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: colors.ink30,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  checkmark: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
  },
  rememberText: {
    color: colors.ink60,
  },
  forgotText: {
    color: colors.orange,
  },
  buttonSection: {
    gap: 10,
  },
});
