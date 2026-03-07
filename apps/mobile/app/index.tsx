import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function Index() {
  const { status, isAuthenticated } = useAuth();

  if (status === 'loading') {
    return null;
  }

  return <Redirect href={isAuthenticated ? '/(tabs)' : '/(onboarding)'} />;
}
