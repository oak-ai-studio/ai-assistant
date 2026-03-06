import { Redirect, useLocalSearchParams } from 'expo-router';

export default function SkillInitAliasScreen() {
  const { skills, step } = useLocalSearchParams<{
    skills?: string;
    step?: string;
  }>();

  return (
    <Redirect
      href={{
        pathname: '/settings/skill-init',
        params: {
          skills,
          step,
        },
      }}
    />
  );
}
