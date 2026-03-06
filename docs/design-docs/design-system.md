# AI小助理 · 设计系统

> 面向程序员的实施指南 · React Native (Expo) + NativeWind v4

---

## 目录

0. [UI 框架选择](#0-ui-框架选择)
1. [快速上手](#1-快速上手)
2. [Design Tokens（平台无关）](#2-design-tokens平台无关)
3. [色彩系统](#3-色彩系统)
4. [字体系统](#4-字体系统)
5. [间距与圆角](#5-间距与圆角)
6. [阴影系统](#6-阴影系统)
7. [动效规范](#7-动效规范)
8. [基础组件](#8-基础组件)
9. [业务组件](#9-业务组件)
10. [深色模式](#10-深色模式)
11. [响应式规范](#11-响应式规范)
12. [性能规范](#12-性能规范)

---

## 0. UI 框架选择

### 0.1 推荐框架

**主框架：NativeWind v4**（Tailwind CSS for React Native）
- **用途**：样式系统，提供 Tailwind 类名支持
- **作用**：配置设计 tokens（颜色、字体、间距、圆角），让程序员用 `className` 快速写样式
- **配置文件**：`tailwind.config.js`

**组件策略：自实现 + React Native 原生组件**
- **基础组件**（Button、Input、Badge）：自实现（见 `components/ui/`）
- **原生组件**（Switch、Modal、FlatList）：直接使用 React Native 自带
- **第三方组件**：
  - `@gorhom/bottom-sheet`（半屏抽屉）
  - `moti`（声明式动效）
  - `expo-image`（图片优化）
  - `@expo/vector-icons`（图标库）

---

### 0.2 为什么不用 React Native Paper / NativeBase？

| 原因 | 说明 |
|------|------|
| **设计风格独特** | 本项目使用暖色调沙色系 + 橙色品牌色，与 Material Design（Paper）和 NativeBase 默认风格差异较大 |
| **定制成本高** | 覆盖框架主题的成本 > 自实现核心组件（Button、Input、Badge 只需 100-200 行代码） |
| **性能优先** | 自实现组件配合 Moti 和 Reanimated，性能更可控，避免框架冗余代码 |
| **学习曲线** | NativeWind 的 Tailwind 类名更接近 Web 开发习惯，团队熟悉度高 |

**结论**：本项目采用 **NativeWind（样式系统）+ 自实现核心组件** 的混合方案。

---

### 0.3 主题配置（NativeWind）

所有设计 tokens 已配置在 `tailwind.config.js`，程序员可以直接使用 Tailwind 类名：

**配置示例：**

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        orange:  { DEFAULT: '#E8571A', dim: '#C44A14', bg: '#F5E8E1' },
        sand:    { DEFAULT: '#E8E4DC', dark: '#D6D0C4', light: '#F2EFE9' },
        ink:     '#1A1814',
        'off-white': '#FAFAF8',
        success: { DEFAULT: '#3A8C5C', bg: '#E6F4ED' },
        danger:  '#D94F3D',
      },
      fontFamily: {
        display: ['Syne_800ExtraBold'],
        'display-bold': ['Syne_700Bold'],
        body:    ['DMSans_400Regular'],
        'body-medium': ['DMSans_500Medium'],
        mono:    ['DMMonoRegular'],
      },
      borderRadius: {
        xs: 4, sm: 8, md: 14, lg: 20, xl: 28,
      },
    }
  }
}
```

**使用示例：**

```tsx
// 程序员可以直接用 Tailwind 类名
<View className="bg-sand p-4 rounded-lg">
  <Text className="font-display text-orange text-2xl">上午好</Text>
  <Text className="font-body text-ink-60 text-sm">今天还差 5 个单词</Text>
</View>
```

---

### 0.4 组件实现策略

| 组件类型             | 实现方式  | 原因                                  | 文件位置                                   |
| ---------------- | ----- | ----------------------------------- | -------------------------------------- |
| **Button**       | 自实现   | 需要橙色品牌色 + 圆角胶囊形状 + 按压动效（scale 0.96） | `components/ui/Button.tsx`             |
| **Input**        | 自实现   | 需要沙色背景 + 橙色焦点边框 + Label 在上方         | `components/ui/Input.tsx`              |
| **Badge**        | 自实现   | 需要单色等宽字体（DM Mono）+ 特定圆角 + 透明度变体     | `components/ui/Badge.tsx`              |
| **Switch**       | RN 原生 | 原生组件性能好，只需覆盖颜色                      | `<Switch tintColor={colors.orange} />` |
| **Modal**        | RN 原生 | 原生组件支持完整，只需自定义内容区样式                 | `<Modal>` + 自定义内容                      |
| **FlatList**     | RN 原生 | 列表性能优化必须用原生组件                       | `<FlatList />`                         |
| **SkillCard**    | 自实现   | 业务特定组件，包含图标、标题、副标题、通知红点             | `components/SkillCard.tsx`             |
| **MemoryCard**   | 自实现   | 业务特定组件，包含记忆内容、类型标签、来源标签             | `components/MemoryCard.tsx`            |
| **ChatBubble**   | 自实现   | 业务特定组件，包含头像、气泡、"基于记忆"标签             | `components/ChatBubble.tsx`            |
| **ThinkingDots** | 自实现   | 业务特定动效，3 个圆点交错呼吸动画                  | `components/ThinkingDots.tsx`          |
| **BottomNav**    | 自实现   | 业务特定组件，圆角胶囊形状 + 激活状态                | `components/BottomNav.tsx`             |

---

### 0.5 第三方组件库

以下场景使用第三方库（避免重复造轮子）：

| 库                         | 用途               | 安装命令                                       |
| ------------------------- | ---------------- | ------------------------------------------ |
| `@gorhom/bottom-sheet`    | 半屏对话框（抽屉）        | `npm install @gorhom/bottom-sheet`         |
| `moti`                    | 声明式动效（进入动画、交错动画） | `npx expo install moti`                    |
| `expo-image`              | 图片优化（缓存、占位符、过渡）  | `npx expo install expo-image`              |
| `@expo/vector-icons`      | 图标库（Ionicons）    | Expo 自带，无需安装                               |
| `react-native-reanimated` | 硬件加速动效（底层）       | `npx expo install react-native-reanimated` |

---

### 0.6 程序员工作流程

1. **安装依赖**（见 1.2 初始化项目）
2. **配置 NativeWind**（见 1.3 配置 NativeWind v4）
3. **使用自实现组件**：
   ```tsx
   import { Button } from '@/components/ui/Button'
   import { Input } from '@/components/ui/Input'
   
   <Button onPress={handleSave}>保存</Button>
   <Input label="助理名字" value={name} onChangeText={setName} />
   ```
4. **使用 Tailwind 类名**（布局、间距、颜色）：
   ```tsx
   <View className="flex-1 bg-sand p-4 gap-3">
     <Text className="font-display text-orange text-2xl">标题</Text>
   </View>
   ```
5. **使用原生组件**（Switch、Modal、FlatList）：
   ```tsx
   <Switch value={enabled} onValueChange={setEnabled} tintColor={colors.orange} />
   ```

---

## 1. 快速上手

### 1.1 技术栈

```
Expo SDK 52+
├── expo-router v4          # 路由（文件系统路由，类 Next.js App Router）
├── nativewind v4           # Tailwind CSS for React Native
├── react-native-reanimated # 硬件加速动效
├── moti                    # 声明式动效（基于 Reanimated，推荐）
├── @expo/vector-icons      # 图标
├── expo-notifications      # 推送通知（核心功能）
├── expo-secure-store       # 本地安全存储
└── @tanstack/react-query   # 数据请求与缓存
```

### 1.2 初始化项目

```bash
npx create-expo-app@latest ai-assistant --template blank-typescript
cd ai-assistant

# 安装核心依赖
npx expo install nativewind react-native-reanimated moti
npx expo install expo-router expo-notifications expo-secure-store
npm install @tanstack/react-query @expo/vector-icons
```

### 1.3 配置 NativeWind v4

**`tailwind.config.js`：**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // 品牌色
        orange:  { DEFAULT: '#E8571A', dim: '#C44A14', bg: '#F5E8E1' },
        // 中性色
        sand:    { DEFAULT: '#E8E4DC', dark: '#D6D0C4', light: '#F2EFE9' },
        ink:     '#1A1814',
        'off-white': '#FAFAF8',
        // 功能色
        success: { DEFAULT: '#3A8C5C', bg: '#E6F4ED' },
        danger:  '#D94F3D',
      },
      fontFamily: {
        display: ['Syne_800ExtraBold'],
        'display-bold': ['Syne_700Bold'],
        body:    ['DMSans_400Regular'],
        'body-medium': ['DMSans_500Medium'],
        mono:    ['DMMonoRegular'],
      },
      borderRadius: {
        xs: 4, sm: 8, md: 14, lg: 20, xl: 28,
      },
      boxShadow: {
        // RN 阴影用 elevation（Android）或 shadow-* 属性
        sm: '0 1px 3px rgba(26,24,20,0.08)',
        md: '0 4px 12px rgba(26,24,20,0.10)',
        lg: '0 12px 32px rgba(26,24,20,0.14)',
        orange: '0 6px 20px rgba(232,87,26,0.30)',
      },
    },
  },
  plugins: [],
}
```

**`babel.config.js`：**

```js
module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  }
}
```

**`global.css`（NativeWind 入口）：**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**`app/_layout.tsx`：**

```tsx
import '../global.css'
import { useFonts } from 'expo-font'
import {
  Syne_700Bold,
  Syne_800ExtraBold,
} from '@expo-google-fonts/syne'
import {
  DMSans_400Regular,
  DMSans_500Medium,
} from '@expo-google-fonts/dm-sans'
import { DMMono_400Regular as DMMonoRegular } from '@expo-google-fonts/dm-mono'

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Syne_700Bold,
    Syne_800ExtraBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMMonoRegular,
  })

  if (!fontsLoaded) return null

  return <Stack />
}
```

---

## 2. Design Tokens（平台无关）

> 这个文件是设计系统的单一事实来源（Single Source of Truth），Web 和 RN 共用。

新建 `constants/tokens.ts`：

```ts
// constants/tokens.ts

export const colors = {
  // Primitives
  sand:        '#E8E4DC',
  sandDark:    '#D6D0C4',
  sandLight:   '#F2EFE9',
  ink:         '#1A1814',
  offWhite:    '#FAFAF8',
  orange:      '#E8571A',
  orangeDim:   '#C44A14',
  orangeBg:    '#F5E8E1',
  bluesoft:    '#C8D8E8',
  success:     '#3A8C5C',
  successBg:   '#E6F4ED',
  danger:      '#D94F3D',

  // Ink alpha
  ink80:  'rgba(26,24,20,0.80)',
  ink60:  'rgba(26,24,20,0.60)',
  ink30:  'rgba(26,24,20,0.30)',
  ink10:  'rgba(26,24,20,0.10)',
  ink05:  'rgba(26,24,20,0.05)',

  // Orange alpha
  orange80: 'rgba(232,87,26,0.80)',
  orange50: 'rgba(232,87,26,0.50)',
  orange20: 'rgba(232,87,26,0.20)',
  orange10: 'rgba(232,87,26,0.10)',
}

// Semantic tokens（浅色模式）
export const light = {
  bg:           colors.sand,
  surface:      colors.offWhite,
  surfaceSub:   colors.sandLight,
  border:       colors.ink10,
  borderStrong: colors.ink30,
  text:         colors.ink,
  textSub:      colors.ink60,
  textDisabled: colors.ink30,
  accent:       colors.orange,
  accentHover:  colors.orangeDim,
}

// Semantic tokens（深色模式）
export const dark = {
  bg:           '#141210',
  surface:      '#1F1D19',
  surfaceSub:   '#2A2823',
  border:       'rgba(232,228,220,0.10)',
  borderStrong: 'rgba(232,228,220,0.22)',
  text:         colors.sand,
  textSub:      'rgba(232,228,220,0.55)',
  textDisabled: 'rgba(232,228,220,0.25)',
  accent:       colors.orange,   // 深色模式橙色不变
  accentHover:  colors.orangeDim,
}

export const spacing = {
  1:  2,
  2:  4,
  3:  8,
  4:  12,
  5:  16,
  6:  20,
  8:  24,
  10: 32,
  12: 40,
  16: 48,
  20: 64,
}

export const radius = {
  xs:   4,
  sm:   8,
  md:   14,
  lg:   20,
  xl:   28,
  full: 999,
}

export const fontSize = {
  display: 40,
  titleL:  22,
  titleM:  16,
  bodyL:   15,
  bodyM:   13,
  caption: 11,
  mono:    11,
}

export const fontWeight = {
  regular: '400' as const,
  medium:  '500' as const,
  bold:    '700' as const,
  black:   '800' as const,
}

export const duration = {
  instant: 80,
  fast:    160,
  normal:  240,
  slow:    380,
  enter:   420,
}
```

---

## 3. 色彩系统

### 3.1 色板

| Token | 值 | 用途 |
|---|---|---|
| `colors.sand` | `#E8E4DC` | 全局背景 |
| `colors.offWhite` | `#FAFAF8` | 卡片、组件面 |
| `colors.sandLight` | `#F2EFE9` | 输入框背景、浅面 |
| `colors.ink` | `#1A1814` | 主文字 |
| `colors.ink60` | `rgba(26,24,20,.60)` | 次要文字 |
| `colors.orange` | `#E8571A` | 主品牌色、CTA |
| `colors.danger` | `#D94F3D` | 危险操作 |

### 3.2 主题 Hook

```ts
// hooks/useThemeColors.ts
import { useColorScheme } from 'nativewind'
import { light, dark } from '@/constants/tokens'

export function useThemeColors() {
  const { colorScheme } = useColorScheme()
  return colorScheme === 'dark' ? dark : light
}

// 用法
const c = useThemeColors()
<View style={{ backgroundColor: c.surface }} />
```

> **禁止**：不要用纯黑 `#000`，统一用 `colors.ink`（#1A1814）

---

## 4. 字体系统

### 4.1 字阶规范

| 角色 | 字体 | 字号 | 字重 | 用途 |
|---|---|---|---|---|
| Display | Syne | 40px | 800 | 页面标题、问候语 |
| Title L | Syne | 22px | 700 | 模块标题 |
| Title M | Syne | 16px | 700 | 卡片标题 |
| Body L | DM Sans | 15px | 400 | 正文内容 |
| Body M | DM Sans | 13px | 400 | 对话文字、说明 |
| Caption | DM Sans | 11px | 400 | 标注、时间、来源 |
| Mono | DM Mono | 11px | 400 | 标签、代码、数据 |

### 4.2 字体工具类

```tsx
// constants/typography.ts
import { StyleSheet } from 'react-native'
import { fontSize, fontWeight } from './tokens'

export const typography = StyleSheet.create({
  display: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: fontSize.display,
    lineHeight: fontSize.display * 0.95,
    letterSpacing: -0.8,
  },
  titleL: {
    fontFamily: 'Syne_700Bold',
    fontSize: fontSize.titleL,
    lineHeight: fontSize.titleL * 1.2,
  },
  titleM: {
    fontFamily: 'Syne_700Bold',
    fontSize: fontSize.titleM,
    lineHeight: fontSize.titleM * 1.3,
  },
  bodyL: {
    fontFamily: 'DMSans_400Regular',
    fontSize: fontSize.bodyL,
    lineHeight: fontSize.bodyL * 1.6,
  },
  bodyM: {
    fontFamily: 'DMSans_400Regular',
    fontSize: fontSize.bodyM,
    lineHeight: fontSize.bodyM * 1.6,
  },
  caption: {
    fontFamily: 'DMSans_400Regular',
    fontSize: fontSize.caption,
    lineHeight: fontSize.caption * 1.5,
  },
  mono: {
    fontFamily: 'DMMonoRegular',
    fontSize: fontSize.mono,
    letterSpacing: 0.6,
  },
})

// 用法
<Text style={typography.display}>上午好</Text>
<Text style={[typography.bodyM, { color: c.textSub }]}>今天还差 5 个单词</Text>
```

> **禁止**：不要用系统默认字体，所有文字必须指定 `fontFamily`

---

## 5. 间距与圆角

### 5.1 间距（8pt Grid）

```tsx
// RN 中用 StyleSheet 或直接写数字
<View style={{ gap: 8 }} />           // gap-2
<View style={{ padding: 16 }} />      // p-4
<View style={{ marginBottom: 24 }} /> // mb-6

// 或用 NativeWind（推荐，更简洁）
<View className="gap-2 p-4 mb-6" />
```

### 5.2 圆角用途

| 值 | NativeWind 类 | 用途 |
|---|---|---|
| 4px | `rounded-[4px]` | 提示文字 |
| 8px | `rounded-sm` | 标签、图标 |
| 14px | `rounded-md` | 输入框、记忆卡片 |
| 20px | `rounded-lg` | 技能卡片、通知 |
| 28px | `rounded-xl` | 底部导航 |
| 999px | `rounded-full` | 按钮、头像 |

---

## 6. 阴影系统

RN 的阴影需要区分平台：

```ts
// constants/shadows.ts
import { Platform } from 'react-native'
import { colors } from './tokens'

// iOS 用 shadow-*，Android 用 elevation
export const shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: colors.ink,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
    },
    android: { elevation: 2 },
  }),
  md: Platform.select({
    ios: {
      shadowColor: colors.ink,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.10,
      shadowRadius: 12,
    },
    android: { elevation: 6 },
  }),
  lg: Platform.select({
    ios: {
      shadowColor: colors.ink,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.14,
      shadowRadius: 32,
    },
    android: { elevation: 12 },
  }),
  orange: Platform.select({
    ios: {
      shadowColor: colors.orange,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.30,
      shadowRadius: 20,
    },
    android: { elevation: 8 },
  }),
}

// 用法
<View style={[styles.card, shadows.sm]} />
```

| 阴影 | 用途 |
|---|---|
| `shadows.sm` | 记忆卡片、输入框、技能小卡片 |
| `shadows.md` | 技能大卡片、底部导航 |
| `shadows.lg` | 半屏对话框、通知卡片 |
| `shadows.orange` | CTA 按钮悬停、FAB 悬停 |

---

## 7. 动效规范

### 7.1 使用 Moti（推荐）

```bash
npx expo install moti
```

```tsx
import { MotiView, MotiText } from 'moti'
import { Easing } from 'react-native-reanimated'

// 进入动画（替代 CSS fadeIn + slideUp）
<MotiView
  from={{ opacity: 0, translateY: 8 }}
  animate={{ opacity: 1, translateY: 0 }}
  transition={{ type: 'spring', damping: 20, stiffness: 100 }}
>
  {children}
</MotiView>

// 交错入场（列表）
{items.map((item, i) => (
  <MotiView
    key={item.id}
    from={{ opacity: 0, translateY: 8 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{
      type: 'spring',
      damping: 20,
      stiffness: 100,
      delay: i * 80,    // 交错 80ms
    }}
  >
    <MemoryCard memory={item} />
  </MotiView>
))}
```

### 7.2 时长参考

| 场景 | 时长 | 类型 |
|---|---|---|
| tap 按下反馈 | 80ms | timing |
| 颜色切换、hover | 160ms | timing |
| 下拉菜单、tooltip | 240ms | spring |
| 页面切换、抽屉 | 380ms | timing |
| 气泡入场、列表进入 | 420ms + stagger | spring |

### 7.3 按钮触感（Pressable）

```tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import { Pressable } from 'react-native'

function AnimatedButton({ onPress, children }) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.96, { damping: 20, stiffness: 300 }) }}
      onPressOut={() => { scale.value = withSpring(1,    { damping: 20, stiffness: 200 }) }}
      onPress={onPress}
    >
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
    </Pressable>
  )
}
```

> **规则**：只动画 `transform`（scale/translateX/translateY）和 `opacity`，不动画 `width/height/margin`

---

## 8. 基础组件

> shadcn/ui 在 RN 里不可用，以下是对应的自实现版本。
> 全部使用 `design-tokens.ts` 里的值，保证视觉统一。

### 8.1 Button

```tsx
// components/ui/Button.tsx
import { Pressable, Text, ActivityIndicator } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { colors, radius, duration } from '@/constants/tokens'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size    = 'default' | 'sm' | 'icon'

interface ButtonProps {
  variant?: Variant
  size?: Size
  disabled?: boolean
  loading?: boolean
  onPress?: () => void
  children: React.ReactNode
}

const variantStyles = {
  primary:   { bg: colors.orange,    text: '#fff',       border: 'transparent' },
  secondary: { bg: 'transparent',    text: colors.ink,   border: colors.ink30  },
  ghost:     { bg: colors.sandLight, text: colors.ink60, border: 'transparent' },
  danger:    { bg: 'transparent',    text: colors.danger, border: 'rgba(217,79,61,0.3)' },
}

const sizeStyles = {
  default: { paddingHorizontal: 22, paddingVertical: 12, fontSize: 14 },
  sm:      { paddingHorizontal: 14, paddingVertical: 7,  fontSize: 12 },
  icon:    { width: 44, height: 44, padding: 0 },
}

export function Button({ variant = 'primary', size = 'default', disabled, loading, onPress, children }: ButtonProps) {
  const scale = useSharedValue(1)
  const v = variantStyles[variant]
  const s = sizeStyles[size]

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.96, { damping: 20, stiffness: 300 }) }}
      onPressOut={() => { scale.value = withSpring(1,    { damping: 20, stiffness: 200 }) }}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <Animated.View style={[
        animStyle,
        {
          backgroundColor: disabled ? colors.orange50 : v.bg,
          borderRadius: radius.full,
          borderWidth: v.border !== 'transparent' ? 1.5 : 0,
          borderColor: v.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          opacity: disabled ? 0.5 : 1,
          ...s,
        }
      ]}>
        {loading
          ? <ActivityIndicator size="small" color={v.text} />
          : typeof children === 'string'
            ? <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: s.fontSize, color: v.text }}>{children}</Text>
            : children
        }
      </Animated.View>
    </Pressable>
  )
}
```

**使用：**

```tsx
<Button onPress={handleStart}>开始背单词</Button>
<Button variant="secondary" onPress={handleView}>查看记忆</Button>
<Button variant="ghost" onPress={handleSkip}>跳过</Button>
<Button variant="danger" onPress={handleDelete}>删除记忆</Button>
<Button disabled>已完成</Button>
<Button loading>处理中</Button>
```

---

### 8.2 Input

```tsx
// components/ui/Input.tsx
import { View, TextInput, Text, StyleSheet } from 'react-native'
import { useState } from 'react'
import { colors, radius } from '@/constants/tokens'
import { typography } from '@/constants/typography'

interface InputProps {
  label?: string
  hint?: string
  error?: string
  placeholder?: string
  value?: string
  onChangeText?: (text: string) => void
  disabled?: boolean
  secureTextEntry?: boolean
}

export function Input({ label, hint, error, placeholder, value, onChangeText, disabled }: InputProps) {
  const [focused, setFocused] = useState(false)

  return (
    <View style={{ gap: 5 }}>
      {label && (
        <Text style={[typography.mono, { color: colors.ink60, textTransform: 'uppercase', letterSpacing: 0.8 }]}>
          {label}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.ink30}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        editable={!disabled}
        style={{
          backgroundColor: focused ? colors.offWhite : colors.sandLight,
          borderWidth: 1.5,
          borderColor: error ? colors.danger : focused ? colors.orange : colors.ink10,
          borderRadius: radius.md,
          paddingHorizontal: 14,
          paddingVertical: 11,
          fontFamily: 'DMSans_400Regular',
          fontSize: 14,
          color: disabled ? colors.ink30 : colors.ink,
          opacity: disabled ? 0.5 : 1,
        }}
      />
      {(hint || error) && (
        <Text style={[typography.caption, { color: error ? colors.danger : colors.ink60 }]}>
          {error ?? hint}
        </Text>
      )}
    </View>
  )
}
```

**使用：**

```tsx
// 标准
<Input label="助理名字" placeholder="给助理起个名字…" value={name} onChangeText={setName} />

// 带 hint
<Input
  label="背景提示词"
  placeholder="描述助理风格…"
  hint="留空则使用默认风格"
/>

// 错误
<Input
  label="助理名字"
  value="已存在的名字"
  error="该名字已被使用"
/>
```

> **规则**：Label **必须**在 Input 上方，不能用 placeholder 替代 Label

---

### 8.3 Badge

```tsx
// components/ui/Badge.tsx
import { View, Text } from 'react-native'
import { colors, radius } from '@/constants/tokens'

type Variant = 'orange' | 'ink' | 'ghost' | 'success'

const variantStyles = {
  orange:  { bg: colors.orangeBg,   text: colors.orangeDim,  border: 'rgba(232,87,26,0.18)' },
  ink:     { bg: colors.ink,        text: colors.sand,       border: 'transparent' },
  ghost:   { bg: 'transparent',     text: colors.ink60,      border: colors.ink10 },
  success: { bg: colors.successBg,  text: colors.success,    border: 'rgba(58,140,92,0.2)' },
}

export function Badge({ variant = 'orange', children }: { variant?: Variant; children: string }) {
  const v = variantStyles[variant]
  return (
    <View style={{
      backgroundColor: v.bg,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: v.border,
      paddingHorizontal: 10,
      paddingVertical: 4,
      alignSelf: 'flex-start',
    }}>
      <Text style={{ fontFamily: 'DMMonoRegular', fontSize: 11, color: v.text }}>
        {children}
      </Text>
    </View>
  )
}
```

---

## 9. 业务组件

### 9.1 技能卡片 `SkillCard`

```tsx
// components/SkillCard.tsx
import { View, Text, Pressable } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { colors, radius, shadows } from '@/constants/tokens'
import { typography } from '@/constants/typography'

interface SkillCardProps {
  icon: React.ReactNode
  title: string
  subtitle: string
  hasNotification?: boolean
  onPress?: () => void
}

export function SkillCard({ icon, title, subtitle, hasNotification, onPress }: SkillCardProps) {
  const scale = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 20, stiffness: 300 }) }}
      onPressOut={() => { scale.value = withSpring(1,    { damping: 20, stiffness: 200 }) }}
      onPress={onPress}
    >
      <Animated.View style={[
        animStyle,
        {
          backgroundColor: colors.offWhite,
          borderRadius: radius.lg,
          padding: 18,
          borderWidth: 1,
          borderColor: colors.ink10,
          ...shadows.sm,
        }
      ]}>
        {hasNotification && (
          <View style={{
            position: 'absolute', top: 12, right: 12,
            width: 7, height: 7, borderRadius: 999,
            backgroundColor: colors.orange,
          }} />
        )}
        <View style={{
          width: 40, height: 40,
          backgroundColor: colors.orangeBg,
          borderRadius: radius.sm,
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 12,
        }}>
          {icon}
        </View>
        <Text style={[typography.titleM, { marginBottom: 3 }]}>{title}</Text>
        <Text style={[typography.caption, { color: colors.ink60 }]}>{subtitle}</Text>
      </Animated.View>
    </Pressable>
  )
}
```

---

### 9.2 记忆卡片 `MemoryCard`

```tsx
// components/MemoryCard.tsx
import { View, Text, Pressable } from 'react-native'
import { Badge } from '@/components/ui/Badge'
import { colors, radius } from '@/constants/tokens'
import { typography } from '@/constants/typography'

interface Memory {
  id: string
  content: string
  type: 'preference' | 'habit' | 'fact' | 'weakness' | 'progress'
  skillSource: string
  confidence: number   // 0.0 ~ 1.0
  createdAt: Date
}

export function MemoryCard({ memory, onPress }: { memory: Memory; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <View style={{
        backgroundColor: colors.sandLight,
        borderRadius: radius.md,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: colors.ink10,
      }}>
        <Text style={[typography.bodyM, { marginBottom: 8 }]}>
          {memory.content}
        </Text>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          <Badge variant="orange">{memory.type}</Badge>
          <Badge variant="ghost">来自：{memory.skillSource}</Badge>
          {memory.confidence >= 0.85 && (
            <Badge variant="success">高置信度</Badge>
          )}
        </View>
      </View>
    </Pressable>
  )
}

// 空状态
export function MemoryEmpty({ onStartChat }: { onStartChat: () => void }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
      <Text style={{ fontSize: 52, marginBottom: 14 }}>📭</Text>
      <Text style={[typography.titleM, { marginBottom: 6, textAlign: 'center' }]}>
        还没有记忆
      </Text>
      <Text style={[typography.bodyM, { color: colors.ink60, textAlign: 'center', marginBottom: 20 }]}>
        开始和助理聊天，{'\n'}他会慢慢记住你的偏好
      </Text>
      <Button onPress={onStartChat}>开始对话</Button>
    </View>
  )
}
```

---

### 9.3 对话气泡 `ChatBubble`

```tsx
// components/ChatBubble.tsx
import { View, Text } from 'react-native'
import { MotiView } from 'moti'
import { colors, radius } from '@/constants/tokens'
import { typography } from '@/constants/typography'

interface MessageProps {
  role: 'ai' | 'user'
  content: string
  memoryBased?: boolean
  animationDelay?: number
}

export function ChatBubble({ role, content, memoryBased, animationDelay = 0 }: MessageProps) {
  const isUser = role === 'user'

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100, delay: animationDelay }}
      style={{ flexDirection: isUser ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}
    >
      {/* 头像 */}
      <View style={{
        width: 30, height: 30, borderRadius: 999,
        backgroundColor: isUser ? colors.orange : colors.ink,
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Text style={{
          fontFamily: 'Syne_800ExtraBold',
          fontSize: 12,
          color: colors.sand,
        }}>
          {isUser ? '我' : '助'}
        </Text>
      </View>

      {/* 气泡 */}
      <View style={{ maxWidth: '72%' }}>
        <View style={{
          backgroundColor: isUser ? colors.orange : colors.offWhite,
          paddingHorizontal: 13,
          paddingVertical: 10,
          borderRadius: 16,
          borderBottomLeftRadius: isUser ? 16 : 3,
          borderBottomRightRadius: isUser ? 3 : 16,
          ...(isUser ? {} : {
            shadowColor: colors.ink,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 3,
          }),
        }}>
          <Text style={[typography.bodyM, { color: isUser ? '#fff' : colors.ink }]}>
            {content}
          </Text>
        </View>
        {memoryBased && (
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 3,
            marginTop: 5, alignSelf: 'flex-start',
            backgroundColor: colors.orangeBg,
            paddingHorizontal: 7, paddingVertical: 2,
            borderRadius: 999,
          }}>
            <Text style={[typography.mono, { color: colors.orangeDim }]}>
              📎 基于记忆
            </Text>
          </View>
        )}
      </View>
    </MotiView>
  )
}
```

---

### 9.4 思考中动画 `ThinkingDots`

```tsx
// components/ThinkingDots.tsx
import { View } from 'react-native'
import { MotiView } from 'moti'
import { colors, shadows } from '@/constants/tokens'

export function ThinkingDots() {
  return (
    <View style={{
      flexDirection: 'row',
      gap: 4,
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: colors.offWhite,
      borderRadius: 14,
      alignSelf: 'flex-start',
      ...shadows.sm,
    }}>
      {[0, 150, 300].map((delay) => (
        <MotiView
          key={delay}
          from={{ scale: 0.55, opacity: 0.35 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: 'timing',
            duration: 600,
            delay,
            loop: true,
            repeatReverse: true,
          }}
          style={{
            width: 6, height: 6,
            borderRadius: 999,
            backgroundColor: colors.orange,
          }}
        />
      ))}
    </View>
  )
}
```

---

### 9.5 底部导航 `BottomNav`

```tsx
// components/BottomNav.tsx
import { View, Text, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { usePathname, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, shadows } from '@/constants/tokens'
import { typography } from '@/constants/typography'

const tabs = [
  { href: '/',         icon: 'grid-outline',        label: '首页' },
  { href: '/chat',     icon: 'chatbubble-outline',   label: '对话' },
  { href: '/memory',   icon: 'brain-outline',        label: '记忆' },
  { href: '/settings', icon: 'settings-outline',     label: '设置' },
] as const

export function BottomNav() {
  const insets = useSafeAreaInsets()
  const pathname = usePathname()
  const router = useRouter()

  return (
    <View style={{
      paddingBottom: insets.bottom + 8,  // safe area
      paddingHorizontal: 16,
      paddingTop: 8,
      backgroundColor: 'transparent',
    }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: colors.offWhite,
        borderRadius: radius.xl,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: colors.ink10,
        ...shadows.md,
      }}>
        {tabs.map(({ href, icon, label }) => {
          const isActive = pathname === href
          return (
            <Pressable
              key={href}
              onPress={() => router.push(href)}
              style={{
                alignItems: 'center',
                gap: 3,
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: radius.md,
                backgroundColor: isActive ? colors.orangeBg : 'transparent',
              }}
            >
              <Ionicons
                name={icon as any}
                size={18}
                color={isActive ? colors.orange : colors.ink60}
              />
              <Text style={[
                typography.mono,
                { color: isActive ? colors.orange : colors.ink60 }
              ]}>
                {label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
```

---

## 10. 深色模式

```tsx
// app/_layout.tsx
import { useColorScheme } from 'nativewind'

// NativeWind 自动跟随系统，或手动切换
const { colorScheme, setColorScheme } = useColorScheme()

// 切换
setColorScheme('dark')
setColorScheme('light')
setColorScheme('system')  // 跟随系统
```

**深色模式原则：**
- 背景用 `#141210`（暖棕），不是纯黑 `#000`
- 橙色 `#E8571A` 深浅模式下保持不变
- 切换过渡动效用 Reanimated，避免闪烁

---

## 11. 响应式规范

### 11.1 设备基准

| 设备 | 宽度 | 水平内边距 | Display | Body |
|---|---|---|---|---|
| iPhone SE | 375px | 14px | 18px | 13px |
| **iPhone 15 ✦ 基准** | **390px** | **16px** | **20px** | **15px** |
| iPhone 15 Pro Max | 430px | 18px | 22px | 16px |

```tsx
// hooks/useResponsive.ts
import { Dimensions } from 'react-native'

const { width } = Dimensions.get('window')

export const responsive = {
  pagePadding:   width < 380 ? 14 : width > 420 ? 18 : 16,
  displaySize:   width < 380 ? 18 : width > 420 ? 22 : 20,
  bodySize:      width < 380 ? 13 : width > 420 ? 16 : 15,
  todoMaxItems:  width < 380 ? 1  : width > 420 ? 3  : 2,
}
```

### 11.2 Safe Area（必须处理）

```tsx
// 每个屏幕页面都要包一层
import { SafeAreaView } from 'react-native-safe-area-context'

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.sand }}>
      {/* 内容 */}
    </SafeAreaView>
  )
}
```

---

## 12. 性能规范

### 12.1 列表渲染

```tsx
// 长列表用 FlatList，不要用 ScrollView + map
import { FlatList } from 'react-native'

<FlatList
  data={memories}
  keyExtractor={(item) => item.id}
  renderItem={({ item, index }) => (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: index * 60, type: 'spring', damping: 20, stiffness: 100 }}
    >
      <MemoryCard memory={item} />
    </MotiView>
  )}
  contentContainerStyle={{ gap: 8, padding: 16 }}
/>
```

### 12.2 只动画合成属性

```
✅ 可以：transform（scale/translateX/translateY）、opacity
❌ 禁止：width、height、margin、padding、top、left
```

### 12.3 图片优化

```tsx
// 用 expo-image，不用 RN 原生 Image
import { Image } from 'expo-image'

<Image
  source={avatarUrl}
  style={{ width: 32, height: 32, borderRadius: 999 }}
  contentFit="cover"
  transition={160}
/>
```

### 12.4 Reduced Motion 兼容

```tsx
// hooks/useReducedMotion.ts
import { AccessibilityInfo, useEffect, useState } from 'react'

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced)
  }, [])
  return reduced
}

// 用法
const reduced = useReducedMotion()
<MotiView
  animate={{ opacity: 1, translateY: reduced ? 0 : translateY }}
  transition={{ duration: reduced ? 0 : duration.enter }}
/>
```

---

## 附录：快速查阅表

### 组件对照表（shadcn → RN 自实现）

| shadcn/ui | React Native 版本 | 文件 |
|---|---|---|
| `<Button>` | `<Button>` | `components/ui/Button.tsx` |
| `<Input>` + `<Label>` | `<Input>` | `components/ui/Input.tsx` |
| `<Badge>` | `<Badge>` | `components/ui/Badge.tsx` |
| `<Card>` | `<View>` + 样式 | 直接用 View |
| `<Switch>` | `<Switch>` (RN 原生) | 直接用 RN 自带 |
| `<Progress>` | `<View>` + 动效 | 自实现 |
| `<Dialog>` | `<Modal>` (RN 原生) | 直接用 RN 自带 |
| Sheet (bottom) | `@gorhom/bottom-sheet` | 第三方库 |
| Toast | `<NotifCard>` | 自实现 |

### 业务组件清单

| 组件 | 文件 |
|---|---|
| `SkillCard` | `components/SkillCard.tsx` |
| `MemoryCard` / `MemoryEmpty` | `components/MemoryCard.tsx` |
| `ChatBubble` | `components/ChatBubble.tsx` |
| `ThinkingDots` | `components/ThinkingDots.tsx` |
| `BottomNav` | `components/BottomNav.tsx` |

### Design Tokens 文件清单

| 文件 | 内容 |
|---|---|
| `constants/tokens.ts` | 颜色、间距、圆角、字号、时长 |
| `constants/typography.ts` | 字体样式对象 |
| `constants/shadows.ts` | 阴影（iOS / Android 适配） |

---

> 文档版本：v2.0 · 2026-03（React Native 版）
> 设计：AI小助理设计团队
> 对应视觉稿：design-system-v4.html
