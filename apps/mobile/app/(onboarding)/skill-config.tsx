import { useLocalSearchParams, useRouter } from 'expo-router';
import { SkillConfigFlow } from '@/components/onboarding/SkillConfigFlow';
import {
  getSkillConfigStepCount,
  parseAssistantSkillsParam,
} from '@/constants/assistant-skills';

export default function SkillConfigScreen() {
  const router = useRouter();
  const { skills } = useLocalSearchParams<{ skills: string }>();

  const skillList = parseAssistantSkillsParam(skills);

  if (skillList.length === 0) {
    router.replace('/(onboarding)/choose-skill');
    return null;
  }

  const configStepCount = getSkillConfigStepCount(skillList);

  return (
    <SkillConfigFlow
      skillIds={skillList}
      currentStepStart={3}
      totalSteps={configStepCount + 3}
      onComplete={() => router.push('/(onboarding)/skill-confirm')}
      onExit={() => router.back()}
    />
  );
}

