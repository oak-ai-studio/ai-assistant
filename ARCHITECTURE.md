# ARCHITECTURE.md

AI 小助理的架构地图。

---

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                      React Native App                       │
│                    (Expo SDK 52+)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Onboarding  │  │     Home     │  │     Chat     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Memory    │  │   Settings   │  │    Skills    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ tRPC
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        tRPC API                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │     User     │  │   Assistant  │  │     Chat     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Memory    │  │    Skills    │  │     Push     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Prisma ORM
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      PostgreSQL                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    users     │  │  assistants  │  │   messages   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   memories   │  │    skills    │  │     todos    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 技术栈

### 移动端
- **框架**：React Native + Expo SDK 52+
- **路由**：Expo Router v4（文件系统路由）
- **样式**：NativeWind v4（Tailwind for RN）
- **动效**：Moti + React Native Reanimated
- **状态管理**：React Query（服务端状态）+ Zustand（客户端状态）
- **图标**：@expo/vector-icons
- **通知**：expo-notifications

### 后端
- **API**：tRPC（类型安全的 RPC）
- **ORM**：Prisma
- **数据库**：PostgreSQL
- **部署**：Docker

### 开发工具
- **Monorepo**：TurboRepo
- **包管理**：npm workspaces
- **代码质量**：ESLint + Prettier + TypeScript strict mode
- **测试**：Vitest（单元测试）+ Detox（E2E 测试）

---

## 数据模型

### 核心实体

```prisma
model User {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  
  assistants Assistant[]
  memories   Memory[]
}

model Assistant {
  id              String   @id @default(cuid())
  userId          String
  name            String   @default("小助")
  avatar          String   @default("default")
  systemPrompt    String?
  pushTimeStart   String?  // "09:00"
  pushTimeEnd     String?  // "22:00"
  
  user            User     @relation(fields: [userId], references: [id])
  skills          Skill[]
  messages        Message[]
}

model Skill {
  id              String   @id @default(cuid())
  assistantId     String
  name            String
  icon            String
  systemPrompt    String
  isActive        Boolean  @default(true)
  order           Int      @default(0)
  
  assistant       Assistant @relation(fields: [assistantId], references: [id])
  memories        Memory[]
  todos           Todo[]
}

model Memory {
  id              String   @id @default(cuid())
  userId          String
  skillId         String?
  content         String
  type            String   // preference | habit | fact | weakness | progress | personality
  confidence      Float    @default(0.8)
  isUserEdited    Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            User     @relation(fields: [userId], references: [id])
  skill           Skill?   @relation(fields: [skillId], references: [id])
}

model Message {
  id              String   @id @default(cuid())
  assistantId     String
  role            String   // user | assistant
  content         String
  memoryBased     Boolean  @default(false)
  createdAt       DateTime @default(now())
  
  assistant       Assistant @relation(fields: [assistantId], references: [id])
}

model Todo {
  id              String   @id @default(cuid())
  skillId         String
  content         String
  priority        String   @default("medium") // high | medium
  isCompleted     Boolean  @default(false)
  createdAt       DateTime @default(now())
  
  skill           Skill    @relation(fields: [skillId], references: [id])
}
```

---

## 模块划分

### 模块一：Onboarding
- **路径**：`apps/mobile/app/(onboarding)/`
- **功能**：欢迎页、起名字、选择技能、技能初始配置
- **依赖**：User API、Assistant API、Skill API

### 模块二：首页看板
- **路径**：`apps/mobile/app/(tabs)/index.tsx`
- **功能**：问候区、今日待办、技能看板、FAB
- **依赖**：Assistant API、Skill API、Todo API

### 模块三：对话系统
- **路径**：`apps/mobile/components/ChatDrawer.tsx`
- **功能**：半屏对话框、消息列表、输入框、上下文注入
- **依赖**：Chat API、Memory API

### 模块四：记忆系统
- **路径**：`apps/mobile/app/(tabs)/memory.tsx`
- **功能**：记忆列表、编辑、删除、手动添加
- **依赖**：Memory API

### 模块五：通知系统
- **路径**：`packages/api/src/routers/push.ts`
- **功能**：推送通知、智能抑制、内容生成
- **依赖**：expo-notifications、Firebase Cloud Messaging

---

## 关键设计决策

### 1. 为什么用 tRPC？
- 类型安全：前后端共享类型，避免 API 不一致
- 开发体验：自动补全、重构友好
- 性能：比 REST 更轻量，比 GraphQL 更简单

### 2. 为什么用 NativeWind？
- 开发效率：Tailwind 类名，Web 开发者熟悉
- 设计系统：通过 `tailwind.config.js` 统一管理 Design Tokens
- 性能：编译时生成样式，运行时无额外开销

### 3. 为什么用 Moti？
- 声明式动效：比 Animated API 更简洁
- 性能：基于 Reanimated，硬件加速
- 交错动画：列表进入动画更流畅

### 4. 为什么用 Expo？
- 开发体验：热更新、真机预览、OTA 更新
- 生态：丰富的原生模块（通知、存储、图片）
- 部署：EAS Build 简化打包流程

---

## 部署架构

### 开发环境
```
开发机 → Expo Dev Server → 手机 Expo Go
```

### 生产环境
```
用户手机 → EAS Build (iOS/Android) → tRPC API (Docker) → PostgreSQL (Docker)
```

---

## 性能优化策略

1. **列表渲染**：使用 FlatList，避免 ScrollView + map
2. **动画优化**：只动画 transform 和 opacity，避免 layout 属性
3. **图片优化**：使用 expo-image，支持缓存和占位符
4. **代码分割**：Expo Router 自动按页面分割
5. **记忆检索**：语义相似度 + 时间加权，避免全量注入

---

## 安全考虑

1. **API 鉴权**：tRPC 中间件验证 JWT
2. **数据加密**：敏感数据（System Prompt）使用 expo-secure-store
3. **输入验证**：Zod schema 验证所有 API 输入
4. **SQL 注入**：Prisma 自动防护
5. **XSS 防护**：React Native 默认转义文本

---

## 监控与日志

1. **错误追踪**：Sentry（生产环境）
2. **性能监控**：Expo Analytics
3. **日志**：Winston（后端）+ console（开发环境）
4. **用户行为**：Mixpanel（可选）

---

## 扩展性设计

### 技能插件系统
- 每个技能是独立的模块
- 通过 `systemPrompt` 注入技能特定行为
- 技能可以向首页写入待办
- 技能可以有自己的看板页面

### 记忆系统
- 支持多种记忆类型（preference、habit、fact 等）
- 支持置信度评分
- 支持用户手动编辑
- 支持语义检索

### 通知系统
- 支持智能抑制（当日已对话则不推送）
- 支持个性化内容生成
- 支持时间窗口配置

---

## 参考文档

- **PRD**：`docs/product-specs/prd.md`
- **设计系统**：`docs/design-docs/design-system.md`
- **前端规范**：`docs/FRONTEND.md`
- **后端规范**：`docs/BACKEND.md`
