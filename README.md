# 校园活动报名平台（团队协作教学项目）

React + Vite 纯前端项目，用 `localStorage` 做数据层，不依赖后端和数据库。
目标是练**分工与协作**：一人一个模块目录，通过公共数据层约定协作，互不踩脚。

## 快速开始

```bash
npm install
npm run dev        # 打开 http://localhost:5173
```

首次打开会写入一份演示数据（3 个账号、3 个活动），首页有「重置演示数据」按钮。

演示账号密码统一为 `123456`：

| 角色 | 邮箱 |
|---|---|
| 学生 | `student@campus.edu` |
| 主办方 | `organizer@campus.edu` |
| 管理员 | `admin@campus.edu` |

登录页可以一键切换，也可以自己注册学生 / 主办方账号（管理员不开放注册）。

## 8 个功能模块

| # | 模块 | 负责人 | 目录 | 页面路由 | 可写集合 | 状态 |
|---|---|---|---|---|---|---|
| 1 | 账号与权限 | 李四 `lisi` | `src/modules/auth/` | `/login` `/me` | `users` | 已实现（队长写的范例） |
| 2 | 活动发现 | 王五 `wangwu` | `src/modules/activities/` | `/activities` `/activities/:id` | 只读 | 待开发 |
| 3 | 活动发布 | 赵六 `zhaoliu` | `src/modules/publish/` | `/publish` `/publish/new` | `activities` | 待开发 |
| 4 | 报名管理 | 孙七 `sunqi` | `src/modules/registration/` | `/registrations` `/registrations/roster` | `registrations` | 待开发 |
| 5 | 签到核销 | 周八 `zhouba` | `src/modules/checkin/` | `/checkin` `/checkin/records` | `checkins` | 待开发 |
| 6 | 评论评分 | 吴九 `wujiu` | `src/modules/comments/` | `/comments` `/comments/moderate` | `comments` | 待开发 |
| 7 | 通知中心 | 郑十 `zhengshi` | `src/modules/notifications/` | `/notifications` | `notifications` | 待开发 |
| 8 | 审核与统计 | lijiatong（队长） | `src/modules/analytics/` | `/admin/review` `/admin/stats` | `activities`（仅 `status`） | 待开发 |

每个模块的详细任务写在 `src/modules/<模块>/index.js` 的 `tasks` 字段里，
待开发页面打开时占位页会直接列出来。做完一个页面就把对应的占位组件替换成真实实现。

模块 1 已经完整实现，**建议先读它再动手**：`index.js`（模块声明）、`api.js`（业务逻辑）、
`guard.jsx`（路由守卫）、`pages/`（页面）、`auth.css`（模块自己的样式）。

> 只有 7 位同学时：队长兼任模块 8，或把「评论评分」并入「活动发现」。

## 目录结构

```
.
├── .team/                  # 分工配置（队长维护）
│   ├── members.yaml        # 成员名册
│   ├── ownership.yaml      # 目录 → 负责人
│   └── audit-log.md        # 队长越界修改记录
├── .githooks/pre-commit    # 提交前的越界检查
├── scripts/
│   ├── team-check.mjs      # 检查脚本本体
│   └── team-claim.mjs      # 首次接入时认领身份（读 git 配置）
├── src/
│   ├── app/                # 路由自动装配、布局、首页（队长）
│   ├── shared/             # 公共数据层与 UI 组件（队长）
│   │   ├── db.js           # 集合读写 + useCollection
│   │   ├── session.js      # 当前登录用户
│   │   └── ui.jsx          # Button / Card / Field / Modal ...
│   ├── modules/            # 8 个功能模块，一人一个目录
│   │   ├── auth/           # 已实现：api.js / guard.jsx / pages/ / auth.css
│   │   └── <模块>/index.js # 模块描述：标题、负责人、任务、路由
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
└── vite.config.js
```

路由不用手写：`src/app/routes.jsx` 通过 `import.meta.glob` 自动收集所有
`src/modules/*/index.js` 里声明的 `routes`。所以**不要改 `routes.jsx`**，
只改自己的 `index.js`。

## 数据模型

```js
users          { id, name, email, password, role: 'student' | 'organizer' | 'admin' }
activities     { id, title, category, location, startAt, capacity, organizerId,
                 status: 'draft' | 'pending' | 'published' | 'rejected' | 'ended',
                 description, createdAt }
registrations  { id, activityId, userId, status: 'confirmed' | 'cancelled' | 'waitlist', createdAt }
checkins       { id, activityId, userId, checkedAt }
comments       { id, activityId, userId, rating, content, createdAt }
notifications  { id, userId, type, title, body, read, createdAt }
```

读写方式：

```js
import { db, useCollection } from '../../shared/db.js'
import { useSession } from '../../shared/session.js'

const activities = useCollection('activities') // 数据变化自动重渲染
db.insert('registrations', { activityId, userId, status: 'confirmed' })
db.update('activities', id, { status: 'published' })
```

**铁律**：`useCollection` 随便读，`db.insert / update / remove` 只写自己模块负责的集合。
需要别的模块加字段或方法，找对应负责人（或让队长在 `src/shared/` 里加）。

## 账号与权限（已实现，其他模块直接复用）

