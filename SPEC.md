# 灵魂象限 SoulQuad - 完整产品功能说明书

## 版本历史
- v2.0 (2026-05-08): 完整APP规范，包含底部Tab导航、四大模块完整功能

---

## 一、全局基础规范

### 1. 底部任务栏 Tab

**UI 风格：**
- 顺序：发现 → 消息 → 排行 → 我的
- 极简浅色图标 + 文字，选中高亮主题色，未选中浅灰色 `#94a3b8`
- 高度：56px，固定底部，不被输入法遮挡
- 图标大小：24px，文字 10px

**当前选中高亮样式：**
- 图标颜色：`var(--primary)` 主题色
- 文字颜色：`var(--primary)`

**全局能力：**
- 多端登录账号互通
- 未读消息红点角标
- 缓存用户层级 / 定位 / 筛选条件
- 支持后台保活，切换模块不重新登录

---

## 二、Tab1 发现（首页）

### 1. 顶部布局

**前端展示：**
```
┌─────────────────────────────────┐
│ 世界 ▼   │   城市 ▼   │  🔍   │
└─────────────────────────────────┘
```

**后端逻辑：**

| 字段 | 类型 | 说明 |
|------|------|------|
| location_mode | string | `world` / `city` |
| city_code | string | 城市编码，默认 `0` 代表全国 |
| latitude | number | 纬度 |
| longitude | number | 经度 |

**定位逻辑：**
- 优先获取手机 GPS 定位
- 用户拒绝定位 → 默认「世界 - 全国推荐」
- 手动切换城市后本地缓存，下次复用

**交互规则：**
- 点击城市弹窗：城市列表 + 模糊搜索
- 切换立即重新请求推荐流，无刷新

### 2. 主内容区：卡片流

**前端展示：**
```
┌─────────────────────────────────┐
│     [头像 - 全屏]               │
│                                 │
│  Nickname  28岁  170cm          │
│  🏛️ 硕士  🏠 有房               │
│                                 │
│  [MBTI标签] [象限emoji]          │
│  ━━━━━━━━━ 88% 契合             │
│                                 │
│  💕 交友目的标签                 │
│                                 │
│        ○  ✕                    │
│       喜欢 跳过                  │
└─────────────────────────────────┘
```

**后端接口：**

`GET /api/matches/potential`

Request Headers:
```
x-user-id: string
```

Query Parameters:
- `location_mode`: world | city
- `city_code`: string
- `gender`: male | female | all
- `age_min`: number
- `age_max`: number
- `education`: string
- `mode`: matchmaking | friendship | companion

Response:
```json
{
  "id": "uuid",
  "nickname": "Alice",
  "age": 25,
  "gender": "female",
  "avatar_data": "base64...",
  "bio": "热爱旅行和探索新事物",
  "mbti": "ENFP",
  "soul_quadrant": "explorer",
  "soul_score": 95,
  "user_tier": "legend",
  "match_count": 55,
  "height": 165,
  "education": "硕士",
  "city": "北京",
  "purpose_tags": ["相亲", "认真恋爱"],
  "compatibility_score": 88
}
```

**推荐排序规则：**
1. 先按性别分层池匹配（男向下兼容、女向上择优）
2. 再按四维象限契合度降序
3. 自动过滤：未实名、已拉黑、已匹配、违规封禁、已左滑用户

### 3. 右滑喜欢 / 左滑跳过

**前端展示：**
- 右侧悬浮双按钮：`✕` 跳过 / `♥` 喜欢
- 上滑切换下一张卡片
- 匹配成功弹窗

**后端接口：**

`POST /api/matches/like/:userId`

Request:
```
x-user-id: string
```

Response:
```json
{
  "matched": true,
  "match": {
    "id": "match-uuid",
    "oder_a_id": "user-a-id",
    "oder_b_id": "user-b-id",
    "soulmate_index": 88,
    "mutual_liked": true,
    "created_at": "2026-05-07T12:00:00Z"
  }
}
```

**交互规则：**
- 右滑喜欢 → 双方互喜欢自动匹配成功
- 匹配成功弹窗：「💕 匹配成功！」，点击进入聊天
- 左滑 → 后端降同类标签权重，永不复推

### 4. 筛选功能

**前端展示：**
- 右侧悬浮筛选按钮 `⚡`
- 点击展开筛选面板

**筛选条件：**

| 字段 | 类型 | 说明 |
|------|------|------|
| gender | string | `male` / `female` / `all` |
| age_min | number | 最小年龄 |
| age_max | number | 最大年龄 |
| education | string | 学历要求 |
| has_house | boolean | 有房 |
| has_car | boolean | 有车 |
| purpose | string | 交友目的：`dating` / `relationship` / `partner` |
| mode | string | `matchmaking` / `friendship` / `companion` |

