import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-sand px-6">
      <StatusBar style="dark" />
      <Text className="font-display text-3xl text-orange">AI 小助理</Text>
      <Text className="mt-2 font-body text-center text-ink">Project initialized successfully.</Text>
    </View>
  );
}
