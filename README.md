# SoulQuad 灵魂象限

一款基于 MBTI 性格测试的智能择偶匹配系统，帮助用户找到灵魂契合的伴侣。

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-19.2.6-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0.3-3178c6)
![License](https://img.shields.io/badge/license-MIT-green)

## 最近更新 (v1.0.1)

- **动态广场** - 支持发布图文、点赞、评论，可跳转查看作者主页
- **头像系统** - 升级为 DiceBear 动漫头像，支持自定义上传
- **喜欢列表** - 我的喜欢支持点击查看心动嘉宾资料
- **排行榜** - 显示用户真实动漫头像，按等级分类
- **发现页** - 全屏头像展示，卡片式浏览体验

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

### 💬 即时通讯
- 实时聊天功能（Socket.IO）
- 匹配通知系统
- 未读消息角标

### 📝 动态广场
- 发布图文动态
- 点赞、评论、分享
- 定位功能
- 草稿自动保存

### 🏆 排行榜
- 热门榜 / 新人榜 / 精英榜
- 传奇 / 顶尖 / 优秀 / 普通等级体系

## 技术栈

### 前端
- **React 19** + TypeScript
- **Vite** 构建工具
- **React Router** 路由管理
- **Socket.IO Client** 即时通讯
- **CSS Variables** 主题系统（支持深色/浅色模式）

### 后端
- **Express** Node.js 框架
- **Socket.IO** 实时通信
- **SQL.js** 浏览器端 SQLite 数据库
- **REST API** 用户、匹配、消息、动态、通知完整接口

### 设计
- 移动端优先
- 玻璃态设计（Glassmorphism）
- 渐变色主题
- 响应式布局（适配 iPhone 16 Pro Max）
- **DiceBear** 动漫头像生成

## 项目结构

```
soulquad-web/
├── src/
│   ├── components/     # 可复用组件
│   │   ├── AvatarUpload.tsx
│   │   ├── BottomTabBar.tsx
│   │   ├── NotificationBell.tsx
│   │   └── ...
│   ├── pages/         # 页面组件
│   │   ├── Discover.tsx    # 发现/匹配
│   │   ├── Messages.tsx    # 消息列表
│   │   ├── Chat.tsx        # 私聊页面
│   │   ├── Moments.tsx     # 动态广场
│   │   ├── Leaderboard.tsx # 排行榜
│   │   ├── Profile.tsx     # 个人中心
│   │   ├── SoulTest.tsx   # 灵魂测试
│   │   └── ...
│   ├── services/      # API 服务
│   │   └── api.ts    # API 封装（支持 Mock 模式）
│   ├── hooks/         # 自定义 Hooks
│   │   ├── useAuth.ts
│   │   └── useTheme.ts
│   ├── data/          # 静态数据
│   │   └── mbti.ts   # MBTI 题目和象限数据
│   ├── types/         # TypeScript 类型定义
│   └── App.tsx        # 应用入口
├── server/            # 后端服务
│   ├── index.js       # Express + Socket.IO 入口
│   ├── db/
│   │   ├── database.js  # SQL.js 数据库初始化
│   │   └── soulquad.db  # SQLite 数据库文件
│   └── routes/        # API 路由
│       ├── auth.js        # 登录/注册
│       ├── users.js       # 用户资料
│       ├── matches.js     # 匹配系统
│       ├── messages.js    # 私信
│       ├── moments.js     # 动态广场
│       ├── notifications.js  # 通知
│       ├── ai.js          # AI 灵魂描述
│       ├── soulTest.js    # MBTI 测试
│       └── cities.js      # 城市数据
├── deploy/            # 部署配置
│   ├── nginx.conf    # Nginx 配置
│   ├── generate-ssl.sh  # SSL 证书生成
│   └── .env.production.example
├── electron/          # Electron 桌面端
├── dist/              # 前端构建输出
├── package.json
├── vite.config.ts
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

## 部署指南

### 方式一：Windows 便携版（推荐）

下载 `release-electron/SoulQuad-portable-1.0.0-win-x64.zip` 解压即用，无需安装。

### 方式二：Docker 部署

```bash
docker-compose up -d
docker-compose logs -f
```

### 方式三：手动部署

1. **安装依赖并构建**
```bash
npm install
npm run build && npm run server:build
```

2. **配置 Nginx**
```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/soulquad
sudo ln -sf /etc/nginx/sites-available/soulquad /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

3. **启动后端**
```bash
npm run server:start
```

### 方式四：使用部署脚本

```bash
chmod +x deploy/deploy.sh
./deploy/deploy.sh your-server-ip your-domain.com
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
| 发现 | `/discover` | 匹配卡片流 |
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
| 🏆 传奇 | 最高等级 |
| ⭐ 顶尖 | 高等级 |
| ✨ 优秀 | 中等等级 |
| 👤 普通 | 基础等级 |

### 灵魂象限

| 象限 | 说明 |
|------|------|
| 🚀 探险家 | 勇于尝试、追求刺激 |
| 🏗️ 建造者 | 脚踏实地、务实稳重 |
| 🎨 艺术家 | 灵活敏捷、追求独特 |
| 🤓 思想家 | 理性思考、善于分析 |

## License

MIT License - 详见 [LICENSE](LICENSE) 文件
