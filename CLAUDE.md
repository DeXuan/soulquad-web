# SoulQuad 项目行为规范

## 1. 代码改动原则

**每次改动必须包含：**
- 改了什么东西 (what changed)
- 有什么影响 (what impact)
- 改动逻辑是什么 (why changed)

**最小改动：** 不做 speculative improvements，只改必要的代码。

**Surgical edits：** 编辑现有代码时，只改与任务直接相关的部分，不改进风格、注释、格式化等无关内容。

---

## 2. 安全规范

### 2.1 禁止硬编码 secrets
- 所有密码、密钥、连接字符串必须通过环境变量或 `.env` 文件读取
- 禁止在代码中明文存储数据库密码、TOKEN_SECRET 等
- PostgreSQL 连接信息通过 `process.env.PG_*` 读取

### 2.2 认证中间件
- 所有需要用户认证的 API 路由必须使用 `authMiddleware`
- 禁止通过 `x-user-id` 等可伪造的请求头获取用户身份
- Socket.IO 认证也必须使用 `verifyToken` 验证 JWT

### 2.3 CORS 配置
- 禁止使用 `origin: '*'`
- 必须使用白名单机制：`allowedOrigins.split(',')` 配置允许的域名

---

## 3. 数据库规范

### 3.1 Schema 变更
- 添加新字段使用 `ADD COLUMN IF NOT EXISTS`
- 字段定义要与 `src/types/index.ts` 中的 TypeScript 接口保持一致
- users 表关键字段：`height`, `education`, `occupation`, `annual_income`
- moments 表关键字段：`is_anonymous`, `anonymous_name`

### 3.2 密码存储
- 使用 PBKDF2 + per-user salt 加密
- 密码哈希格式：`crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')`
- 每个用户有独立的 `password_salt` 字段

### 3.3 迁移脚本
- 所有 schema 变更写为 SQL migration 语句
- 迁移脚本放在 `server/db/migrate.sql` 或单独文件
- 数据库初始化时自动执行 `CREATE TABLE IF NOT EXISTS`

---

## 4. API 设计规范

### 4.1 路由模块化
- 每个功能模块独立路由文件：`auth.js`, `users.js`, `matches.js`, `messages.js`, `moments.js`, `notifications.js`, `ai.js`, `soulTest.js`, `cities.js`
- 使用 `Router()` 创建路由，通过 `authMiddleware` 保护

### 4.2 响应格式
- 成功：`res.json({ ...data, success: true, message: '保存成功' })`
- 错误：`res.status(500).json({ error: 'Failed to...' })`

### 4.3 参数校验
- 对所有用户输入进行校验（长度、格式、范围）
- UUID 格式验证：`/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`

---

## 5. 前端规范

### 5.1 组件类型
- 路径：`src/pages/` (页面), `src/components/` (组件), `src/hooks/` (hooks), `src/services/` (API)
- 类型定义：`src/types/index.ts`

### 5.2 API 调用
- 通过 `api.ts` 中的 `fetchApi` 封装
- 自动附加 `Authorization: Bearer {token}` 请求头
- 401/403 响应自动清除 token 并跳转登录页

### 5.3 用户信息存储
- JWT token: `localStorage.getItem('soulquad_token')`
- 用户数据: `localStorage.getItem('soulquad_user')`

---

## 6. 发现页匹配逻辑 (Discover)

### 6.1 可见性过滤
```javascript
const tierRank = { ordinary: 0, excellent: 1, top: 2, legend: 3 };
// legend 用户可见所有普通用户
// ordinary 只能看到 ordinary
```

### 6.2 城市匹配
- 前端传入 `city_code` (实际是 city name)
- 后端使用 `u.city.includes(city_code)` 匹配

### 6.3 过滤条件
- 排除已 passed/liked 的用户
- 排除 blocked 用户
- 支持按 gender、age、education 筛选

---

## 7. 头像规范

### 7.1 当前头像方案
- 风格：DiceBear **micah** (可爱卡通风格)
- 分辨率：800px (高清)
- URL 格式：`https://api.dicebear.com/7.x/micah/png?seed={username}&size=800&backgroundColor=...`

### 7.2 头像更新时机
- 用户注册时自动生成
- 管理员可通过脚本批量更新

---

## 8. 动态 (Moments) 规范

### 8.1 匿名发布
- 支持 `is_anonymous` 字段
- 匿名时生成随机昵称：`灵魂A123`、`星辰X789` 等
- API 返回时匿名帖子的 `user` 字段显示匿名信息

### 8.2 内容限制
- 文字：最多 2000 字符
- 图片：最多 9 张
- 位置：最多 100 字符

---

## 9. 测试与部署

### 9.1 本地测试
```bash
# 启动后端
cd server && node index.js

# 启动前端
npm run dev

# 测试 API
curl -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"username":"alice","password":"demo123"}'
```

### 9.2 数据库操作
```bash
# 使用 node 连接 PostgreSQL
node -e "const {Pool} = require('pg'); const pool = new Pool({user:'postgres', password:'SoulQuad2024!', host:'localhost', database:'soulquad'}); pool.query('SQL').then(r => { console.log(r.rows); pool.end(); })"
```

---

## 10. Git 提交规范

### 10.1 提交信息
- 使用中文描述改动了什么
- 说明影响和逻辑
- 示例：
  - `fix: 修复 user_blocklist 表不存在导致发现页加载失败`
  - `feat: 添加匿名发布动态功能，包含随机匿名昵称生成`
  - `update: 更换所有用户头像为高清 800px micah 风格`

### 10.2 分支管理
- main 分支用于生产
- 避免直接在 main 做破坏性改动
- 重要功能使用 feature 分支

---

## 11. 关键文件索引

| 文件 | 说明 |
|------|------|
| `server/index.js` | Express + Socket.IO 入口，路由注册 |
| `server/db/database.js` | PostgreSQL 连接，schema 初始化 |
| `server/routes/*.js` | 各功能模块路由 |
| `server/routes/auth.js` | JWT 认证，TOKEN_SECRET 检查 |
| `src/services/api.ts` | 前端 API 封装 |
| `src/pages/Discover.tsx` | 发现页，包含匹配逻辑 |
| `src/pages/Profile.tsx` | 个人主页，包含编辑资料 |
| `src/pages/Moments.tsx` | 动态 feed，发布和评论 |
| `src/types/index.ts` | TypeScript 类型定义 |
| `.env` | 环境变量配置 |