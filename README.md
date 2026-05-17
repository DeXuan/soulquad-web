# SoulQuad 灵魂象限

一款基于 MBTI 性格测试的智能择偶匹配系统，帮助用户找到灵魂契合的伴侣。

![Version](https://img.shields.io/badge/version-1.1.0-blue)
![React](https://img.shields.io/badge/React-19.2.6-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0.3-3178c6)
![License](https://img.shields.io/badge/license-MIT-green)

## 最近更新 (v1.1.0)

- **智能匹配算法重写** - 全新推荐算法，综合考虑灵魂契合度、用户质量、新人扶持、多样性
  - MBTI 加权匹配（I/E 维度最重要，占 15 分）
  - 灵魂契合度计算：MBTI 36分 + 象限 12分 + 价值观 15分 + 兴趣 10分
  - 用户质量评分：资料完整度 20分 + 活跃度 20分 + 等级加成 10分 + 灵魂分 10分
  - 新人扶持：7天内注册 +8 分，14天 +6 分，30天 +4 分，90天 +2 分
  - 多样性调整：避免连续展示相同象限或相同 MBTI 首字母的用户
  - 最终排名：50% 灵魂契合 + 30% 用户质量 + 10% 新人扶持 + 10% 多样性

## 功能特点

### 🧪 灵魂测试
- MBTI 性格测试（4道题）
- 核心价值观选择（选5个）
- 兴趣爱好选择（选5个）
- 选填基本信息（学历、收入、房产、车辆）

### 💕 智能匹配
- 基于 MBTI 类型和灵魂象限计算契合度
- 三种模式：相亲 / 交友 / 搭子
- 支持城市筛选和条件过滤
- 用户等级可见性：传奇可见所有，普通只能看到普通

### 💬 即时通讯
- 实时聊天功能（Socket.IO）
- 支持文字和图片消息
- 匹配通知系统
- 未读消息角标

### 📝 动态广场
- 发布图文动态
- 支持匿名发布（随机生成灵魂昵称如"灵魂A123"）
- 点赞、评论、分享
- 草稿自动保存

### 🏆 排行榜
- 热门榜 / 新人榜 / 精英榜
- 传奇 / 顶尖 / 优秀 / 普通等级体系

## 技术栈

### 前端
- **React 19** + TypeScript
- **Vite** 构建工具
- **React Router 7** 路由管理
- **Socket.IO Client** 即时通讯
- **CSS Variables** 主题系统（支持深色/浅色模式）

### 后端
- **Express** Node.js 框架
- **Socket.IO** 实时通信
- **PostgreSQL** 数据库（生产环境）
- **SQL.js** 开发环境 SQLite
- **REST API** 用户、匹配、消息、动态、通知完整接口

### 设计
- 移动端优先
- 玻璃态设计（Glassmorphism）
- 渐变色主题
- 响应式布局
- **DiceBear** 可爱卡通头像（micah 风格，800px 高清）

## 项目结构

```
soulquad-web/
├── src/
│   ├── components/     # 可复用组件
│   │   ├── AvatarUpload.tsx
│   │   ├── BottomTabBar.tsx
│   │   ├── NotificationBell.tsx
│   │   ├── Navbar.tsx
│   │   └── ...
│   ├── pages/         # 页面组件
│   │   ├── Home.tsx          # 首页
│   │   ├── Login.tsx         # 登录
│   │   ├── Register.tsx      # 注册
│   │   ├── SoulTest.tsx      # 灵魂测试
│   │   ├── Discover.tsx      # 发现/匹配
│   │   ├── Messages.tsx      # 消息列表
│   │   ├── Chat.tsx          # 私聊页面
│   │   ├── Moments.tsx      # 动态广场
│   │   ├── Leaderboard.tsx   # 排行榜
│   │   ├── Profile.tsx       # 个人中心
│   │   ├── Dashboard.tsx     # 仪表盘
│   │   └── Settings.tsx      # 设置
│   ├── services/      # API 服务
│   │   └── api.ts    # API 封装（支持 Mock 模式）
│   ├── hooks/         # 自定义 Hooks
│   │   ├── useAuth.ts
│   │   └── useTheme.ts
│   ├── data/          # 静态数据
│   │   └── mbti.ts   # MBTI 题目和象限数据
│   ├── types/         # TypeScript 类型定义
│   │   └── index.ts
│   ├── App.tsx        # 应用入口
│   └── index.css      # 全局样式
├── server/            # 后端服务
│   ├── index.js       # Express + Socket.IO 入口
│   ├── db/
│   │   ├── database.js  # 数据库初始化
│   │   ├── migrate.sql   # 数据库迁移
│   │   └── soulquad.db   # SQLite 数据库文件
│   └── routes/        # API 路由
│       ├── auth.js        # 登录/注册
│       ├── users.js       # 用户资料
│       ├── matches.js     # 匹配系统（智能推荐算法）
│       ├── messages.js    # 私信
│       ├── moments.js     # 动态广场
│       ├── notifications.js # 通知
│       ├── ai.js          # AI 灵魂描述
│       ├── soulTest.js    # MBTI 测试
│       └── cities.js      # 城市数据
├── deploy/            # 部署配置
│   ├── nginx.conf     # Nginx 配置
│   ├── generate-ssl.sh  # SSL 证书生成
│   ├── deploy-to-server.sh
│   ├── deploy-update.sh
│   └── create-deploy-package.sh
├── electron/           # Electron 桌面端
│   ├── main.js
│   └── preload.js
├── dist/              # 前端构建输出
├── dist-server/       # 后端构建输出
├── release/           # 发布包
├── release-electron/  # Electron 发布包
├── package.json
├── vite.config.ts
├── tsconfig.json
├── CLAUDE.md          # 项目行为规范
└── README.md
```

## 快速开始

### 环境要求
- Node.js 18+
- npm 9+

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
# 启动前端 (http://localhost:5173)
npm run dev

# 启动后端 API (http://localhost:3001)
npm run server
```

### 构建生产版本

```bash
npm run build && npm run server:build
```

### 预览生产版本

```bash
npm run preview
```

## 匹配算法详解

### 灵魂契合度计算 (0-100分)

| 维度 | 最高分 | 说明 |
|------|--------|------|
| MBTI 匹配 | 36分 | I/E(15分)、S/N(8分)、T/F(8分)、J/P(5分) |
| 象限匹配 | 12分 | 相同灵魂象限 |
| 价值观匹配 | 15分 | 每个共同价值观 +2.5 分 |
| 兴趣匹配 | 10分 | 每个共同兴趣 +1.5 分 |

### 用户质量评分 (0-50分)

| 维度 | 最高分 | 说明 |
|------|--------|------|
| 资料完整度 | 20分 | 10 个字段完整度占比 |
| 活跃度 | 20分 | 最近 1 小时 +20，24小时 +15，72小时 +10 |
| 等级加成 | 10分 | 传奇 10，顶尖 8，优秀 5，普通 2 |
| 灵魂分贡献 | 10分 | soul_score / 20 |

### 新人扶持

| 注册时间 | 加分 |
|----------|------|
| 7 天内 | +8 |
| 14 天内 | +6 |
| 30 天内 | +4 |
| 90 天内 | +2 |

### 最终排名权重

- 50% 灵魂契合度
- 30% 用户质量
- 10% 新人扶持
- 10% 多样性调整（避免连续展示相同象限/MBTI 用户）

## 部署指南

### 方式一：Windows 便携版（推荐）

下载 `release-electron/SoulQuad-portable-1.0.0-win-x64.zip` 解压即用，无需安装。

### 方式二：使用部署脚本

```bash
# 全新部署
chmod +x deploy/deploy-to-server.sh
./deploy/deploy-to-server.sh your-server-ip your-domain.com

# 更新部署
chmod +x deploy/deploy-update.sh
./deploy/deploy-update.sh your-server-ip

# 创建部署包
chmod +x deploy/create-deploy-package.sh
./deploy/create-deploy-package.sh
```

### 方式三：手动部署

1. **安装依赖并构建**
```bash
npm install
npm run build
```

2. **配置 Nginx**
```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/soulquad
sudo ln -sf /etc/nginx/sites-available/soulquad /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

3. **启动后端**
```bash
node dist-server/index.js
```

## 配置说明

### API 配置

在 `src/services/api.ts` 中：

```typescript
const API_BASE = 'http://localhost:3001/api';  // API 地址
const MOCK_MODE = false;                        // 默认连接真实后端
```

设置为 `true` 时使用本地 Mock 数据（无需启动后端）。

### 主题配置

支持深色/浅色主题，通过 `useTheme` Hook 切换：

```typescript
const { theme, toggleTheme } = useTheme();
```

CSS 变量定义在 `src/index.css` 中。

## 主要页面

| 页面 | 路由 | 说明 |
|------|------|------|
| 首页 | `/` | 引导页 |
| 登录 | `/login` | 用户登录 |
| 注册 | `/register` | 用户注册 |
| 灵魂测试 | `/soul-test` | MBTI 测试 |
| 发现 | `/discover` | 匹配卡片流（智能推荐） |
| 消息 | `/messages` | 聊天列表 |
| 聊天 | `/chat/:matchId` | 私聊页面 |
| 动态 | `/moments` | 社交动态 |
| 排行榜 | `/leaderboard` | 用户排行 |
| 我的 | `/profile` | 个人中心 |
| 设置 | `/settings` | 设置页面 |

## 数据模型

### 用户等级

| 等级 | 说明 |
|------|------|
| 🏆 传奇 | 最高等级，灵魂分数≥95，匹配数≥50 |
| ⭐ 顶尖 | 高等级，灵魂分数≥85，匹配数≥30 |
| ✨ 优秀 | 中等等级，灵魂分数≥70，匹配数≥10 |
| 👤 普通 | 基础等级 |

### 灵魂象限

| 象限 | 说明 |
|------|------|
| 🚀 探险家 (Explorer) | 勇于尝试、追求刺激 |
| 🏗️ 建造者 (Builder) | 脚踏实地、务实稳重 |
| 🎨 艺术家 (Artist) | 灵活敏捷、追求独特 |
| 🤓 思想家 (Philosopher) | 理性思考、善于分析 |

## 数据库

### 表结构

- **users** - 用户信息（包含 height, education, occupation, annual_income 等扩展字段）
- **matches** - 匹配关系记录
- **messages** - 即时消息
- **notifications** - 通知系统
- **moments** - 动态广场（含 is_anonymous, anonymous_name 字段）
- **user_blocklist** - 用户黑名单

### 头像方案

使用 DiceBear micah 可爱卡通风格头像：
```
https://api.dicebear.com/7.x/micah/png?seed={username}&size=800&backgroundColor=ddeaf7,fde7d7,ffecd2,e8d5f5,d4e4f0
```

## 安全特性

- JWT Token 认证（TOKEN_SECRET 环境变量）
- Per-user 密码 Salt 加密
- CORS 白名单机制
- authMiddleware 保护所有需要认证的 API
- 禁止 x-user-id 伪造用户身份

## 测试账号

| 用户名 | 密码 | 说明 |
|--------|------|------|
| alice | demo123 | 传奇用户，女 |
| bob | demo123 | 顶尖用户，男 |
| 其他 115 个用户 | demo123 | 完整用户资料 |

## License

MIT License - 详见 [LICENSE](LICENSE) 文件