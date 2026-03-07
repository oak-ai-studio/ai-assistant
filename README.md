# AI 小助理 · Project Init

基础架构已初始化：TurboRepo + Expo React Native + NativeWind v4 + tRPC + Prisma + PostgreSQL。

## 后端基线（apps/api）

- **服务**：Express + tRPC（`/trpc`）
- **数据库**：PostgreSQL + Prisma
- **健康检查**：`GET /health`（包含数据库连通性探测）
- **基础路由**：`system.ping`、`system.dbHealth`
- **核心数据表（6）**：`User`、`Assistant`、`Memory`、`Conversation`、`Message`、`Skill`
- **关键环境变量**：`DATABASE_URL`、`OPENAI_API_KEY`、`LLM_PROVIDER`

## 环境要求

- Node.js 20+
- npm 10+
- Docker / Docker Compose

## 快速启动

```bash
# 1) 安装依赖（Monorepo）
npm install

# 2) 配置后端环境变量
cp apps/api/.env.example apps/api/.env

# 3) 启动 PostgreSQL
docker-compose up -d

# 4) 执行数据库迁移（apps/api）
cd apps/api
npx prisma migrate dev --name init

# 5) 启动后端 API（新终端）
npm run dev

# 6) 健康检查
curl http://localhost:3000/health

# 7) 启动 Expo（新终端）
cd apps/mobile
npx expo start
```

## 常用命令

```bash
# 全仓构建（TypeScript）
npm run build

# 全仓 Lint
npm run lint

# 启动后端 API
npm run api:dev

# Prisma Studio（旧 packages/db）
npm run db:studio
```

## 目录

```txt
apps/mobile        Expo + Expo Router + NativeWind v4
apps/api           Express + tRPC + Prisma + PostgreSQL
packages/api       tRPC 基础路由与 Context
packages/db        Prisma Schema + Prisma Client
packages/shared    共享类型
docker/            PostgreSQL Docker Compose
```
