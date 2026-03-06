# 设计文档索引

---

## 核心文档

- **设计系统**：`design-system.md` - 完整的设计系统规范
- **开发决策**：`decisions.md` - 技术栈和架构决策
- **线稿**：`wireframes/` - UI 设计参考

---

## 设计系统快速参考

### 颜色
- **主色**：`#E8571A`（橙色）
- **中性色**：`#E8E4DC`（沙色）
- **背景**：`#FAFAF8`（米白）
- **文字**：`#1A1814`（墨色）

### 字体
- **标题**：Syne（700 Bold / 800 ExtraBold）
- **正文**：DM Sans（400 Regular / 500 Medium）
- **标签**：DM Mono（400 Regular）

### 圆角
- 4px / 8px / 14px / 20px / 28px / 999px

### 间距
- 8pt Grid：2px / 4px / 8px / 12px / 16px / 20px / 24px / 32px / 40px / 48px / 64px

---

## 线稿文件

```
wireframes/
├── 01-onboarding-flow.png       # Onboarding 完整流程
├── 02-home-dashboard.png        # 首页（包含多个状态）
├── 03-chat-system.png           # 对话系统 + 技能详情页
├── 04-skill-detail-and-assistant-config.png  # 配置助理 + 新增技能
└── 05-memory-system.png         # 记忆系统完整流程
```

---

## 组件清单

### 基础组件
- `Button` - 按钮（primary / secondary / ghost / danger）
- `Input` - 输入框（带 Label）
- `Badge` - 标签（orange / ink / ghost / success）

### 业务组件
- `SkillCard` - 技能卡片
- `MemoryCard` - 记忆卡片
- `ChatBubble` - 对话气泡
- `ThinkingDots` - 思考中动画
- `BottomNav` - 底部导航
- `ChatDrawer` - 对话抽屉

---

## 设计约束（严格遵守）

- ❌ 禁止使用紫色/蓝色渐变
- ❌ 禁止使用 Inter 字体
- ❌ 禁止使用 Lucide 图标
- ❌ 禁止使用自定义圆角值
- ❌ 禁止使用自定义阴影值

---

## 参考文档

- **完整设计系统**：`design-system.md`
- **前端规范**：`../FRONTEND.md`
