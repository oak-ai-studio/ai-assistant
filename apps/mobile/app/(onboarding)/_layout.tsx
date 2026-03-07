import { Redirect, Stack, usePathname } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function OnboardingLayout() {
  const pathname = usePathname();
  const { status, isAuthenticated, onboardingCompleted } = useAuth();

  if (status === 'loading') {
    return null;
  }

  if (!isAuthenticated) {
    return <Stack screenOptions={{ headerShown: false }} />;
  }

  if (onboardingCompleted) {
    return <Redirect href="/(tabs)" />;
  }

  if (pathname === '/(onboarding)' || pathname === '/(onboarding)/login' || pathname === '/(onboarding)/register') {
    return <Redirect href="/(onboarding)/name" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
