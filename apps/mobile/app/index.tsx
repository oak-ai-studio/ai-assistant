import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function Index() {
  const { status, isAuthenticated, onboardingCompleted } = useAuth();

  if (status === 'loading') {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(onboarding)/login" />;
  }

  if (!onboardingCompleted) {
    return <Redirect href="/(onboarding)/name" />;
  }

  return <Redirect href="/(tabs)" />;
}
