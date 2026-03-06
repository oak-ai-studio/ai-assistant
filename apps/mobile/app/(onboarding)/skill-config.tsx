import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { MotiView } from 'moti';
import { Button } from '@/components/ui/Button';
import { colors, radius } from '@/constants/tokens';
import { typography } from '@/constants/typography';
import { shadows } from '@/constants/shadows';

interface SkillConfig {
  title: string;
  question: string;
  options: string[];
}

const SKILL_CONFIGS: Record<string, SkillConfig> = {
  vocab: {
    title: '背单词',
    question: '多久和你背一次单词？',
    options: ['每天', '每周', '自定义...'],
  },
  cooking: {
    title: '做饭助理',
    question: '提醒你购买食材？',
    options: ['是', '否'],
  },
  chat: {
    title: '随便聊聊',
    question: '你希望助理聊天时的风格是？',
    options: ['轻松有趣', '温暖治愈', '直接理性'],
  },
};

function OptionCard({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 20, stiffness: 200 });
      }}
      onPress={onSelect}
    >
      <Animated.View
        style={[animStyle, styles.optionCard, selected && styles.optionCardSelected]}
      >
        <Text
          style={[
            typography.bodyL,
            { color: selected ? colors.orange : colors.ink, flex: 1 },
          ]}
        >
          {label}
        </Text>
        {selected && (
          <View style={styles.checkCircle}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

export default function SkillConfigScreen() {
  const router = useRouter();
  const { skills } = useLocalSearchParams<{ skills: string }>();

  const skillList = skills
    ? skills.split(',').filter((s) => s in SKILL_CONFIGS)
    : [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const currentSkillId = skillList[currentIndex];
  const currentConfig = currentSkillId ? SKILL_CONFIGS[currentSkillId] : null;
  const total = skillList.length;
  const isLast = currentIndex === total - 1;

  // Step numbering: name=1, skill-select=2, configs start at 3
  const totalSteps = total + 3; // name(1) + skill-select(2) + configs + confirm
  const currentStep = currentIndex + 3;

  const handleNext = () => {
    if (isLast) {
      router.push({
        pathname: '/(onboarding)/confirm',
        params: { skills },
      });
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
    }
  };

  const handleBack = () => {
    if (currentIndex === 0) {
      router.back();
    } else {
      setCurrentIndex((prev) => prev - 1);
      setSelectedOption(null);
    }
  };

  if (!currentConfig) {
    router.replace('/');
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        {/* Progress bar */}
        <View style={styles.progressBar}>
          {skillList.map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressSegment,
                i <= currentIndex && styles.progressSegmentActive,
              ]}
            />
          ))}
        </View>

        <MotiView
          key={currentSkillId}
          from={{ opacity: 0, translateX: 24 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 120 }}
          style={styles.content}
        >
          {/* Avatar */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>助</Text>
          </View>

          {/* Skill title */}
          <Text style={[typography.mono, styles.skillLabel]}>
            完善技能 · {currentConfig.title}
          </Text>

          {/* Question */}
          <Text style={[typography.titleL, styles.question]}>
            1. {currentConfig.question}
          </Text>

          {/* Options */}
          <View style={styles.optionList}>
            {currentConfig.options.map((option, i) => (
              <MotiView
                key={option}
                from={{ opacity: 0, translateY: 8 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  type: 'spring',
                  damping: 20,
                  stiffness: 100,
                  delay: i * 80,
                }}
              >
                <OptionCard
                  label={option}
                  selected={selectedOption === option}
                  onSelect={() => setSelectedOption(option)}
                />
              </MotiView>
            ))}
          </View>
        </MotiView>

        {/* Bottom actions */}
        <View style={styles.buttonSection}>
          <Button onPress={handleNext}>
            {isLast ? `下一项（${currentStep}/${totalSteps}）` : `下一项（${currentStep}/${totalSteps}）`}
          </Button>
          <Button variant="ghost" onPress={handleBack}>
            上一项
          </Button>
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
    paddingTop: 48,
    paddingBottom: 32,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 32,
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
    gap: 10,
  },
  optionCard: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: colors.ink10,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  optionCardSelected: {
    backgroundColor: colors.orangeBg,
    borderColor: colors.orange,
  },
  checkCircle: {
    width: 20,
    height: 20,
    backgroundColor: colors.orange,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
  },
  buttonSection: {
    gap: 10,
  },
});
