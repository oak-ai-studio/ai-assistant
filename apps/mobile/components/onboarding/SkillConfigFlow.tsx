import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { MotiView } from 'moti';
import { Button } from '@/components/ui/Button';
import {
  SKILL_CONFIGS,
  type AssistantSkillId,
} from '@/constants/assistant-skills';
import { colors, radius } from '@/constants/tokens';
import { typography } from '@/constants/typography';
import { shadows } from '@/constants/shadows';

type SkillConfigFlowProps = {
  skillIds: AssistantSkillId[];
  currentStepStart: number;
  totalSteps: number;
  onComplete: () => void;
  onExit: () => void;
  initialIndex?: number;
  autoSelectFirstOption?: boolean;
};

type FlattenedQuestionStep = {
  skillId: AssistantSkillId;
  title: string;
  questionId: string;
  question: string;
  options: string[];
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

export function SkillConfigFlow({
  skillIds,
  currentStepStart,
  totalSteps,
  onComplete,
  onExit,
  initialIndex = 0,
  autoSelectFirstOption = false,
}: SkillConfigFlowProps) {
  const questionSteps = useMemo<FlattenedQuestionStep[]>(
    () =>
      skillIds.flatMap((skillId) => {
        const skillConfig = SKILL_CONFIGS[skillId];

        return skillConfig.questions.map((questionItem) => ({
          skillId,
          title: skillConfig.title,
          questionId: questionItem.id,
          question: questionItem.question,
          options: questionItem.options,
        }));
      }),
    [skillIds]
  );

  const safeInitialIndex = Math.min(
    Math.max(initialIndex, 0),
    Math.max(questionSteps.length - 1, 0)
  );

  const [currentIndex, setCurrentIndex] = useState(safeInitialIndex);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    if (!autoSelectFirstOption) {
      return {};
    }

    const seededOptions: Record<string, string> = {};

    for (let index = 0; index <= safeInitialIndex; index += 1) {
      const questionStep = questionSteps[index];
      const firstOption = questionStep?.options[0];

      if (questionStep && firstOption) {
        seededOptions[questionStep.questionId] = firstOption;
      }
    }

    return seededOptions;
  });

  useEffect(() => {
    setCurrentIndex(safeInitialIndex);

    if (!autoSelectFirstOption) {
      setSelectedOptions({});
      return;
    }

    const seededOptions: Record<string, string> = {};

    for (let index = 0; index <= safeInitialIndex; index += 1) {
      const questionStep = questionSteps[index];
      const firstOption = questionStep?.options[0];

      if (questionStep && firstOption) {
        seededOptions[questionStep.questionId] = firstOption;
      }
    }

    setSelectedOptions(seededOptions);
  }, [autoSelectFirstOption, questionSteps, safeInitialIndex]);

  const currentStep = questionSteps[currentIndex];

  if (!currentStep) {
    return null;
  }

  const isLast = currentIndex === questionSteps.length - 1;
  const stepNumber = currentStepStart + currentIndex;
  const selectedOption = selectedOptions[currentStep.questionId];

  const handleNext = () => {
    if (!selectedOption) {
      return;
    }

    if (isLast) {
      onComplete();
      return;
    }

    setCurrentIndex((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentIndex === 0) {
      onExit();
      return;
    }

    setCurrentIndex((prev) => prev - 1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.progressBar}>
          {questionSteps.map((step, index) => (
            <View
              key={step.questionId}
              style={[
                styles.progressSegment,
                index <= currentIndex && styles.progressSegmentActive,
              ]}
            />
          ))}
        </View>

        <MotiView
          key={`${currentStep.skillId}-${currentStep.questionId}`}
          from={{ opacity: 0, translateX: 24 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 120 }}
          style={styles.content}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>助</Text>
          </View>

          <Text style={[typography.mono, styles.skillLabel]}>
            完善技能 · {currentStep.title}
          </Text>

          <Text style={[typography.titleL, styles.question]}>
            {currentIndex + 1}. {currentStep.question}
          </Text>

          <View style={styles.optionList}>
            {currentStep.options.map((option, index) => (
              <MotiView
                key={option}
                from={{ opacity: 0, translateY: 8 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  type: 'spring',
                  damping: 20,
                  stiffness: 100,
                  delay: index * 80,
                }}
              >
                <OptionCard
                  label={option}
                  selected={selectedOption === option}
                  onSelect={() =>
                    setSelectedOptions((prev) => ({
                      ...prev,
                      [currentStep.questionId]: option,
                    }))
                  }
                />
              </MotiView>
            ))}
          </View>
        </MotiView>

        <View style={styles.buttonSection}>
          <Button onPress={handleNext} disabled={!selectedOption}>
            {`下一项（${stepNumber}/${totalSteps}）`}
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
    paddingTop: 20,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.ink10,
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
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
    borderWidth: 1.5,
    borderColor: colors.ink10,
    paddingHorizontal: 16,
    paddingVertical: 16,
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
