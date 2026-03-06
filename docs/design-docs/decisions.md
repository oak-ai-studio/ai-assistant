# 小助理 APP · 开发决策记录

> 更新时间：2026-03-03 23:24

---

## 已确认决策

1. ✅ **项目名称**：`ai-assistant`
2. ✅ **后端技术栈**：tRPC + Prisma
3. ✅ **数据库**：PostgreSQL (Docker 部署)
4. ✅ **开发方法**：Elvis Agent Swarm 架构（Worktree + tmux + ACP）
5. ✅ **设计系统约束**：使用 ui-ux-pro-max 技能，避免 AI 默认样式
6. ✅ **线稿管理**：按页面拆分（7-8 张图），每个模块对应一张
7. ✅ **预览方式**：Expo Go 实时预览 + PR 截图（不用 Claude Code to Figma）

---

## 设计系统约束（必须遵守）

在所有 prompt 中注入以下约束：

```txt
## 设计系统约束（严格遵守）
- 颜色：使用 constants/tokens.ts 中的颜色，禁止使用紫色/蓝色渐变
- 字体：Syne（标题）+ DM Sans（正文）+ DM Mono（标签），禁止使用 Inter
- 图标：@expo/vector-icons，禁止使用 Lucide
- 圆角：4px/8px/14px/20px/28px，禁止使用其他值
- 主色：#E8571A（橙色），不是紫色或蓝色
- 阴影：使用 constants/shadows.ts 中的预设，不要自定义
```

**为什么需要这些约束？**

AI coding agents（Codex/Claude Code）有默认偏好：
- 紫色/蓝色渐变
- Inter 字体
- Lucide 图标
- 随意的圆角值

使用 ui-ux-pro-max 技能可以在 prompt 中注入设计系统约束，确保生成的代码符合我们的设计规范。

---

## 线稿文件结构（待 Boss 拆分）

```
项目/小助理（APP）/线稿/
├── 01-onboarding-welcome.png       # 欢迎页
├── 02-onboarding-name.png          # 给助理起名字
├── 03-onboarding-choose-skill.png  # 选择第一个技能
├── 04-home-dashboard.png           # 首页看板
├── 05-chat-ui.png                  # 对话界面
├── 06-memory-list.png              # 记忆列表
├── 07-memory-edit.png              # 记忆编辑
└── 08-settings.png                 # 设置页（可选）
```

**为什么要拆分？**

1. **减少 token 消耗**：每个 agent 只看自己负责的页面
2. **任务边界清晰**：一个 worktree 对应一个功能，对应一张线稿
3. **减少认知负担**：agent 不需要理解整个 app 的所有页面

**如何在 prompt 中引用？**

```txt
## 设计参考
线稿：/Users/zangjiaao/Documents/Obsidian Vault/项目/小助理（APP）/线稿/04-home-dashboard.png
```

---

## 预览工作流

### 开发阶段：Expo Go 实时预览

```bash
# 1. 启动 Expo 开发服务器
cd ~/Codebase/ai-assistant/apps/mobile
npx expo start

# 2. 手机安装 Expo Go app（App Store / Google Play）

# 3. 扫码连接开发服务器

# 4. Agent 提交代码后，Expo 自动刷新
```

**好处：**
- 真实设备预览（iPhone/Android）
- 实时热更新
- 看到的就是最终效果

### Review 阶段：PR 截图

```bash
# 1. Agent 完成后，用 iOS Simulator 截图
npx expo start --ios

# 2. 截图附在 PR description

# 3. Boss 在 GitHub 上快速 review
```

**Definition of Done 要求：**
- 有 UI 变更的 PR 必须附截图
- 否则 CI 失败

### 为什么不用 Claude Code to Figma？

1. **技术栈不匹配**：
   - Claude Code to Figma 生成 HTML/CSS
   - 我们的项目是 React Native（`<View>` `<Text>`）
   - 需要手动转换，增加工作量

2. **预览不准确**：
   - Figma 输出的是桌面端 HTML
   - 手机端效果需要在真机上看

3. **工作流割裂**：
   - Claude Code to Figma → 生成 HTML → 转换成 RN
   - 不如直接在 Expo Go 上看效果

---

## Agent 选择策略

| 任务类型 | 推荐 Agent | 原因 |
|---------|-----------|------|
| 后端逻辑、复杂 bug、多文件重构 | **Codex** (gpt-5.3-codex) | 推理能力强，适合复杂逻辑（90% 任务） |
| 前端 UI、快速迭代、git 操作 | **Claude Code** (claude-opus-4.5) | 速度快，前端经验丰富 |
| UI 设计、视觉规范 | **Gemini** | 设计感知力强，生成 HTML/CSS spec |

---

## 待办事项

- [ ] Boss 拆分线稿（7-8 张图）
- [ ] 初始化项目（TurboRepo + Expo + Docker PostgreSQL）
- [ ] 创建 AGENTS.md（coding agent 入职手册）
- [ ] 创建 `.clawdbot/` 目录（任务注册表 + 监控脚本）
- [ ] 配置 cron job（每 10 分钟监控任务状态）
- [ ] 创建第一个 worktree（feat-onboarding）
- [ ] 启动第一个 agent（Codex）

---

## 参考文档

- PRD：`AI助理MVP_PRD.md`
- 设计系统：`色彩系统/DESIGN_SYSTEM.md`
- 开发计划：`开发计划.md`
- Elvis 文章：https://x.com/elvissun/status/2025920521871716562
