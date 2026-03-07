import 'react-native-gesture-handler';
import '../global.css';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { Syne_700Bold, Syne_800ExtraBold } from '@expo-google-fonts/syne';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';
import { DMMono_400Regular as DMMonoRegular } from '@expo-google-fonts/dm-mono';
import { PortalProvider } from '@gorhom/portal';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GlobalChatProvider } from '@/components/chat/ChatOverlayProvider';
import { AuthProvider } from '@/hooks/useAuth';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Syne_700Bold,
    Syne_800ExtraBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMMonoRegular,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PortalProvider>
        <AuthProvider>
          <GlobalChatProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </GlobalChatProvider>
        </AuthProvider>
      </PortalProvider>
    </GestureHandlerRootView>
  );
}