**后端接口：**

`GET /api/matches/potential?gender=female&age_min=25&age_max=35&education=硕士&mode=matchmaking`

### 5. 模式切换

**三种模式：**
- `matchmaking`: 相亲模式
- `friendship`: 交友模式
- `companion`: 搭子模式

**后端逻辑：**
模式切换后立即调整推送权重，重新推送符合当前模式的用户

---

## 三、Tab2 消息

### 1. 消息列表页

**前端展示：**
```
┌─────────────────────────────────┐
│         消息            [设置]   │
├─────────────────────────────────┤
│ [Tab] 匹配 | 聊天 | 系统         │
├─────────────────────────────────┤
│ 🔴 匹配通知                      │
│ ┌─────────────────────────────┐ │
│ │ [头像] Nickname    刚刚      │ │
│ │        💕 匹配成功！          │ │
│ │        88%契合 · 点击聊天     │ │
│ └─────────────────────────────┘ │
│                                 │
│ 聊天会话列表                     │
│ ┌─────────────────────────────┐ │
│ │ [头像] Nickname2  昨天       │ │
│ │        消息内容...           │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**消息分类：**
1. **匹配通知**（顶部固定，未读标红）
2. **聊天会话**（按最后消息时间倒序）
3. **系统通知**（账号审核、违规提醒、活动通知）

**后端接口：**

`GET /api/matches`

Request:
```
x-user-id: string
```

Response:
```json
[
  {
    "id": "match-uuid",
    "oder_a_id": "user-a-id",
    "oder_b_id": "user-b-id",
    "soulmate_index": 88,
    "user_a_liked": true,
    "user_b_liked": true,
    "mutual_liked": true,
    "matched_at": "2026-05-07T12:00:00Z"
  }
]
```

`GET /api/notifications?type=match`

`GET /api/notifications?type=system`

### 2. 聊天详情页

**前端展示：**
```
┌─────────────────────────────────┐
│ ← Nickname        🧭 INTJ  88%契合│
│              [在线]              │
├─────────────────────────────────┤
│         │ 今天                   │
│         │                        │
│         │   你好呀～             │
│         │   [10:30]             │
│         │                        │
│   [我]  │   你也喜欢旅行吗？       │
│         │   [10:32]             │
│         │                        │
├─────────────────────────────────┤
│ [输入框...]            [发送]   │
│ [图片] [AI破冰话题]              │
└─────────────────────────────────┘
```

**后端接口：**

`GET /api/messages/:matchId`

Request:
```
x-user-id: string
```

Response:
```json
[
  {
    "id": "msg-uuid",
    "match_id": "match-uuid",
    "sender_id": "user-id",
    "content": "你好呀～",
    "message_type": "text",
    "created_at": "2026-05-07T10:30:00Z",
    "read_at": null
  }
]
```

`POST /api/messages/:matchId`

Request:
```json
{
  "content": "消息内容"
}
```

Response:
```json
{
  "id": "msg-uuid",
  "match_id": "match-uuid",
  "sender_id": "user-id",
  "content": "消息内容",
  "message_type": "text",
  "created_at": "2026-05-07T10:35:00Z",
  "read_at": null
}
```

### 3. 实时消息（WebSocket）

**Socket.io 事件：**

| 事件名 | 方向 | 说明 |
|--------|------|------|
| `join_room` | 客户端→服务端 | 进入聊天房间 |
| `send_message` | 客户端→服务端 | 发送消息 |
| `new_message` | 服务端→客户端 | 新消息推送 |
| `typing` | 双向 | 对方正在输入 |

**发送消息 Payload：**
```json
{
  "match_id": "match-uuid",
  "content": "消息内容",
  "message_type": "text"
}
```

### 4. AI 破冰话题

**后端接口：**

`POST /api/ai/icebreaker`

Request:
```json
{
  "match_id": "match-uuid"
}
```

Response:
```json
{
  "topics": [
    "你们都喜欢旅行吗？",
    "最近有什么好看的电影推荐吗？",
    "周末一般喜欢做什么？"
  ]
}
```

---

## 四、Tab3 排行

### 1. 排行榜页

**前端展示：**
```
┌─────────────────────────────────┐
│   🏆 灵魂排行榜                  │
├─────────────────────────────────┤
│ [Tab] 热门 | 新人 | 同城          │
├─────────────────────────────────┤
│ 🥇 1. Nova     96分   60匹配     │
│    🏆 传奇 | 🏛️ ENFJ | 🚀       │
│                                 │
│ 🥈 2. Luna     92分   45匹配     │
│    🏆 传奇 | 🤓 INFJ | 🤔       │
│                                 │
│ 🥉 3. Kai      94分   52匹配     │
│    🏆 传奇 | 🎯 ENTJ | 🚀       │
└─────────────────────────────────┘
```

**榜单类型：**

| 榜单 | 排序规则 |
|------|----------|
| 热门榜 | 活跃度 + 互动量（聊天次数、被右滑次数）|
| 新人大榜 | 近7天注册，实名完成度 + 答题完整度 |
| 同城榜 | 同城 + 契合度 + 活跃度 |

**后端接口：**

`GET /api/users/leaderboard?type=hot`

`GET /api/users/leaderboard?type=new`

`GET /api/users/leaderboard?type=city`

Response:
```json
[
  {
    "id": "user-uuid",
    "nickname": "Nova",
    "avatar_data": "base64...",
    "mbti": "ENFJ",
    "soul_quadrant": "explorer",
    "soul_score": 96,
    "user_tier": "legend",
    "match_count": 60,
    "like_count": 120
  }
]
```

**排名颜色：**
- 前3名：金色（#fbbf24）
- 4-10名：橙色（#f97316）
- 10名后：灰色（#94a3b8）

### 2. 用户等级分层

| 等级 | 名称 | 条件 | 可见性规则 |
|------|------|------|------------|
| legend | 传奇 | Soul Score ≥95 且 匹配数≥50 | 只能看到 legend/top |
| top | 顶尖 | Soul Score ≥85 且 匹配数≥30 | 只能看到 top/legend |
| excellent | 优秀 | Soul Score ≥70 且 匹配数≥10 | 只能看到 excellent及以上 |
| ordinary | 普通 | 其他 | 可见所有 |

**算法实现：**
```javascript
function canSeeProfile(viewer, target) {
  const tierRank = { ordinary: 0, excellent: 1, top: 2, legend: 3 };
  return tierRank[viewer.user_tier] >= tierRank[target.user_tier] - 1;
}
```

---

## 五、Tab4 我的

### 1. 个人主页

**前端展示：**
```
┌─────────────────────────────────┐
│ [头像]                    [设置]│
│ Nickname                        │
│ 🏆 传奇 | 🏛️ ENFP | 🚀          │
│                                 │
│ ━━━━━━━━━ 88% 灵魂契合          │
├─────────────────────────────────┤
│ 💡 AI灵魂解读                    │
│ ┌─────────────────────────────┐ │
│ │ 「你是一个天生的探险家...」     │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ 灵魂测试结果  |  编辑资料        │
│ 我的匹配  |  通知管理            │
│          退出登录               │
└─────────────────────────────────┘
```

### 2. 功能入口

| 功能 | 说明 |
|------|------|
| 我的灵魂画像 | 四维雷达图 + 答题明细 + 契合度分析 |
| 我的匹配 | 已匹配用户列表，支持搜索/删除 |
| 我的喜欢 | 右滑过未匹配用户，支持取消 |
| 会员中心 | 权益展示 + 充值入口 |
| 实名认证 | 人脸实名 + 学历校验 + 资产佐证 |
| 隐私设置 | 资料可见范围 + 加密设置 |
| 黑名单 | 拉黑用户列表，支持解除 |
| 帮助与反馈 | 常见问题 + 客服入口 |
| 账号安全 | 手机绑定/密码修改/第三方解绑 |
| 退出登录 | 清除登录状态 |

### 3. 灵魂测试入口

**测试流程：**

1. **MBTI 测试** (12题)
   - 每题二选一：A / B
   - 进度条显示当前进度

2. **价值观选择** (最多5个)
   - 从预设列表选择核心价值观

3. **兴趣爱好** (最多5个)
   - 从预设列表选择兴趣爱好

4. **完成页面**
   - 展示 MBTI 结果 + 灵魂象限
   - 跳转发现页

**后端接口：**

`POST /api/soul-test`

Request:
```json
{
  "mbti": "ENFP",
  "soul_quadrant": "explorer",
  "values": ["真诚", "自由", "探索"],
  "interests": ["旅行", "音乐", "摄影"]
}
```

Response:
```json
{
  "id": "user-uuid",
  "nickname": "Nickname",
  "mbti": "ENFP",
  "soul_quadrant": "explorer",
  "profile_completed": 1
}
```

### 4. AI 灵魂解读

**后端接口：**

`POST /api/ai/soul-description`

Request Headers:
```
x-user-id: string
```

Response:
```json
{
  "description": "【灵魂特质】...\n\n【理想伴侣】...\n\n【相处建议】...",
  "traits": "你是一个天生的探险家...",
  "idealPartner": "寻找一个能够理解你...",
  "advice": "给彼此足够的空间..."
}
```

---

## 六、通知系统

### 1. 通知铃铛

**前端展示：**
- Navbar 右侧铃铛图标
- 未读数量红点角标

### 2. 通知列表

**通知类型：**

| type | 标题 | 场景 |
|------|------|------|
| `like` | 有人喜欢你 | 他人喜欢我 |
| `match` | 匹配成功！ | 双方互喜欢 |
| `message` | 新消息 | 收到聊天消息 |
| `system` | 系统通知 | 账号审核、违规、活动 |

### 3. 后端接口

`GET /api/notifications`

Response:
```json
[
  {
    "id": "notif-uuid",
    "user_id": "user-uuid",
    "type": "match",
    "title": "匹配成功！",
    "content": "你与 Nova 成功匹配",
    "data": { "matchId": "...", "userId": "..." },
    "read": false,
    "created_at": "2026-05-07T12:00:00Z"
  }
]
```

`GET /api/notifications/unread-count`

Response:
```json
{
  "count": 3
}
```

`POST /api/notifications/mark-read/:id`

`POST /api/notifications/mark-all-read`

---

## 七、用户资料

### 1. 资料字段

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | UUID |
| username | string | 用户名（唯一） |
| nickname | string | 昵称 |
| password_hash | string | 密码哈希 |
| age | number | 年龄 |
| gender | string | `male` / `female` / `other` |
| avatar_data | string | Base64 头像 |
| bio | string | 个人简介 |
| mbti | string | MBTI 类型 |
| soul_quadrant | string | 灵魂象限 |
| soul_score | number | 灵魂分数 |
| user_tier | string | 用户等级 |
| profile_completed | number | 是否完成测试 |
| values_json | string | JSON 价值观数组 |
| interests_json | string | JSON 兴趣爱好数组 |
| ai_description | string | AI 灵魂描述 |
| match_count | number | 匹配数 |
| activity_score | number | 活跃分数 |
| city | string | 定居城市 |
| height | number | 身高 |
| education | string | 学历 |
| has_house | number | 有房 0/1 |
| has_car | number | 有车 0/1 |
| purpose | string | 交友目的 |
| mode | string | 当前模式 |

### 2. 编辑资料接口

`PUT /api/users/profile`

Request:
```json
{
  "nickname": "新昵称",
  "age": 26,
  "gender": "female",
  "bio": "个人简介内容",
  "city": "北京",
  "height": 165,
  "education": "硕士",
  "has_house": 1,
  "has_car": 0,
  "purpose": "relationship",
  "mode": "matchmaking"
}
```

`POST /api/users/avatar`

Request:
```json
{
  "avatar_data": "base64..."
}
```

---

## 八、数据库表结构

### users 表
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nickname TEXT NOT NULL,
  age INTEGER DEFAULT 0,
  gender TEXT DEFAULT 'other',
  avatar_url TEXT DEFAULT '',
  avatar_data TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  mbti TEXT,
  soul_quadrant TEXT,
  soul_score INTEGER DEFAULT 0,
  user_tier TEXT DEFAULT 'ordinary',
  is_verified INTEGER DEFAULT 0,
  profile_completed INTEGER DEFAULT 0,
  values_json TEXT DEFAULT '[]',
  interests_json TEXT DEFAULT '[]',
  ai_description TEXT DEFAULT '',
  match_count INTEGER DEFAULT 0,
  activity_score INTEGER DEFAULT 0,
  city TEXT DEFAULT '',
  height INTEGER DEFAULT 0,
  education TEXT DEFAULT '',
  has_house INTEGER DEFAULT 0,
  has_car INTEGER DEFAULT 0,
  purpose TEXT DEFAULT '',
  mode TEXT DEFAULT 'matchmaking',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### matches 表
```sql
CREATE TABLE matches (
  id TEXT PRIMARY KEY,
  oder_a_id TEXT NOT NULL,
  oder_b_id TEXT NOT NULL,
  soulmate_index INTEGER DEFAULT 0,
  user_a_liked INTEGER DEFAULT 0,
  user_b_liked INTEGER DEFAULT 0,
  mutual_liked INTEGER DEFAULT 0,
  unlocked_level INTEGER DEFAULT 1,
  match_status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  matched_at TEXT
);
```

### messages 表
```sql
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  read_at TEXT
);
```

### notifications 表
```sql
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT DEFAULT '',
  content TEXT DEFAULT '',
  data TEXT DEFAULT '{}',
  read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### cities 表（城市数据）
