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
    question: '你希望以什么方式记忆单词？',
    options: ['通过场景例句', '填空练习', '词语翻译'],
  },
  cooking: {
    title: '做饭助理',
    question: '你平时的烹饪水平是？',
    options: ['新手入门', '会做基础家常菜', '有一定经验'],
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

  const handleAdvance = () => {
    if (isLast) {
      router.replace('/');
    } else {
      setCurrentIndex((prev) => prev + 1);
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
          {/* Step counter */}
          <Text style={[typography.mono, styles.stepCounter]}>
            {currentIndex + 1} / {total} · {currentConfig.title}
          </Text>

          {/* Question */}
          <Text style={[typography.titleL, styles.question]}>
            {currentConfig.question}
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
        <View style={styles.buttonRow}>
          <View style={styles.buttonWrap}>
            <Button variant="ghost" onPress={handleAdvance}>
              跳过
            </Button>
          </View>
          <View style={styles.buttonWrap}>
            <Button onPress={handleAdvance}>
              {isLast ? '完成' : '下一步'}
            </Button>
          </View>
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
    marginBottom: 40,
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
  stepCounter: {
    color: colors.ink60,
    marginBottom: 12,
  },
  question: {
    color: colors.ink,
    marginBottom: 28,
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonWrap: {
    flex: 1,
  },
});
