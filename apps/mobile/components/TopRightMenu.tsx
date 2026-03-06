import { Modal, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '@/constants/tokens';
import { typography } from '@/constants/typography';
import { shadows } from '@/constants/shadows';

export type TopRightMenuItem = {
  key: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
};

type TopRightMenuProps = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  items: TopRightMenuItem[];
};

export function TopRightMenu({
  visible,
  onVisibleChange,
  items,
}: TopRightMenuProps) {
  const insets = useSafeAreaInsets();

  return (
    <>
      <Pressable
        style={[styles.trigger, { top: insets.top + 16, right: 16 }]}
        onPress={() => onVisibleChange(true)}
      >
        <Ionicons name="menu" size={16} color={colors.ink} />
      </Pressable>

      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={() => onVisibleChange(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => onVisibleChange(false)}>
          <Pressable
            style={[
              styles.menuCard,
              { top: insets.top + 58, right: 16 },
            ]}
            onPress={(event) => event.stopPropagation()}
          >
            {items.map((item, index) => (
              <Pressable
                key={item.key}
                style={[styles.menuItem, index > 0 && styles.menuItemBorder]}
                onPress={() => {
                  onVisibleChange(false);
                  item.onPress();
                }}
              >
                <Text
                  style={[
                    typography.bodyL,
                    styles.menuText,
                    item.destructive && styles.menuTextDestructive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    position: 'absolute',
    zIndex: 30,
    width: 36,
    height: 36,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.ink10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.offWhite,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,24,20,0.12)',
  },
  menuCard: {
    position: 'absolute',
    width: 144,
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.ink10,
    overflow: 'hidden',
    ...shadows.md,
  },
  menuItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  menuItemBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.ink10,
  },
  menuText: {
    color: colors.ink,
  },
  menuTextDestructive: {
    color: colors.danger,
  },
});
