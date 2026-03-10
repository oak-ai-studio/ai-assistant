# AGENTS.MD

这是 **AI 小助理** 的代码库。

---

## 快速导航

- **产品规格**：`docs/product-specs/index.md`
- **设计系统**：`docs/design-docs/design-system.md`
- **架构地图**：`ARCHITECTURE.md`
- **前端规范**：`docs/FRONTEND.md`
- **后端规范**：`docs/BACKEND.md`
- **当前任务**：`docs/exec-plans/active/`

---

## 项目概述

**产品定位**：单一 AI 助理 + 多技能插件，核心差异是持续学习用户偏好的全局记忆系统

**技术栈**：
- **移动端**：React Native + Expo SDK 52+
- **后端**：tRPC + Prisma ORM
- **数据库**：PostgreSQL (Docker)
- **样式**：NativeWind v4 (Tailwind for RN)
- **动效**：Moti + React Native Reanimated

**后端基础架构（apps/api）**：
- API：Express + tRPC（`/trpc`）
- Health：`GET /health`（数据库连通性检查）
- 核心表：`User`、`VerificationCode`、`Assistant`、`Memory`、`Conversation`、`Message`、`Skill`
- 关键环境变量：`DATABASE_URL`、`OPENAI_API_KEY`、`LLM_PROVIDER`、`JWT_SECRET`

---

## 目录结构

```
ai-assistant/
├── AGENTS.md                     # 本文件（目录）
├── ARCHITECTURE.md               # 架构地图
├── docs/                         # 文档（Agent 工作空间）
│   ├── product-specs/            # 产品规格
│   ├── design-docs/              # 设计文档 + 线稿
│   ├── exec-plans/               # 执行计划
│   │   ├── active/               # 进行中的任务
│   │   └── completed/            # 已完成的任务
│   ├── FRONTEND.md               # 前端规范
│   ├── BACKEND.md                # 后端规范
│   └── DESIGN.md                 # 设计系统快速参考
├── apps/
│   ├── api/                      # Express + tRPC 后端服务
│   │   ├── src/                  # 服务入口、路由、配置、DB 服务
│   │   └── prisma/               # Prisma Schema + Migrations
│   └── mobile/                   # React Native App
│       ├── app/                  # Expo Router 页面
│       ├── components/           # 组件
│       ├── constants/            # Design Tokens
│       └── hooks/                # 自定义 Hooks
├── packages/
│   ├── api/                      # tRPC API
│   ├── db/                       # Prisma Schema
│   └── shared/                   # 共享类型
└── docker/                       # Docker 配置
```

---

## 开发工作流

### 1. 接收任务
- 每个任务有对应的 Contract（见 `docs/exec-plans/active/`）
- Contract 包含：目标、验收标准、技术约束、参考文档

### 2. 创建 Worktree
```bash
git worktree add ../ai-assistant-feat-onboarding feat-onboarding
cd ../ai-assistant-feat-onboarding
```

### 3. 开发
- 遵循 `docs/FRONTEND.md` 和 `docs/BACKEND.md` 的规范
- 使用设计系统（`docs/design-docs/design-system.md`）
- 参考线稿（`docs/design-docs/wireframes/`）

### 4. 测试
```bash
npm run test
npm run lint
npm run build
```

### 5. 提交 PR
- PR 必须附截图（UI 变更）
- PR 描述包含：功能说明、测试范围、Contract 链接

---

## 核心原则

1. **Repository 是唯一的真相来源**
   - Agent 看不到的 = 不存在
   - 所有决策、规范、设计都在 `docs/` 里

2. **AGENTS.md 是目录，不是百科全书**
   - 保持简洁（~100 行）
   - 指向详细文档，不要在这里写长篇大论

3. **机械化验证**
   - 所有规范都有对应的 linter 或 CI 检查
   - 不依赖人工 review 发现低级错误

4. **Agent 可读性优先**
   - 文档结构化、模块化
   - 避免模糊描述，提供具体示例
5. **Schema/枚举变更同步**
   - 必须遵循 `docs/BACKEND.md` 与 `docs/FRONTEND.md` 的同步检查清单

---

## 常用命令

```bash
# 启动开发服务器
cd apps/mobile && npx expo start

# 启动后端 API
cd apps/api && npm run dev

# 运行测试
npm run test

# Lint
npm run lint

# 构建
npm run build

# 数据库迁移（后端）
cd apps/api && npx prisma migrate dev
```

## 前后端联调约定

- 移动端 API 地址统一使用 `EXPO_PUBLIC_API_URL`（见 `apps/mobile/.env*`）
- tRPC client 入口：`apps/mobile/utils/trpc.ts`
- 用户唯一标识存储在 SecureStore（key: `ai-assistant-user-id`）

---

## 认证流程（手机号验证码）

- `auth.sendCode`：生成 6 位验证码，5 分钟有效，写入 `VerificationCode`（开发期输出到 console）
- `auth.verifyCode`：校验验证码，手机号不存在则自动创建 `User`，返回 `accessToken(1h)` + `refreshToken(7d)`
- `auth.refreshToken`：用 refresh token 换新 access token
- 移动端 token 使用 `expo-secure-store` 持久化；tRPC 客户端自动携带 access token，401 时自动刷新并重试

---

## 禁止事项

- ❌ 不要自己写代码（除非是简单的一行修改）
- ❌ 不要手动运行 `npm run dev`（让 ACP agent 做）
- ❌ 不要直接编辑代码文件（通过 ACP agent）
- ❌ 不要使用紫色/蓝色渐变（设计系统是橙色 + 沙色）
- ❌ 不要使用 Inter 字体（使用 Syne + DM Sans）
- ❌ 不要使用 Lucide 图标（使用 @expo/vector-icons）

---

## 需要帮助？

- 产品问题 → 看 `docs/product-specs/`
- 设计问题 → 看 `docs/design-docs/`
- 技术问题 → 看 `docs/FRONTEND.md` 或 `docs/BACKEND.md`
- 架构问题 → 看 `ARCHITECTURE.md`
