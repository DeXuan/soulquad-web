# SoulQuad 灵魂象限

一款基于 MBTI 性格测试的智能择偶匹配系统，帮助用户找到灵魂契合的伴侣。

![Version](https://img.shields.io/badge/version-1.3.0-blue)
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6)
![Node.js](https://img.shields.io/badge/Node.js-20-339933)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 项目简介

SoulQuad（灵魂象限）是一款创新的社交匹配应用，通过 MBTI 性格测试和灵魂象限理论，帮助用户找到三观契合、性格互补的灵魂伴侣。系统采用智能匹配算法，综合考虑性格匹配度、用户质量、活跃度等多维度因素，为每位用户推荐最合适的对象。

### 核心亮点

- **智能匹配算法** - 50% 灵魂契合 + 30% 用户质量 + 10% 新人扶持 + 10% 多样性
- **等级可见性体系** - 高等级用户获得更多曝光机会
- **匿名动态** - 保护隐私的同时分享真实想法
- **实时聊天** - Socket.IO 即时通讯
- **AI 灵魂描述** - Anthropic AI 生成个性化介绍

---

## 功能特点

### 1. 灵魂测试系统

基于 MBTI 理论的完整性格评估：

- **MBTI 性格测试** - 4 道核心题目确定 16 种性格类型
- **灵魂象限划分** - 探险家 / 建造者 / 艺术家 / 思想家
- **价值观选择** - 从 20+ 个价值观中选择 5 个核心价值
- **兴趣爱好** - 从 15+ 个兴趣标签中选择 5 个
- **灵魂分数计算** - 综合评估得出 0-100 的灵魂分数

### 2. 智能匹配系统

多维度智能推荐算法：

| 维度 | 权重 | 说明 |
|------|------|------|
| 灵魂契合度 | 50% | MBTI 匹配 36分 + 象限 12分 + 价值观 15分 + 兴趣 10分 |
| 用户质量 | 30% | 资料完整度 20分 + 活跃度 20分 + 等级 10分 + 灵魂分 10分 |
| 新人扶持 | 10% | 7天内 +8分，14天 +6分，30天 +4分，90天 +2分 |
| 多样性调整 | 10% | 避免连续展示相同象限/MBTI 用户 |

**匹配模式：**
- 💕 **相亲模式** - 以结婚为目的的认真交往
- 🤝 **交友模式** - 寻找志同道合的朋友
- 🎯 **搭子模式** - 一起做某件事的伙伴

**筛选条件：**
- 性别、年龄范围、城市
- 学历、MBTI 类型
- 排除已喜欢/已通过/已拉黑用户

### 3. 即时通讯系统

基于 Socket.IO 的实时聊天：

- **房间机制** - 基于匹配 UUID 加入聊天室
- **消息类型** - 支持文字、图片
- **消息限制** - 单条消息最多 5000 字符
- **未读提醒** - 消息列表显示未读数角标
- **匹配通知** - 新匹配时推送通知

### 4. 动态广场

社交内容分享平台：

- **发布动态** - 最多 2000 字文字 + 9 张图片 + 位置信息
- **匿名发布** - 随机生成灵魂昵称（如"灵魂A123"、"星辰X789"）
- **互动功能** - 点赞、评论
- **内容审核** - 防止垃圾信息

### 5. 用户等级体系

四级成长体系：

| 等级 | 图标 | 条件 | 特权 |
|------|------|------|------|
| 传奇 | 🏆 | 灵魂分≥95，匹配≥50 | 可见所有用户 |
| 顶尖 | ⭐ | 灵魂分≥85，匹配≥30 | 可见优秀及以上 |
| 优秀 | ✨ | 灵魂分≥70，匹配≥10 | 可见优秀及以上 |
| 普通 | 👤 | 基础等级 | 只能看见普通用户 |

### 6. 个人中心

完整的用户资料管理：

- **基本信息** - 头像、昵称、年龄、性别、城市
- **详细资料** - 身高、学历、职业、年收入
- **性格标签** - MBTI 类型、灵魂象限
- **个性化介绍** - 个人简介、AI 生成的灵魂描述
- **隐私设置** - 黑名单管理

### 7. 排行榜系统

多维度用户排名：

- **热门榜** - 按活跃度和匹配数排名
- **新人榜** - 新注册用户推荐
- **精英榜** - 高灵魂分用户

### 8. 通知系统

- **匹配通知** - 新匹配时推送
- **消息通知** - 未读消息提醒
- **动态通知** - 点赞、评论提醒
- **铃铛图标** - 未读数角标显示

---

## 技术架构

### 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19 | UI 框架 |
| TypeScript | 5.8 | 类型安全 |
| Vite | 6 | 构建工具 |
| React Router | 7 | 路由管理 |
| Socket.IO Client | 4 | 实时通信 |
| CSS Variables | - | 主题系统 |

**设计特点：**
- 移动端优先（Mobile First）
- 玻璃态设计（Glassmorphism）
- 渐变色主题
- 响应式布局
- 深色/浅色模式切换

### 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 20 LTS | 运行时 |
| Express | 5 | Web 框架 |
| Socket.IO | 4 | 实时通信 |
| PostgreSQL | 16 | 生产数据库 |
| Helmet | - | 安全响应头 |
| express-rate-limit | - | API 限流 |
| Anthropic SDK | - | AI 功能 |

**API 模块：**

| 模块 | 路由前缀 | 功能 |
|------|----------|------|
| auth | /api/auth | 登录、注册、Token 刷新 |
| users | /api/users | 用户资料 CRUD |
| matches | /api/matches | 匹配推荐、喜欢/通过 |
| messages | /api/messages | 聊天消息 |
| moments | /api/moments | 动态发布、点赞、评论 |
| notifications | /api/notifications | 通知列表、标记已读 |
| ai | /api/ai | AI 灵魂描述生成 |
| soulTest | /api/soul-test | MBTI 测试数据 |
| cities | /api/cities | 城市列表 |

### 数据库设计

PostgreSQL 数据库，共 8 张核心表：

```
users (用户表)
├── id, username, password_hash, password_salt
├── nickname, age, gender, avatar_url
├── mbti, soul_quadrant, soul_score, user_tier
├── height, education, occupation, annual_income, city
├── bio, ai_description
├── values_json, interests_json
└── profile_completed, is_verified, last_active

matches (匹配表)
├── id, user_a_id, user_b_id
├── soulmate_index (契合度分数)
├── user_a_liked, user_b_liked, mutual_liked
├── unlocked_level, match_status
└── created_at, matched_at

messages (消息表)
├── id, match_id, sender_id
├── content, message_type
└── created_at, read_at

moments (动态表)
├── id, user_id, content
├── images_json, video_url, location
├── like_count, comment_count
├── is_anonymous, anonymous_name
└── created_at

moment_likes (点赞表)
├── id, moment_id, user_id
└── created_at

moment_comments (评论表)
├── id, moment_id, user_id, content
└── created_at

notifications (通知表)
├── id, user_id, type
├── title, content, data
├── is_read
└── created_at

user_blocklist (黑名单表)
├── id, user_id, blocked_user_id
└── created_at
```

### 安全特性

- **HMAC Token 认证** - 自定义 Token 签名，完整 256-bit HMAC
- **Per-user Salt** - 每个用户独立的密码盐值
- **PBKDF2 加密** - 100000 次迭代，SHA-512 哈希
- **CORS 白名单** - 严格 Origin 校验，禁止无 Origin 请求
- **Helmet 安全头** - X-Frame-Options, X-Content-Type-Options, HSTS 等
- **Rate Limiting** - 登录/注册/消息/点赞/AI 接口分级限流
- **Socket 安全** - 房间加入校验 match 成员，消息发送校验参与权限
- **输入校验** - UUID 格式、参数长度、类型验证、消息长度限制
- **环境变量校验** - 启动时强制检查 PG_PASSWORD、TOKEN_SECRET、PG_HOST
- **密码盐值隔离** - API 响应中移除 password_hash 和 password_salt

---

## 项目结构

```
soulquad-web/
├── src/                          # 前端源码
│   ├── components/               # 可复用组件
│   │   ├── AvatarUpload.tsx      # 头像上传
│   │   ├── BottomTabBar.tsx      # 底部导航栏
│   │   ├── NotificationBell.tsx  # 通知铃铛
│   │   └── Navbar.tsx            # 顶部导航
│   ├── pages/                    # 页面组件
│   │   ├── Home.tsx              # 首页（引导页）
│   │   ├── Login.tsx             # 登录页
│   │   ├── Register.tsx          # 注册页
│   │   ├── SoulTest.tsx          # 灵魂测试
│   │   ├── Discover.tsx          # 发现/匹配
│   │   ├── Messages.tsx          # 消息列表
│   │   ├── Chat.tsx              # 私聊页面
│   │   ├── Moments.tsx           # 动态广场
│   │   ├── Leaderboard.tsx       # 排行榜
│   │   ├── Profile.tsx           # 个人中心
│   │   └── Settings.tsx          # 设置页
│   ├── services/                 # API 服务
│   │   └── api.ts                # API 封装
│   ├── hooks/                    # 自定义 Hooks
│   │   ├── useAuth.ts            # 认证 Hook
│   │   └── useTheme.ts           # 主题 Hook
│   ├── data/                     # 静态数据
│   │   └── mbti.ts               # MBTI 题库
│   ├── types/                    # 类型定义
│   │   └── index.ts
│   ├── App.tsx                   # 应用入口
│   └── index.css                 # 全局样式
├── server/                       # 后端源码
│   ├── index.js                  # Express + Socket.IO 入口
│   ├── db/
│   │   ├── database.js           # 数据库连接和初始化
│   │   └── migrate.sql           # 数据库迁移
│   └── routes/                   # API 路由
│       ├── auth.js               # 认证（登录/注册）
│       ├── users.js              # 用户资料
│       ├── matches.js            # 匹配系统
│       ├── messages.js           # 私信
│       ├── moments.js            # 动态广场
│       ├── notifications.js      # 通知系统
│       ├── ai.js                 # AI 功能
│       ├── soulTest.js           # 灵魂测试
│       └── cities.js             # 城市数据
├── deploy/                       # 部署配置
│   ├── deploy-to-server.sh       # 一键部署脚本
│   ├── deploy-update.sh          # 更新部署脚本
│   ├── nginx.conf                # Nginx 配置
│   └── generate-ssl.sh           # SSL 证书生成
├── electron/                     # Electron 桌面端
├── dist/                         # 前端构建输出
├── package.json                  # 项目配置
├── vite.config.ts                # Vite 配置
├── tsconfig.json                 # TypeScript 配置
├── CLAUDE.md                     # 项目行为规范
└── README.md                     # 项目文档
```

---

## 快速开始

### 环境要求

- Node.js 18+ (推荐 20 LTS)
- npm 9+
- PostgreSQL 12+ (生产环境)

### 本地开发

```bash
# 1. 克隆项目
git clone https://github.com/DeXuan/soulquad-web.git
cd soulquad-web

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 填入数据库配置

# 4. 启动前端（端口 5173）
npm run dev

# 5. 启动后端（端口 3001）
cd server && node index.js
```

### 生产部署

```bash
# 使用一键部署脚本
chmod +x deploy/deploy-to-server.sh
./deploy/deploy-to-server.sh your-server-ip your-domain.com
```

详细部署指南请参考 [部署方案.md](./部署方案.md)

---

## 配置说明

### 环境变量 (.env)

```bash
# 服务器配置
NODE_ENV=production
PORT=3001

# 数据库配置
PG_HOST=localhost          # PostgreSQL 主机
PG_PORT=5432              # PostgreSQL 端口
PG_DATABASE=soulquad      # 数据库名
PG_USER=soulquad_user     # 数据库用户
PG_PASSWORD=your_password # 数据库密码

# 安全配置
TOKEN_SECRET=your-secret-key  # JWT 密钥（务必修改！）

# CORS 配置
ALLOWED_ORIGINS=https://your-domain.com  # 允许的前端域名
```

### API 配置

前端 API 地址在 `src/services/api.ts` 中配置：

```typescript
const API_BASE = '/api';  // 生产环境使用相对路径
// 或
const API_BASE = 'http://localhost:3001/api';  // 开发环境
```

### 头像方案

使用 DiceBear micah 可爱卡通风格头像：

```
https://api.dicebear.com/7.x/micah/svg?seed={username}&size=800
```

---

## 匹配算法详解

### 灵魂契合度计算 (0-73分)

| 维度 | 最高分 | 计算方式 |
|------|--------|----------|
| MBTI 匹配 | 36分 | I/E(15) + S/N(8) + T/F(8) + J/P(5) |
| 象限匹配 | 12分 | 相同象限 +12，相邻 +6 |
| 价值观匹配 | 15分 | 每个共同价值观 +2.5 分 |
| 兴趣匹配 | 10分 | 每个共同兴趣 +1.5 分 |

### 用户质量评分 (0-60分)

| 维度 | 最高分 | 计算方式 |
|------|--------|----------|
| 资料完整度 | 20分 | 10 个字段完整度占比 |
| 活跃度 | 20分 | 1小时内 +20，24小时 +15，72小时 +10 |
| 等级加成 | 10分 | 传奇 10，顶尖 8，优秀 5，普通 2 |
| 灵魂分 | 10分 | soul_score / 10 |

### 最终排名公式

```
最终得分 = 灵魂契合度 × 0.5 + 用户质量 × 0.3 + 新人扶持 × 0.1 + 多样性 × 0.1
```

---

## 测试账号

系统首次启动会自动创建 55 个测试用户：

| 用户名 | 密码 | 等级 | 说明 |
|--------|------|------|------|
| alice | demo123 | 🏆 传奇 | 女，ENFP，探险家 |
| bob | demo123 | ⭐ 顶尖 | 男，INTJ，思想家 |
| carol | demo123 | ✨ 优秀 | 女，INFP，艺术家 |
| david | demo123 | ✨ 优秀 | 男，ESTJ，建造者 |
| emma | demo123 | 👤 普通 | 女，ENTP，探险家 |
| frank | demo123 | 👤 普通 | 男，ISFP，艺术家 |
| user_f_1 ~ user_f_25 | demo123 | 随机 | 女性测试用户 |
| user_m_1 ~ user_m_30 | demo123 | 随机 | 男性测试用户 |

---

## 部署方式

### 方式一：一键脚本部署（推荐）

```bash
./deploy/deploy-to-server.sh your-server-ip your-domain.com
```

自动完成：系统依赖安装 → PostgreSQL 配置 → 项目构建 → Nginx 配置 → SSL 证书 → 服务启动

### 方式二：Docker 部署

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 方式三：手动部署

详见 [部署方案.md](./部署方案.md)

---

## 常见问题

### Q: 忘记密码怎么办？

A: 目前不支持自助找回密码，需要联系管理员重置。

### Q: 如何修改头像？

A: 在个人中心点击头像，支持上传自定义头像或使用 DiceBear 随机生成。

### Q: 为什么看不到某些用户？

A: 系统采用等级可见性机制，普通用户只能看到普通等级的用户。提升灵魂分数和匹配数可以解锁更高等级。

### Q: 如何开启匿名发布？

A: 在发布动态时，勾选"匿名发布"选项，系统会自动生成随机昵称。

---

## 安全审计

### 已修复问题

| 严重程度 | 问题 | 修复措施 |
|----------|------|----------|
| CRITICAL | .env 生产凭据提交到 git | 需手动轮换 PG_PASSWORD 和 TOKEN_SECRET |
| HIGH | TOKEN_SECRET 弱默认值 | 启动时强制校验，缺失则拒绝启动 |
| HIGH | CORS 允许无 Origin 请求 | 移除 !origin 通配，严格白名单 |
| HIGH | 缺少安全响应头 | 添加 Helmet 中间件 |
| HIGH | 消息/点赞/AI 接口无限流 | 分级 Rate Limiting |
| HIGH | Socket 无 match 成员校验 | join_room/send_message 验证参与权限 |
| MEDIUM | password_salt 泄露到客户端 | 所有 API 响应中移除敏感字段 |
| MEDIUM | 消息内容长度无限制 | REST/Socket 均限制 5000 字符 |
| MEDIUM | message_type 未校验 | 白名单验证 text/image/audio |
| MEDIUM | 动态分页无上限 | limit 上限 100 |
| MEDIUM | video_url 无验证 | 校验 URL 格式和长度 |
| MEDIUM | 用户名枚举 | 注册失败返回通用错误信息 |
| LOW | 潜在 N+1 查询 | 动态评论批量查询 |
| LOW | 匹配过滤全表加载 | 迁移到 SQL 条件过滤 |

### 待修复问题

| 严重程度 | 问题 | 建议 |
|----------|------|------|
| MEDIUM | Token 存储在 localStorage | 迁移到 httpOnly Cookie |
| MEDIUM | 数据库连接无 SSL | 配置 PostgreSQL SSL |
| MEDIUM | 无服务端 Token 吊销 | 实现 Redis Token 黑名单 |
| LOW | Token 有效期 7 天 | 缩短至 1-2 小时 + Refresh Token |
| LOW | 遗留密码哈希兼容 | 一次性迁移脚本升级 |

---

## 更新日志

### v1.3.0 (2026-05-28)
- 安全加固：Helmet 安全头、CORS 严格白名单、分级 Rate Limiting
- Socket 安全：join_room/send_message 校验 match 成员权限
- 输入验证：消息长度限制、message_type 白名单、video_url 格式校验
- 分页安全：动态列表 limit 上限 100
- 前端重构：移除 MOCK_MODE 死代码、API_BASE 环境变量配置
- 聊天 UI：微信风格布局、消息时间策略、头像显示优化
- Bug 修复：Moments 分页 stale closure、Chat 音频录制 race condition、Discover 双重加载

### v1.2.0 (2026-05-17)
- 配置远程 PostgreSQL 数据库
- 更新部署脚本支持新数据库配置
- 完善项目文档

### v1.1.0 (2026-05-15)
- 智能匹配算法重写
- 添加新人扶持机制
- 多样性调整避免同质化推荐

### v1.0.0 (2026-05-01)
- 项目初始版本
- 核心功能上线：灵魂测试、匹配、聊天、动态

---

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 联系方式

- GitHub: https://github.com/DeXuan/soulquad-web
- 问题反馈: Issues
