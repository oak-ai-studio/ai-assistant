import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import {
  buildSkillSteps,
  parseAssistantSkills,
  SKILL_INIT_CONFIGS,
} from '@/constants/assistant-config';
import { colors, radius } from '@/constants/tokens';
import { typography } from '@/constants/typography';
import { shadows } from '@/constants/shadows';

const parseStep = (value: string | undefined): number => {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    return 0;
  }

  return Math.floor(numberValue);
};

export default function SkillInitScreen() {
  const router = useRouter();
  const { skills, step } = useLocalSearchParams<{
    skills?: string;
    step?: string;
  }>();

  const skillList = parseAssistantSkills(skills);
  const steps = useMemo(() => buildSkillSteps(skillList), [skillList]);

  if (steps.length === 0) {
    router.replace('/settings/assistant');
    return null;
  }

  const requestedStep = parseStep(step);
  const stepIndex = Math.min(requestedStep, steps.length - 1);
  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  const stepIndexInSkill =
    steps.slice(0, stepIndex + 1).filter((item) => item.skillId === currentStep.skillId)
      .length;
  const stepTotalInSkill = SKILL_INIT_CONFIGS[currentStep.skillId].questions.length;

  const [selectedOption, setSelectedOption] = useState(
    currentStep.question.options[0] ?? ''
  );

  useEffect(() => {
    setSelectedOption(currentStep.question.options[0] ?? '');
  }, [currentStep.question.options]);

  const handleNext = () => {
    if (isLastStep) {
      router.push('/settings/skill-confirm');
      return;
    }

    router.replace({
      pathname: '/settings/skill-init',
      params: {
        skills: skillList.join(','),
        step: String(stepIndex + 1),
      },
    });
  };

  const handleBack = () => {
    if (stepIndex === 0) {
      router.back();
      return;
    }

    router.replace({
      pathname: '/settings/skill-init',
      params: {
        skills: skillList.join(','),
        step: String(stepIndex - 1),
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.progressBar}>
          {steps.map((item, index) => (
            <View
              key={item.question.id}
              style={[
                styles.progressSegment,
                index <= stepIndex && styles.progressSegmentActive,
              ]}
            />
          ))}
        </View>

        <MotiView
          key={currentStep.question.id}
          from={{ opacity: 0, translateX: 24 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 120 }}
          style={styles.content}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>助</Text>
          </View>

          <Text style={[typography.mono, styles.skillTitle]}>
            {currentStep.title}（{stepIndexInSkill}/{stepTotalInSkill}）
          </Text>

          <Text style={[typography.titleL, styles.questionText]}>
            {stepIndexInSkill}. {currentStep.question.question}
          </Text>

          <View style={styles.optionList}>
            {currentStep.question.options.map((option) => {
              const checked = selectedOption === option;

              return (
                <Pressable
                  key={option}
                  style={[styles.optionCard, checked && styles.optionCardChecked]}
                  onPress={() => setSelectedOption(option)}
                >
                  <Text
                    style={[
                      typography.bodyL,
                      styles.optionText,
                      checked && styles.optionTextChecked,
                    ]}
                  >
                    {option}
                  </Text>
                  {checked && (
                    <View style={styles.optionCheckIcon}>
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </MotiView>

        <View style={styles.bottomButtons}>
          <Button onPress={handleNext}>下一项</Button>
          <Button variant="ghost" onPress={handleBack}>上一项</Button>
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
  skillTitle: {
    color: colors.ink60,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  questionText: {
    color: colors.ink,
    marginBottom: 22,
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
  optionCardChecked: {
    backgroundColor: colors.orangeBg,
    borderColor: colors.orange,
  },
  optionText: {
    color: colors.ink,
    flex: 1,
  },
  optionTextChecked: {
    color: colors.orange,
  },
  optionCheckIcon: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomButtons: {
    gap: 10,
  },
});
