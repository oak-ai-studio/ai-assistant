import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors } from '@/constants/tokens';
import { typography } from '@/constants/typography';
import { useAuth } from '@/hooks/useAuth';
import { trpcClient } from '@/utils/trpc';

const PHONE_REGEX = /^1\d{10}$/;
const CODE_REGEX = /^\d{6}$/;
const RESEND_SECONDS = 60;

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (countdown <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [countdown]);

  const canSendCode = useMemo(() => {
    return PHONE_REGEX.test(phone) && countdown === 0 && !sendingCode;
  }, [countdown, phone, sendingCode]);

  const canVerifyCode = useMemo(() => {
    return PHONE_REGEX.test(phone) && CODE_REGEX.test(code) && !verifying;
  }, [code, phone, verifying]);

  const handleSendCode = async () => {
    if (!canSendCode) {
      return;
    }

    setSendingCode(true);
    setError(null);

    try {
      await trpcClient.auth.sendCode.mutate({ phone });
      setCountdown(RESEND_SECONDS);
      setHint('验证码已发送，请查看后端控制台日志。');
    } catch {
      setError('验证码发送失败，请稍后重试。');
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!canVerifyCode) {
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const result = await trpcClient.auth.verifyCode.mutate({
        phone,
        code,
      });

      await signIn({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });

      router.replace('/(tabs)');
    } catch {
      setError('验证码错误或已过期，请重新获取。');
    } finally {
      setVerifying(false);
    }
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
          <Text style={[typography.display, styles.title]}>手机号登录</Text>
          <Text style={[typography.bodyM, styles.subtitle]}>
            输入手机号并通过验证码登录，未注册手机号会自动创建账号。
          </Text>

          <View style={styles.form}>
            <Input
              label="手机号"
              placeholder="13800138000"
              value={phone}
              onChangeText={(value) => setPhone(value.replace(/\D/g, '').slice(0, 11))}
              keyboardType="number-pad"
              maxLength={11}
              hint="当前版本默认中国大陆 11 位手机号"
            />

            <View style={styles.codeRow}>
              <View style={styles.codeInputWrap}>
                <Input
                  label="验证码"
                  placeholder="请输入 6 位验证码"
                  value={code}
                  onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
              <View style={styles.sendButtonWrap}>
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={handleSendCode}
                  disabled={!canSendCode}
                  loading={sendingCode}
                >
                  {countdown > 0 ? `${countdown}s` : '发送验证码'}
                </Button>
              </View>
            </View>

            {hint ? <Text style={[typography.caption, styles.hint]}>{hint}</Text> : null}
            {error ? <Text style={[typography.caption, styles.error]}>{error}</Text> : null}
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 200 }}
          style={styles.buttonSection}
        >
          <Button onPress={handleVerifyCode} disabled={!canVerifyCode} loading={verifying}>
            登录
          </Button>
          <Button variant="ghost" onPress={() => router.back()}>
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
    marginBottom: 8,
  },
  subtitle: {
    color: colors.ink60,
    marginBottom: 28,
  },
  form: {
    gap: 14,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  codeInputWrap: {
    flex: 1,
  },
  sendButtonWrap: {
    width: 112,
    paddingBottom: 24,
  },
  hint: {
    color: colors.ink60,
  },
  error: {
    color: colors.danger,
  },
  buttonSection: {
    gap: 10,
  },
});
