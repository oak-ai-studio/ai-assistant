import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function OnboardingLayout() {
  const { status, isAuthenticated } = useAuth();

  if (status === 'loading') {
    return null;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
