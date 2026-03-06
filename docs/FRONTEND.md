# FRONTEND.md

React Native + Expo 前端开发规范。

---

## 技术栈

- **框架**：React Native + Expo SDK 52+
- **路由**：Expo Router v4（文件系统路由）
- **样式**：NativeWind v4（Tailwind for RN）
- **动效**：Moti + React Native Reanimated
- **状态管理**：React Query（服务端状态）+ Zustand（客户端状态）
- **图标**：@expo/vector-icons
- **字体**：Syne + DM Sans + DM Mono

---

## 设计系统约束（严格遵守）

### 颜色
- 使用 `constants/tokens.ts` 中的颜色
- **禁止**使用紫色/蓝色渐变
- 主色：`#E8571A`（橙色）
- 中性色：`#E8E4DC`（沙色）

### 字体
- **标题**：Syne（700 Bold / 800 ExtraBold）
- **正文**：DM Sans（400 Regular / 500 Medium）
- **标签**：DM Mono（400 Regular）
- **禁止**使用 Inter 字体

### 图标
- 使用 `@expo/vector-icons`（Ionicons）
- **禁止**使用 Lucide 图标

### 圆角
- 使用预设值：4px / 8px / 14px / 20px / 28px / 999px
- **禁止**使用其他值

### 阴影
- 使用 `constants/shadows.ts` 中的预设
- **禁止**自定义阴影值

---

## 目录结构

```
apps/mobile/
├── app/                          # Expo Router 页面
│   ├── (onboarding)/             # Onboarding 流程
│   │   ├── welcome.tsx
│   │   ├── name.tsx
│   │   ├── choose-skill.tsx
│   │   └── skill-config.tsx
│   ├── (tabs)/                   # 主应用（Tab 导航）
│   │   ├── index.tsx             # 首页
│   │   ├── memory.tsx            # 记忆列表
│   │   └── settings.tsx          # 设置
│   ├── _layout.tsx               # 根布局
│   └── +not-found.tsx            # 404 页面
├── components/                   # 组件
│   ├── ui/                       # 基础组件
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Badge.tsx
│   ├── SkillCard.tsx             # 业务组件
│   ├── MemoryCard.tsx
│   ├── ChatBubble.tsx
│   ├── ThinkingDots.tsx
│   ├── BottomNav.tsx
│   └── ChatDrawer.tsx            # 对话抽屉
├── constants/                    # Design Tokens
│   ├── tokens.ts                 # 颜色、间距、圆角、字号
│   ├── typography.ts             # 字体样式
│   └── shadows.ts                # 阴影（iOS/Android 适配）
├── hooks/                        # 自定义 Hooks
│   ├── useThemeColors.ts
│   ├── useResponsive.ts
│   └── useReducedMotion.ts
├── utils/                        # 工具函数
│   └── trpc.ts                   # tRPC 客户端
├── global.css                    # NativeWind 入口
└── package.json
```

---

## 组件规范

### 基础组件

所有基础组件在 `components/ui/` 目录下，使用 Design Tokens：

```tsx
// components/ui/Button.tsx
import { colors, radius } from '@/constants/tokens'

export function Button({ variant = 'primary', onPress, children }) {
  return (
    <Pressable onPress={onPress}>
      <Animated.View style={{
        backgroundColor: colors.orange,
        borderRadius: radius.full,
        paddingHorizontal: 22,
        paddingVertical: 12,
      }}>
        <Text style={{ color: '#fff' }}>{children}</Text>
      </Animated.View>
    </Pressable>
  )
}
```

### 业务组件

业务组件直接放在 `components/` 目录下：

```tsx
// components/SkillCard.tsx
import { Button } from '@/components/ui/Button'

export function SkillCard({ skill, onPress }) {
  return (
    <Pressable onPress={onPress}>
      <View className="bg-off-white p-4 rounded-lg">
        <Text className="font-display text-orange">{skill.name}</Text>
      </View>
    </Pressable>
  )
}
```

---

## 样式规范

### 优先使用 NativeWind 类名

```tsx
// ✅ 推荐
<View className="flex-1 bg-sand p-4 gap-3">
  <Text className="font-display text-orange text-2xl">标题</Text>
</View>

// ❌ 避免
<View style={{ flex: 1, backgroundColor: '#E8E4DC', padding: 16, gap: 12 }}>
  <Text style={{ fontFamily: 'Syne_800ExtraBold', color: '#E8571A', fontSize: 24 }}>标题</Text>
</View>
```

### 复杂样式使用 StyleSheet

```tsx
import { StyleSheet } from 'react-native'
import { typography } from '@/constants/typography'

const styles = StyleSheet.create({
  title: {
    ...typography.display,
    color: colors.orange,
  },
})

<Text style={styles.title}>标题</Text>
```

---

## 动效规范

### 使用 Moti（推荐）

