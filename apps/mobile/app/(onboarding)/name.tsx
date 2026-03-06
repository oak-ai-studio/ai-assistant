import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { MotiView } from 'moti';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors } from '@/constants/tokens';
import { typography } from '@/constants/typography';

export default function NameScreen() {
  const router = useRouter();
  const [name, setName] = useState('');

  const handleNext = () => {
    router.push('/(onboarding)/choose-skill');
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
          <Text style={[typography.titleL, styles.title]}>
            给你的助理起个名字
          </Text>
          <Text style={[typography.bodyM, styles.hint]}>
            起一个你喜欢的名字，之后也可以修改
          </Text>

          <Input
            label="名字"
            placeholder="小助"
            value={name}
            onChangeText={setName}
          />
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 160 }}
          style={styles.buttonRow}
        >
          <View style={styles.buttonWrap}>
            <Button variant="ghost" onPress={handleNext}>
              跳过
            </Button>
          </View>
          <View style={styles.buttonWrap}>
            <Button onPress={handleNext}>
              下一步
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
    paddingTop: 60,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    gap: 8,
  },
  title: {
    color: colors.ink,
    marginBottom: 8,
  },
  hint: {
    color: colors.ink60,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonWrap: {
    flex: 1,
  },
});