```sql
CREATE TABLE cities (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  province TEXT NOT NULL,
  lat REAL,
  lng REAL
);
```

---

## 九、灵魂匹配算法

### Soul Index 计算

```javascript
function calculateSoulIndex(userA, userB) {
  let score = 50;

  // MBTI 兼容性 (每相同一位 +10分)
  if (userA.mbti && userB.mbti) {
    let matches = 0;
    for (let i = 0; i < 4; i++) {
      if (userA.mbti[i] === userB.mbti[i]) matches++;
    }
    score += matches * 10;
  }

  // 灵魂象限相同 +15分
  if (userA.soul_quadrant === userB.soul_quadrant) {
    score += 15;
  }

  // 共同价值观 (每个 +3分)
  const valuesA = JSON.parse(userA.values_json || '[]');
  const valuesB = JSON.parse(userB.values_json || '[]');
  const commonValues = valuesA.filter(v => valuesB.includes(v));
  score += commonValues.length * 3;

  // 共同兴趣 (每个 +2分)
  const interestsA = JSON.parse(userA.interests_json || '[]');
  const interestsB = JSON.parse(userB.interests_json || '[]');
  const commonInterests = interestsA.filter(i => interestsB.includes(i));
  score += commonInterests.length * 2;

  return Math.min(100, Math.max(0, score));
}
```

