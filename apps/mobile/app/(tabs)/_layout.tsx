import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function TabsLayout() {
  const { status, isAuthenticated, onboardingCompleted } = useAuth();

  if (status === 'loading') {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(onboarding)" />;
  }

  if (!onboardingCompleted) {
    return <Redirect href="/(onboarding)/name" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