```tsx
import { MotiView } from 'moti'

// 进入动画
<MotiView
  from={{ opacity: 0, translateY: 8 }}
  animate={{ opacity: 1, translateY: 0 }}
  transition={{ type: 'spring', damping: 20, stiffness: 100 }}
>
  {children}
</MotiView>

// 交错动画
{items.map((item, i) => (
  <MotiView
    key={item.id}
    from={{ opacity: 0, translateY: 8 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{ delay: i * 80, type: 'spring' }}
  >
    <MemoryCard memory={item} />
  </MotiView>
))}
```

### 按钮触感

```tsx
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'

function AnimatedButton({ onPress, children }) {
  const scale = useSharedValue(1)

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.96) }}
      onPressOut={() => { scale.value = withSpring(1) }}
      onPress={onPress}
    >
      <Animated.View style={useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
      }))}>
        {children}
      </Animated.View>
    </Pressable>
  )
}
```

### 动效原则

- ✅ 只动画 `transform`（scale/translateX/translateY）和 `opacity`
- ❌ 禁止动画 `width`、`height`、`margin`、`padding`

---

## 路由规范

### 文件系统路由

Expo Router 使用文件系统路由，类似 Next.js App Router：

```
app/
├── (onboarding)/
│   ├── _layout.tsx               # Onboarding 布局
│   ├── welcome.tsx               # /onboarding/welcome
│   └── name.tsx                  # /onboarding/name
├── (tabs)/
│   ├── _layout.tsx               # Tab 布局
│   ├── index.tsx                 # /
│   └── memory.tsx                # /memory
└── _layout.tsx                   # 根布局
```

### 导航

```tsx
import { useRouter } from 'expo-router'

const router = useRouter()

// 跳转
router.push('/memory')

// 返回
router.back()

// 替换
router.replace('/home')
```

---

## 状态管理

### 服务端状态：React Query

```tsx
import { trpc } from '@/utils/trpc'

function MemoryList() {
  const { data, isLoading } = trpc.memory.list.useQuery()

  if (isLoading) return <Text>加载中...</Text>

  return (
    <FlatList
      data={data}
      renderItem={({ item }) => <MemoryCard memory={item} />}
    />
  )
}
```

### 客户端状态：Zustand

```tsx
import { create } from 'zustand'

const useStore = create((set) => ({
  assistant: null,
  setAssistant: (assistant) => set({ assistant }),
}))

function Home() {
  const assistant = useStore((state) => state.assistant)
  return <Text>{assistant?.name}</Text>
}
```

---

## 性能优化

### 列表渲染

```tsx
// ✅ 使用 FlatList
<FlatList
  data={memories}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <MemoryCard memory={item} />}
/>

// ❌ 避免 ScrollView + map
<ScrollView>
  {memories.map((item) => <MemoryCard key={item.id} memory={item} />)}
</ScrollView>
```

### 图片优化

```tsx
import { Image } from 'expo-image'

// ✅ 使用 expo-image
<Image
  source={avatarUrl}
  style={{ width: 32, height: 32, borderRadius: 999 }}
  contentFit="cover"
  transition={160}
/>

// ❌ 避免 RN 原生 Image
<Image source={{ uri: avatarUrl }} style={{ width: 32, height: 32 }} />
```

### Reduced Motion 兼容

```tsx
import { useReducedMotion } from '@/hooks/useReducedMotion'

const reduced = useReducedMotion()

<MotiView
  animate={{ opacity: 1, translateY: reduced ? 0 : translateY }}
  transition={{ duration: reduced ? 0 : 420 }}
/>
```

---

## 测试规范

### 单元测试

```tsx
import { render, screen } from '@testing-library/react-native'
import { Button } from '@/components/ui/Button'

test('Button renders correctly', () => {
  render(<Button>点击</Button>)
  expect(screen.getByText('点击')).toBeTruthy()
})
```

### E2E 测试

```tsx
import { by, device, element, expect } from 'detox'

describe('Onboarding', () => {
  it('should complete onboarding flow', async () => {
    await element(by.id('welcome-start-button')).tap()
    await element(by.id('name-input')).typeText('小助')
    await element(by.id('name-next-button')).tap()
    await expect(element(by.id('choose-skill-screen'))).toBeVisible()
  })
})
```

---

## 常见问题

### Q: 为什么不用 React Native Paper？
A: 设计风格独特（橙色 + 沙色），覆盖 Material Design 成本高，自实现核心组件更可控。

### Q: 为什么用 NativeWind 而不是 styled-components？
A: Tailwind 类名更接近 Web 开发习惯，团队熟悉度高，编译时生成样式性能更好。

### Q: 为什么用 Moti 而不是 Animated API？
A: Moti 是声明式动效，比 Animated API 更简洁，基于 Reanimated 性能一样好。

### Q: 如何预览 UI？
A: 使用 Expo Go app 扫码连接开发服务器，真机实时预览。

---

## 参考文档

- **设计系统**：`docs/design-docs/design-system.md`
- **线稿**：`docs/design-docs/wireframes/`
- **PRD**：`docs/product-specs/prd.md`
- **架构**：`ARCHITECTURE.md`
