# BACKEND.md

tRPC + Prisma 后端开发规范。

---

## 技术栈

- **API**：tRPC（类型安全的 RPC）
- **ORM**：Prisma
- **数据库**：PostgreSQL
- **验证**：Zod
- **部署**：Docker

---

## 目录结构

```
packages/
├── api/                          # tRPC API
│   ├── src/
│   │   ├── routers/              # API 路由
│   │   │   ├── user.ts
│   │   │   ├── assistant.ts
│   │   │   ├── chat.ts
│   │   │   ├── memory.ts
│   │   │   ├── skill.ts
│   │   │   └── push.ts
│   │   ├── context.ts            # tRPC Context
│   │   ├── trpc.ts               # tRPC 初始化
│   │   └── index.ts              # 导出 AppRouter
│   └── package.json
├── db/                           # Prisma Schema
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── package.json
└── shared/                       # 共享类型
    ├── src/
    │   └── types.ts
    └── package.json
```

---

## Prisma Schema

### 核心实体

```prisma
// packages/db/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

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
  createdAt       DateTime @default(now())
  
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
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
  createdAt       DateTime @default(now())
  
  assistant       Assistant @relation(fields: [assistantId], references: [id], onDelete: Cascade)
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
  
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  skill           Skill?   @relation(fields: [skillId], references: [id], onDelete: SetNull)
  
  @@index([userId, createdAt])
  @@index([skillId])
}

model Message {
  id              String   @id @default(cuid())
  assistantId     String
  role            String   // user | assistant
  content         String
  memoryBased     Boolean  @default(false)
  createdAt       DateTime @default(now())
  
  assistant       Assistant @relation(fields: [assistantId], references: [id], onDelete: Cascade)
  
  @@index([assistantId, createdAt])
}

model Todo {
  id              String   @id @default(cuid())
  skillId         String
  content         String
  priority        String   @default("medium") // high | medium
  isCompleted     Boolean  @default(false)
  createdAt       DateTime @default(now())
  
  skill           Skill    @relation(fields: [skillId], references: [id], onDelete: Cascade)
  
  @@index([skillId, isCompleted])
}
```

### 迁移命令

```bash
# 创建迁移
cd packages/db
npx prisma migrate dev --name init

# 生成 Prisma Client
npx prisma generate

# 重置数据库（开发环境）
npx prisma migrate reset
```

---

## tRPC API

### 初始化

```ts
// packages/api/src/trpc.ts
import { initTRPC } from '@trpc/server'
import { Context } from './context'

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure
```

### Context

```ts
// packages/api/src/context.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const createContext = () => {
  return { prisma }
}

export type Context = Awaited<ReturnType<typeof createContext>>
```

### Router 示例

```ts
// packages/api/src/routers/memory.ts
import { z } from 'zod'
import { router, publicProcedure } from '../trpc'

export const memoryRouter = router({
  list: publicProcedure
    .input(z.object({
      userId: z.string(),
      skillId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.memory.findMany({
        where: {
          userId: input.userId,
          skillId: input.skillId,
        },
        orderBy: { createdAt: 'desc' },
      })
    }),

  create: publicProcedure
    .input(z.object({
      userId: z.string(),
      skillId: z.string().optional(),
      content: z.string().min(1).max(200),
      type: z.enum(['preference', 'habit', 'fact', 'weakness', 'progress', 'personality']),
      confidence: z.number().min(0).max(1).default(0.8),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.memory.create({
        data: input,
      })
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      content: z.string().min(1).max(200),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.memory.update({
        where: { id: input.id },
        data: {
          content: input.content,
          isUserEdited: true,
        },
      })
    }),

  delete: publicProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.memory.delete({
        where: { id: input.id },
      })
    }),
})
```

### 合并 Router

```ts
// packages/api/src/index.ts
import { router } from './trpc'
import { userRouter } from './routers/user'
import { assistantRouter } from './routers/assistant'
import { chatRouter } from './routers/chat'
import { memoryRouter } from './routers/memory'
import { skillRouter } from './routers/skill'
import { pushRouter } from './routers/push'

export const appRouter = router({
  user: userRouter,
  assistant: assistantRouter,
  chat: chatRouter,
  memory: memoryRouter,
  skill: skillRouter,
  push: pushRouter,
})

export type AppRouter = typeof appRouter
```

---

## 验证规范

### 使用 Zod Schema

```ts
import { z } from 'zod'

// 定义 Schema
const createMemorySchema = z.object({
  userId: z.string().cuid(),
  content: z.string().min(1, '内容不能为空').max(200, '内容不能超过 200 字'),
  type: z.enum(['preference', 'habit', 'fact', 'weakness', 'progress', 'personality']),
  confidence: z.number().min(0).max(1).default(0.8),
})

// 使用 Schema
.input(createMemorySchema)
```

### 常用验证规则

```ts
// 字符串
z.string().min(1).max(100)
z.string().email()
z.string().url()
z.string().cuid()

// 数字
z.number().int().positive()
z.number().min(0).max(1)

// 枚举
z.enum(['option1', 'option2'])

// 可选
z.string().optional()
z.string().nullable()

// 默认值
z.string().default('default')

// 数组
z.array(z.string())

// 对象
z.object({
  name: z.string(),
  age: z.number(),
})
```

---

## 错误处理

### 抛出错误

```ts
import { TRPCError } from '@trpc/server'

.mutation(async ({ ctx, input }) => {
  const memory = await ctx.prisma.memory.findUnique({
    where: { id: input.id },
  })

  if (!memory) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: '记忆不存在',
    })
  }

  return memory
})
```

### 错误码