登录态统一走 `src/shared/session.js`，**不要自己读写 localStorage**。其他模块常用三件事：

```jsx
import { useSession } from '../../shared/session.js'
import { RequireLogin, RequireRole } from '../auth/guard.jsx'
import { ROLE_LABELS } from '../auth/api.js'

// 1. 读当前用户：user 为 null 表示未登录
const { user } = useSession()
const userId = user?.id

// 2. 页面需要登录才能看
export default function MyPage() {
  return <RequireLogin><MyContent /></RequireLogin>
}

// 3. 只有指定角色能看（未登录会跳 /login，登录后自动回到原页面）
<RequireRole roles={['admin', 'organizer']}><AdminContent /></RequireRole>
```

账号模块对外提供的接口（`src/modules/auth/api.js`）：

| 接口 | 说明 |
|---|---|
| `login({ email, password })` | 返回 `{ ok, user?, error? }` |
| `register({ name, email, password, role })` | 学生 / 主办方可注册，管理员不行 |
| `updateProfile(userId, { name, email })` | 改昵称和邮箱，检查邮箱唯一 |
| `logout()` | 退出登录 |
| `ROLE_LABELS` / `ROLE_DESCRIPTIONS` | 角色中文名与权限说明 |

调用示例（报名模块判断能不能报名）：

```js
const { user } = useSession()
if (!user) return <Link to="/login" state={{ from: '/activities' }}>登录后报名</Link>
if (user.role === 'organizer') return <p>主办方账号不能报名自己的活动</p>
```

## 协作规则

团队工作方式就四步：

| 步骤 | 做什么 | 谁来做 |
|---|---|---|
| 1 | 拉代码，配置 `git config user.name / user.email` | 每个人 |
| 2 | **在对话里认领模块**，工具自动读 git 配置并更新分工 | 每个人 |
| 3 | 只在自己负责的目录里开发新功能 | 每个人 |
| 4 | 提交时钩子自动识别身份、检查越界 | 每个人 |

### 1. 接入（每人一次：先认领，再开发）

第一步不是写代码，而是**在对话里认领自己要负责的模块**。

```bash
git clone <repo> && cd teamproj
npm install
git config core.hooksPath .githooks     # 启用提交前越界检查
git config user.name "你的名字"
git config user.email "你的邮箱"         # 工具靠这个自动识别你
```

然后在对话里说一句，比如：

> 我是王五，认领「活动发现」模块。

我会自动完成下面几件事，你不用手改配置文件：

1. 读取 `git config user.name` / `user.email`
2. 校验这个模块归谁（对照 `.team/ownership.yaml`）
3. 把身份写入 `.team/me`，并加入 `.git/info/exclude`（本机身份，不提交）
4. 用你的 git 信息更新 `.team/members.yaml` 里自己那一行

命令行的等价操作：

```bash
npm run team:claim -- wangwu    # 认领身份
npm run team:whoami             # 查看当前身份和负责目录
```

输出类似：

```
当前身份：王五（wangwu）
git 邮箱：wangwu@xxx.com
负责目录：src/modules/activities/**
队长：lijiatong
```

认领过一次之后，提交时钩子会自动识别你并检查越界，不用再声明身份。
如果换了电脑或换了 git 邮箱，重新跑一次 `npm run team:claim` 即可。

### 2. 开发循环

```bash
git pull --rebase
git checkout -b feat/lisi-auth-login

# 只在 src/modules/auth/ 里写代码

git add src/modules/auth/
git diff --cached --name-only      # 自检：全是自己目录的文件
git commit -m "feat(auth): 实现登录与角色切换" -m "Owner: lisi"
git push -u origin feat/lisi-auth-login
```

> 第一次提交通常会带上 `.team/members.yaml` 里自己那一行（认领时自动写入）。
> 钩子允许「只改自己一行」的成员信息，但改别人那行会被拦下。

### 3. 越界会被钩子拦下

```bash
git add src/modules/checkin/     # 不是自己负责的目录
git commit -m "..."
```

```
越界：src/modules/checkin/CheckinPage.jsx
负责人：周八（zhouba）
原因：该路径匹配 src/modules/checkin/**
建议：联系负责人修改；或由队长临时授权
```

- 组员只能改 `ownership.yaml` 里 owner 是自己的目录
- 队长可以改任意路径，但必须在 `.team/audit-log.md` 补记录
- 公共代码（`src/shared/`、`src/app/`、`package.json`、`styles.css`）归队长，组员提需求
- 只有队长把分支合入 `main`，合并前先 `npm run build` 确认能构建

### 4. 提交信息

```
feat(<模块>): <做了什么>
Owner: <成员id>
```

## 队长开工前 checklist

1. 把 `.team/members.yaml` 里的占位姓名 / 邮箱改成真实信息；不确定的留占位符，队员认领时会自动补全
2. 如果模块分配有变，同步改 `.team/ownership.yaml` 和对应 `src/modules/*/index.js` 的 `owner` / `ownerName`
3. 跑 `npm run dev` 与 `npm run build` 确认骨架可用
4. 提交并推送，通知组员按「接入」步骤操作
5. 组员提交 PR 时，检查改动文件是否都在其负责目录内，再合并
