import { useLocalSearchParams, useRouter } from 'expo-router';
import { SkillConfigFlow } from '@/components/onboarding/SkillConfigFlow';
import {
  getSkillConfigStepCount,
  parseAssistantSkillsParam,
} from '@/constants/assistant-skills';

const parsePositiveInteger = (value: string | undefined, fallback: number) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0
    ? Math.floor(numericValue)
    : fallback;
};

export default function AssistantSkillConfigScreen() {
  const router = useRouter();
  const {
    skills,
    currentStepStart,
    totalSteps,
    initialIndex,
    autoSelectFirstOption,
  } = useLocalSearchParams<{
    skills?: string;
    currentStepStart?: string;
    totalSteps?: string;
    initialIndex?: string;
    autoSelectFirstOption?: string;
  }>();

  const skillList = parseAssistantSkillsParam(skills);

  if (skillList.length === 0) {
    router.replace('/settings/assistant');
    return null;
  }

  const stepStart = parsePositiveInteger(currentStepStart, 2);
  const maxSteps = parsePositiveInteger(
    totalSteps,
    stepStart - 1 + getSkillConfigStepCount(skillList)
  );
  const startIndex = parsePositiveInteger(initialIndex, 0);
  const preselectFirstOption = autoSelectFirstOption === '1';

  return (
    <SkillConfigFlow
      skillIds={skillList}
      currentStepStart={stepStart}
      totalSteps={maxSteps}
      initialIndex={startIndex}
      autoSelectFirstOption={preselectFirstOption}
      onComplete={() =>
        router.push({
          pathname: '/(onboarding)/skill-confirm',
          params: { returnTo: '/(tabs)' },
        })
      }
      onExit={() => router.back()}
    />
  );
}