### 分层匹配规则

```javascript
// 男向下兼容，女向上择优
function getEligiblePool(currentUser, allUsers) {
  const isMale = currentUser.gender === 'male';
  const isFemale = currentUser.gender === 'female';

  return allUsers.filter(target => {
    // 异性优先
    if (target.gender === currentUser.gender) return false;

    // 等级可见性检查
    if (!canSeeProfile(currentUser, target)) return false;

    if (isMale) {
      // 男：可以看到同层及以下用户
      return true;
    } else if (isFemale) {
      // 女：向上看，可以看到更高等级
      return true;
    }

    return false;
  });
}
```

### 等级计算

```javascript
function calculateTier(soulScore, matchCount, activity) {
  if (soulScore >= 95 && matchCount >= 50) return 'legend';
  if (soulScore >= 85 && matchCount >= 30) return 'top';
  if (soulScore >= 70 && matchCount >= 10) return 'excellent';
  return 'ordinary';
}
```

---

## 十、API 汇总表

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 注册 |
| POST | /api/auth/login | 登录 |
| GET | /api/auth/me | 获取当前用户 |
| GET | /api/matches | 获取匹配列表 |
| GET | /api/matches/potential | 获取推荐用户（支持筛选参数） |
| POST | /api/matches/like/:userId | 喜欢用户 |
| POST | /api/matches/pass/:userId | 跳过用户 |
| GET | /api/messages/:matchId | 获取消息列表 |
| POST | /api/messages/:matchId | 发送消息 |
| POST | /api/messages/:matchId/read | 标记已读 |
| DELETE | /api/messages/:matchId/:messageId | 撤回消息（2分钟内） |
| GET | /api/users/:id | 获取用户信息 |
| PUT | /api/users/profile | 更新资料 |
| POST | /api/users/avatar | 上传头像 |
| GET | /api/users/leaderboard | 排行榜（支持type=hot/new/city） |
| GET | /api/users/likes | 获取我喜欢的人列表 |
| DELETE | /api/users/likes/:userId | 取消喜欢 |
| GET | /api/users/blocklist | 获取黑名单 |
| POST | /api/users/block/:userId | 拉黑用户 |
| DELETE | /api/users/block/:userId | 解除拉黑 |
| POST | /api/soul-test | 提交灵魂测试 |
| POST | /api/ai/soul-description | AI 灵魂解读 |
| POST | /api/ai/icebreaker | AI 破冰话题 |
| GET | /api/notifications | 通知列表 |
| GET | /api/notifications/unread-count | 未读数 |
| POST | /api/notifications/mark-read/:id | 标记已读 |
| POST | /api/notifications/mark-all-read | 全部已读 |
| GET | /api/cities | 城市列表 |
| GET | /api/cities/search | 搜索城市 |

---

## 十一、启动方式

```bash
# 安装依赖
npm install

# 启动后端 (端口 3001)
npm run server

# 启动前端 (端口 5173)
npm run dev
```

## 测试账号
- alice / demo123
- bob / demo123
- ivy / demo123 (excellent等级)
- nova / demo123 (legend等级)