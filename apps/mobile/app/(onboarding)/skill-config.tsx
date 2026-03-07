import { useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { parseAssistantSkills } from '@/constants/assistant-config';
import { colors, radius } from '@/constants/tokens';
import { typography } from '@/constants/typography';
import { shadows } from '@/constants/shadows';
import { trpcClient } from '@/utils/trpc';

type OnboardingSkillId = 'vocab' | 'cooking' | 'chat';

interface SkillConfig {
  title: string;
  question: string;
  options: [string, string, string];
  primarySkillSource: string;
  fallbackSkillSource: string;
}

const ONBOARDING_USER_ID =
  process.env.EXPO_PUBLIC_ONBOARDING_USER_ID ?? 'onboarding-user';

const SKILL_CONFIGS: Record<OnboardingSkillId, SkillConfig> = {
  vocab: {
    title: '背单词',
    question: '你希望以什么方式记忆单词？',
    options: ['通过场景例句', '填空练习', '词语翻译'],
    primarySkillSource: 'english_learning',
    fallbackSkillSource: '背单词',
  },
  cooking: {
    title: '做饭助理',
    question: '你平时的烹饪水平是？',
    options: ['新手入门', '会做基础家常菜', '有一定经验'],
    primarySkillSource: 'cooking',
    fallbackSkillSource: '做饭助理',
  },
  chat: {
    title: '随便聊聊',
    question: '你希望助理聊天时的风格是？',
    options: ['轻松有趣', '温暖治愈', '直接理性'],
    primarySkillSource: 'chat',
    fallbackSkillSource: '随便聊聊',
  },
};

function OptionCard({ label, onSelect, disabled }: {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onSelect}
      disabled={disabled}
    >
      <View style={[styles.optionCard, disabled && styles.optionCardDisabled]}>
        <Text style={[typography.bodyL, styles.optionText]}>{label}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.ink60} />
      </View>
    </Pressable>
  );
}

export default function SkillConfigScreen() {
  const router = useRouter();
  const { skills } = useLocalSearchParams<{ skills?: string | string[] }>();

  const skillList = useMemo(
    () =>
      parseAssistantSkills(skills).filter(
        (skillId): skillId is OnboardingSkillId => skillId in SKILL_CONFIGS
      ),
    [skills]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const bootstrapPromiseRef = useRef<Promise<void> | null>(null);

  const currentSkillId = skillList[currentIndex];
  const currentConfig = currentSkillId ? SKILL_CONFIGS[currentSkillId] : null;
  const total = skillList.length;
  const isLast = currentIndex === total - 1;

  if (!currentConfig) {
    router.replace('/(onboarding)/choose-skill');
    return null;
  }

  const ensureAssistantReady = async () => {
    if (!bootstrapPromiseRef.current) {
      bootstrapPromiseRef.current = trpcClient.assistant.create
        .mutate({ userId: ONBOARDING_USER_ID })
        .then(() => undefined)
        .catch(() => undefined)
        .finally(() => {
          bootstrapPromiseRef.current = null;
        });
    }

    await bootstrapPromiseRef.current;
  };

  const goNext = () => {
    if (isLast) {
      router.push('/(onboarding)/skill-confirm');
      return;
    }

    setCurrentIndex((previous) => previous + 1);
  };

  const savePreference = async (answer: string) => {
    await ensureAssistantReady();

    const payload = {
      userId: ONBOARDING_USER_ID,
      content: `我希望${answer}`,
      type: 'preference' as const,
    };

    try {
      await trpcClient.memory.create.mutate({
        ...payload,
        skillSource: currentConfig.primarySkillSource,
      });
    } catch {
      await trpcClient.memory.create.mutate({
        ...payload,
        skillSource: currentConfig.fallbackSkillSource,
      });
    }
  };

  const handleSelect = async (answer: string) => {
    if (submitting) {
      return;
    }

    setSubmitting(true);

    try {
      await savePreference(answer);
    } catch {
      // Skip blocking onboarding when backend is unavailable.
    } finally {
      setSubmitting(false);
      goNext();
    }
  };

  const handleSkip = () => {
    if (submitting) {
      return;
    }

    goNext();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={[typography.mono, styles.progressText]}>
            {currentIndex + 1}/{total}
          </Text>
          <View style={styles.progressBar}>
            {skillList.map((skillId, index) => (
            <View
              key={skillId}
              style={[
                styles.progressSegment,
                index <= currentIndex && styles.progressSegmentActive,
              ]}
            />
            ))}
          </View>
        </View>

        <MotiView
          key={currentSkillId}
          from={{ opacity: 0, translateX: 24 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 120 }}
          style={styles.content}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>助</Text>
          </View>

          <Text style={[typography.mono, styles.skillLabel]}>
            完善技能 · {currentConfig.title}
          </Text>

          <Text style={[typography.titleL, styles.question]}>{currentConfig.question}</Text>
          <View style={styles.optionList}>
            {currentConfig.options.map((option, index) => (
              <MotiView
                key={option}
                from={{ opacity: 0, translateY: 8 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  type: 'spring',
                  damping: 20,
                  stiffness: 100,
                  delay: index * 70,
                }}
              >
                <OptionCard
                  label={option}
                  disabled={submitting}
                  onSelect={() => handleSelect(option)}
                />
              </MotiView>
            ))}
          </View>
        </MotiView>

        <Button variant="ghost" onPress={handleSkip} disabled={submitting}>
          跳过
        </Button>
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
  header: {
    marginBottom: 24,
  },
  progressText: {
    color: colors.ink60,
    marginBottom: 10,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 6,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    backgroundColor: colors.ink10,
    borderRadius: radius.full,
  },
  progressSegmentActive: {
    backgroundColor: colors.orange,
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
  skillLabel: {
    color: colors.ink60,
    marginBottom: 12,
  },
  question: {
    color: colors.ink,
    marginBottom: 24,
  },
  optionList: {
    gap: 12,
  },
  optionCard: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.lg,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: colors.ink10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.sm,
  },
  optionCardDisabled: {
    opacity: 0.6,
  },
  optionText: {
    color: colors.ink,
    flex: 1,
  },
});
