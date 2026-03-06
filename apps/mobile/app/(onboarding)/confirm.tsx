import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Button } from '@/components/ui/Button';
import { colors, radius } from '@/constants/tokens';
import { typography } from '@/constants/typography';

const SKILL_NAMES: Record<string, string> = {
  vocab: '英语教练',
  cooking: '做饭助手',
  chat: '聊天伙伴',
};

const SKILL_DESCRIPTIONS: Record<string, string> = {
  vocab: '会在早晚和你在一起，通过科学的方式帮你记忆单词，适合学习你的语言习惯，你可以随时调整。',
  cooking: '随时为你推荐食谱、提醒购买食材，让下厨变得更轻松有趣。',
  chat: '随时陪你聊天，倾听你的日常，是一个真懂你的朋友。',
};

export default function ConfirmScreen() {
  const router = useRouter();
  const { skills } = useLocalSearchParams<{ skills: string }>();

  const skillList = skills
    ? skills.split(',').filter((s) => s in SKILL_NAMES)
    : [];

  const handleConfirm = () => {
    router.replace('/(tabs)');
  };

  const handleBack = () => {
    router.back();
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
          {/* Avatar */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>助</Text>
          </View>

          <Text style={[typography.mono, styles.stepLabel]}>确认技能</Text>

          {skillList.map((skillId, i) => (
            <MotiView
              key={skillId}
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                type: 'spring',
                damping: 20,
                stiffness: 100,
                delay: i * 100,
              }}
              style={styles.skillCard}
            >
              <Text style={[typography.titleM, styles.skillTitle]}>
                {SKILL_NAMES[skillId]}
              </Text>
              <Text style={[typography.bodyM, styles.skillDesc]}>
                {SKILL_DESCRIPTIONS[skillId]}
              </Text>
            </MotiView>
          ))}
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 360 }}
          style={styles.buttonSection}
        >
          <Button onPress={handleConfirm}>OK</Button>
          <Button variant="ghost" onPress={handleBack}>
            否，等等...
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
    paddingTop: 48,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
  },
  avatar: {
    width: 64,
    height: 64,
    backgroundColor: colors.orange,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  avatarText: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: 26,
    color: '#fff',
  },
  stepLabel: {
    color: colors.ink60,
    marginBottom: 20,
  },
  skillCard: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.ink10,
    marginBottom: 12,
    gap: 6,
  },
  skillTitle: {
    color: colors.ink,
  },
  skillDesc: {
    color: colors.ink60,
  },
  buttonSection: {
    gap: 10,
  },
});