| 错误码 | 说明 |
|--------|------|
| `BAD_REQUEST` | 请求参数错误 |
| `UNAUTHORIZED` | 未授权 |
| `FORBIDDEN` | 无权限 |
| `NOT_FOUND` | 资源不存在 |
| `CONFLICT` | 资源冲突 |
| `INTERNAL_SERVER_ERROR` | 服务器错误 |

---

## 记忆提取逻辑

### 对话结束后的记忆提取

```ts
// packages/api/src/routers/chat.ts

async function extractMemories(messages: Message[], userId: string, skillId: string) {
  // 1. 构建记忆提取 Prompt
  const prompt = `
你是一个记忆提取助手。请从以下对话中提取有长期价值的记忆。

对话内容：
${messages.map(m => `${m.role}: ${m.content}`).join('\n')}

要求：
- 只提取有长期价值的偏好、习惯、事实，不记录流水账
- 每条记忆用一句自然语言描述，不超过 30 字
- 标注置信度（0.0~1.0），低于 0.6 的不返回
- 返回 JSON 数组格式

返回格式：
[
  {
    "type": "preference",
    "content": "喜欢通过例句学单词",
    "confidence": 0.9
  }
]
`

  // 2. 调用 LLM
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
  })

  const memories = JSON.parse(response.choices[0].message.content)

  // 3. 去重和合并
  for (const memory of memories) {
    if (memory.confidence < 0.6) continue

    // 检查是否已存在相似记忆
    const existing = await ctx.prisma.memory.findFirst({
      where: {
        userId,
        skillId,
        content: { contains: memory.content.slice(0, 10) },
      },
    })

    if (existing) {
      // 更新置信度
      await ctx.prisma.memory.update({
        where: { id: existing.id },
        data: { confidence: Math.max(existing.confidence, memory.confidence) },
      })
    } else {
      // 创建新记忆
      await ctx.prisma.memory.create({
        data: {
          userId,
          skillId,
          content: memory.content,
          type: memory.type,
          confidence: memory.confidence,
        },
      })
    }
  }
}
```

---

## 推送通知逻辑

### 每日推送任务

```ts
// packages/api/src/routers/push.ts

async function generateDailyPush(userId: string) {
  // 1. 检查今日是否已对话
  const todayMessages = await ctx.prisma.message.findMany({
    where: {
      assistant: { userId },
      createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    },
  })

  if (todayMessages.length > 0) {
    // 今日已对话，不推送
    return null
  }

  // 2. 读取用户今日各技能使用情况
  const skills = await ctx.prisma.skill.findMany({
    where: { assistant: { userId }, isActive: true },
    include: { todos: { where: { isCompleted: false } } },
  })

  // 3. 读取相关记忆
  const memories = await ctx.prisma.memory.findMany({
    where: { userId },
    orderBy: { confidence: 'desc' },
    take: 5,
  })

  // 4. 调用 LLM 生成推送文案
  const prompt = `
你是一个 AI 助理。根据用户今日状态生成个性化推送文案。

用户今日状态：
${skills.map(s => `- ${s.name}：${s.todos.length} 个待办`).join('\n')}

用户记忆：
${memories.map(m => `- ${m.content}`).join('\n')}

要求：
- 文案不超过 30 字
- 自然、友好、不生硬
- 引导用户打开 App

返回格式：
{ "content": "今天还差 5 个单词就完成目标了，要不要现在搞定？" }
`

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
  })

  const { content } = JSON.parse(response.choices[0].message.content)

  // 5. 发送推送
  await sendPushNotification(userId, content)
}
```

---

## 性能优化

### 数据库索引

```prisma
model Memory {
  // ...
  @@index([userId, createdAt])
  @@index([skillId])
}

model Message {
  // ...
  @@index([assistantId, createdAt])
}
```

### 查询优化

```ts
// ✅ 使用 include 预加载关联数据
const assistant = await ctx.prisma.assistant.findUnique({
  where: { id: assistantId },
  include: {
    skills: true,
    messages: { take: 10, orderBy: { createdAt: 'desc' } },
  },
})

// ❌ 避免 N+1 查询
const assistants = await ctx.prisma.assistant.findMany()
for (const assistant of assistants) {
  const skills = await ctx.prisma.skill.findMany({ where: { assistantId: assistant.id } })
}
```

### 分页

```ts
.input(z.object({
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
}))
.query(async ({ ctx, input }) => {
  const memories = await ctx.prisma.memory.findMany({
    take: input.limit + 1,
    cursor: input.cursor ? { id: input.cursor } : undefined,
    orderBy: { createdAt: 'desc' },
  })

  let nextCursor: string | undefined = undefined
  if (memories.length > input.limit) {
    const nextItem = memories.pop()
    nextCursor = nextItem!.id
  }

  return { memories, nextCursor }
})
```

---

## 测试规范

### 单元测试

```ts
import { describe, it, expect } from 'vitest'
import { appRouter } from '../src'
import { createContext } from '../src/context'

describe('memoryRouter', () => {
  it('should create memory', async () => {
    const ctx = await createContext()
    const caller = appRouter.createCaller(ctx)

    const memory = await caller.memory.create({
      userId: 'test-user',
      content: '喜欢通过例句学单词',
      type: 'preference',
    })

    expect(memory.content).toBe('喜欢通过例句学单词')
    expect(memory.type).toBe('preference')
  })
})
```

---

## 部署

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ai_assistant
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  api:
    build: .
    ports:
      - '3000:3000'
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/ai_assistant
    depends_on:
      - postgres

volumes:
  postgres_data:
```

### 环境变量

```bash
# .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_assistant"
OPENAI_API_KEY="sk-..."
```

---

## 参考文档

- **Prisma Schema**：`packages/db/prisma/schema.prisma`
- **tRPC Routers**：`packages/api/src/routers/`
- **PRD**：`docs/product-specs/prd.md`
- **架构**：`ARCHITECTURE.md`
