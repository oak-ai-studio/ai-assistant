import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function TabsLayout() {
  const { status, isAuthenticated } = useAuth();

  if (status === 'loading') {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(onboarding)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
