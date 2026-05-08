# SoulQuad 灵魂象限

一款基于 MBTI 性格测试的智能择偶匹配系统，帮助用户找到灵魂契合的伴侣。

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-19.2.6-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0.3-3178c6)
![License](https://img.shields.io/badge/license-MIT-green)

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

### 设计
- 移动端优先
- 玻璃态设计（Glassmorphism）
- 渐变色主题
- 响应式布局（适配 iPhone 16 Pro Max）

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
│   │   ├── Messages.tsx    # 消息
│   │   ├── Chat.tsx        # 聊天
│   │   ├── Moments.tsx     # 动态
│   │   ├── Leaderboard.tsx # 排行榜
│   │   ├── Profile.tsx     # 个人资料
│   │   ├── SoulTest.tsx    # 灵魂测试
│   │   └── ...
│   ├── services/      # API 服务
│   │   └── api.ts     # API 封装和 Mock 数据
│   ├── hooks/         # 自定义 Hooks
│   │   ├── useAuth.ts
│   │   └── useTheme.ts
│   ├── data/          # 静态数据
│   │   └── mbti.ts    # MBTI 数据
│   ├── types/         # TypeScript 类型定义
│   └── App.tsx        # 应用入口
├── server/            # 后端服务
│   └── index.js       # Express + Socket.IO
├── deploy/            # 部署配置
│   ├── nginx.conf     # Nginx 配置
│   ├── deploy.sh      # 部署脚本
│   └── .env.production.example
├── Dockerfile
├── docker-compose.yml
├── docker-compose.prod.yml
├── index.html
├── package.json
└── vite.config.ts
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
# 启动前端开发服务器 (默认 http://localhost:5173)
npm run dev

# 或同时启动后端服务器
npm run server
```

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 部署指南

### 方式一：Docker 部署（推荐）

```bash
# 构建并启动
docker-compose -f docker-compose.prod.yml up -d

# 查看状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

### 方式二：手动部署

1. **上传项目到服务器**
```bash
scp -r ./soulquad-web root@your-server:/var/www/
```

2. **安装依赖并构建**
```bash
cd /var/www/soulquad-web
npm install
npm run build
```

3. **配置 Nginx**
```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/soulquad
sudo ln -sf /etc/nginx/sites-available/soulquad /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

4. **使用 PM2 启动后端**
```bash
npm install -g pm2
pm2 start server/index.js --name soulquad
pm2 save && pm2 startup
```

### 方式三：使用部署脚本

```bash
chmod +x deploy/deploy.sh
./deploy/deploy.sh your-server-ip your-domain.com
```

### 生产环境变量

复制 `deploy/.env.production.example` 为 `.env` 并修改：
```bash
cp deploy/.env.production.example .env
nano .env  # 修改配置
```

## 配置说明

### API 配置

在 `src/services/api.ts` 中：

```typescript
const API_BASE = '/api';        // API 地址
const MOCK_MODE = true;        // 是否使用 Mock 模式
```

设置为 `false` 时连接真实后端服务器。

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
