# AI 小助理 · Project Init

基础架构已初始化：TurboRepo + Expo React Native + NativeWind v4 + tRPC + Prisma + PostgreSQL。

## 环境要求

- Node.js 20+
- npm 10+
- Docker / Docker Compose

## 快速启动

```bash
# 1) 安装依赖（Monorepo）
npm install

# 2) 启动 PostgreSQL
docker-compose up -d

# 3) 生成 Prisma Client（可选）
npm run db:generate

# 4) 执行数据库迁移
npm run db:migrate

# 5) 启动 Expo
cd apps/mobile
npx expo start
```

## 常用命令

```bash
# 全仓构建（TypeScript）
npm run build

# 全仓 Lint
npm run lint

# Prisma Studio
npm run db:studio
```

## 目录

```txt
apps/mobile        Expo + Expo Router + NativeWind v4
packages/api       tRPC 基础路由与 Context
packages/db        Prisma Schema + Prisma Client
packages/shared    共享类型
docker/            PostgreSQL Docker Compose
```
