# SoulQuad 数据库迁移指南

## 概述

本指南帮助你将本地 PostgreSQL 数据库迁移到服务器端 PostgreSQL 数据库。

## 迁移流程

```
本地 PostgreSQL → 导出数据 → 上传文件 → 服务器导入 → 完成
```

---

## 第一步：本地导出数据

### 1.1 配置本地数据库连接

编辑 `export-db.js` 中的 CONFIG：

```javascript
const CONFIG = {
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432'),
  database: process.env.PG_DATABASE || 'soulquad',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'postgres',
};
```

或使用环境变量：
```bash
export PG_HOST=localhost
export PG_PORT=5432
export PG_DATABASE=soulquad
export PG_USER=postgres
export PG_PASSWORD=your_password
```

### 1.2 运行导出脚本

```bash
cd soulquad-web
node scripts/export-db.js
```

### 1.3 导出结果

成功后会生成 `exports/` 目录，内容如下：

```
exports/
├── _metadata.json          # 导出元数据
├── users.json             # 用户数据
├── matches.json           # 匹配数据
├── messages.json          # 消息数据
├── notifications.json     # 通知数据
├── moments.json           # 动态数据
├── moment_likes.json      # 动态点赞
├── moment_comments.json   # 动态评论
├── user_blocklist.json    # 拉黑列表
└── import-db.js           # 导入脚本
```

---

## 第二步：上传文件到服务器

### 2.1 打包文件

```bash
cd exports
tar -czvf soulquad-data.tar.gz *.json *.js
```

### 2.2 上传到服务器

使用 scp 或其他工具：

```bash
# scp 方式
scp soulquad-data.tar.gz user@your-server:/home/user/soulquad/exports/

# 或使用 rsync
rsync -avz soulquad-data.tar.gz user@your-server:/home/user/soulquad/exports/
```

### 2.3 解压

```bash
ssh user@your-server
cd /home/user/soulquad/exports
tar -xzvf soulquad-data.tar.gz
```

---

## 第三步：服务器端导入

### 3.1 配置服务器数据库连接

编辑 `import-db.js` 中的 CONFIG：

```javascript
const CONFIG = {
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432'),
  database: process.env.PG_DATABASE || 'soulquad',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'postgres',
};
```

### 3.2 确保表结构已创建

导入脚本会自动创建表结构（如果不存在）。但需要先确保服务器端的表结构是最新的：

```bash
# 在服务器上启动 Node 服务，会自动执行 createTables()
npm run start
# 或直接初始化数据库
node -e "import('./server/db/database.js').then(db => db.initDb())"
```

### 3.3 运行导入脚本

```bash
cd /home/user/soulquad/exports
node import-db.js
```

---

## 迁移选项

### 清空现有数据

默认情况下，导入会保留现有数据（使用 `ON CONFLICT DO NOTHING`）。

如需清空后重新导入，编辑 `import-db.js`：

```javascript
const CLEAR_TABLES = true;  // 改为 true
```

### 只导入特定表

编辑 `import-db.js` 中的 TABLE_ORDER：

```javascript
const TABLE_ORDER = [
  'users',
  // 'matches',  // 注释掉不需要的表
  // 'messages',
  // ...只保留需要的表
];
```

---

## 验证迁移

### 检查数据量

```bash
# 连接数据库后执行
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL SELECT 'matches', COUNT(*) FROM matches
UNION ALL SELECT 'messages', COUNT(*) FROM messages
UNION ALL SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL SELECT 'moments', COUNT(*) FROM moments
UNION ALL SELECT 'moment_likes', COUNT(*) FROM moment_likes
UNION ALL SELECT 'moment_comments', COUNT(*) FROM moment_comments
UNION ALL SELECT 'user_blocklist', COUNT(*) FROM user_blocklist;
```

### 验证用户登录

```bash
# 启动服务
npm run start

# 测试登录接口
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"demo123"}'
```

---

## 常见问题

### Q: 导入失败，提示 "duplicate key"

A: 这是正常的，脚本使用 `ON CONFLICT DO NOTHING` 跳过重复数据。如果需要替换数据，将 `CLEAR_TABLES` 设为 `true`。

### Q: 表不存在错误

A: 需要先运行服务器让 Node.js 自动创建表结构，然后再导入数据。

### Q: 数据量很大，导入很慢

A: 可以注释掉 `SET session_replication_role = 'replica'` 相关行以加速导入，但这会暂时禁用外键约束检查。

---

## 自动化一键迁移脚本

如果你想要一键完成，可以创建一个 combined 脚本：

```bash
#!/bin/bash
# 一键迁移脚本

set -e

echo "=== SoulQuad Database Migration ==="

# 1. 导出
echo "[1/4] Exporting local database..."
node scripts/export-db.js

# 2. 打包
echo "[2/4] Packaging export files..."
cd exports
tar -czvf ../soulquad-data.tar.gz *.json *.js
cd ..

# 3. 上传 (需要配置服务器信息)
echo "[3/4] Uploading to server..."
read -p "Enter server user@host: " SERVER
scp soulquad-data.tar.gz $SERVER:/home/user/soulquad/exports/

# 4. 远程导入
echo "[4/4] Importing on server..."
ssh $SERVER "cd /home/user/soulquad/exports && tar -xzvf soulquad-data.tar.gz && node import-db.js"

echo "=== Migration Complete ==="
```

---

## 回滚方案

如果迁移出错，可通过以下方式回滚：

1. 删除服务器数据库：
```sql
DROP DATABASE soulquad;
CREATE DATABASE soulquad;
```

2. 重新导入（清空模式）：
编辑 `import-db.js` 设置 `CLEAR_TABLES = true`，然后重新运行导入。