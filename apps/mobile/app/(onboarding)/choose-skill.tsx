import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { colors, radius } from '@/constants/tokens';
import { typography } from '@/constants/typography';
import { shadows } from '@/constants/shadows';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const SKILLS = [
  {
    id: 'vocab',
    icon: 'book-outline' as IoniconName,
    name: '背单词',
    desc: '科学记忆，每天进步一点',
  },
  {
    id: 'cooking',
    icon: 'restaurant-outline' as IoniconName,
    name: '做饭助理',
    desc: '下厨更轻松，食谱随手得',
  },
  {
    id: 'chat',
    icon: 'chatbubble-outline' as IoniconName,
    name: '随便聊聊',
    desc: '随时陪你说说话',
  },
] as const;

type SkillId = typeof SKILLS[number]['id'];

function SkillSelectCard({
  icon,
  name,
  desc,
  selected,
  onToggle,
}: {
  icon: IoniconName;
  name: string;
  desc: string;
  selected: boolean;
  onToggle: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 20, stiffness: 200 });
      }}
      onPress={onToggle}
    >
      <Animated.View
        style={[
          animStyle,
          styles.skillCard,
          selected && styles.skillCardSelected,
        ]}
      >
        {/* Icon box */}
        <View style={[styles.iconBox, selected && styles.iconBoxSelected]}>
          <Ionicons
            name={icon}
            size={22}
            color={selected ? colors.orange : colors.ink60}
          />
        </View>

        {/* Text */}
        <View style={styles.skillText}>
          <Text style={[typography.titleM, { color: colors.ink }]}>{name}</Text>
          <Text style={[typography.bodyM, styles.skillDesc]}>{desc}</Text>
        </View>

        {/* Check */}
        {selected && (
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={13} color="#fff" />
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

export default function ChooseSkillScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<SkillId[]>([]);

  const toggleSkill = (id: SkillId) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    router.push({
      pathname: '/(onboarding)/skill-config',
      params: { skills: selected.join(',') },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          style={styles.content}
        >
          <Text style={[typography.titleL, styles.title]}>
            选择你的第一个技能
          </Text>
          <Text style={[typography.bodyM, styles.subtitle]}>
            可以多选，之后也可以随时添加
          </Text>

          <View style={styles.skillList}>
            {SKILLS.map((skill, i) => (
              <MotiView
                key={skill.id}
                from={{ opacity: 0, translateY: 8 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  type: 'spring',
                  damping: 20,
                  stiffness: 100,
                  delay: i * 80,
                }}
              >
                <SkillSelectCard
                  icon={skill.icon}
                  name={skill.name}
                  desc={skill.desc}
                  selected={selected.includes(skill.id)}
                  onToggle={() => toggleSkill(skill.id)}
                />
              </MotiView>
            ))}
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 360 }}
        >
          <Button onPress={handleNext} disabled={selected.length === 0}>
            下一步
          </Button>
        </MotiView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sand,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
  },
  title: {
    color: colors.ink,
    marginBottom: 8,
  },
  subtitle: {
    color: colors.ink60,
    marginBottom: 28,
  },
  skillList: {
    gap: 12,
  },
  skillCard: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.lg,
    padding: 20,
    borderWidth: 1.5,
    borderColor: colors.ink10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    ...shadows.sm,
  },
  skillCardSelected: {
    backgroundColor: colors.orangeBg,
    borderColor: colors.orange,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.sandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxSelected: {
    backgroundColor: colors.orange20,
  },
  skillText: {
    flex: 1,
    gap: 3,
  },
  skillDesc: {
    color: colors.ink60,
  },
  checkCircle: {
    width: 22,
    height: 22,
    backgroundColor: colors.orange,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
