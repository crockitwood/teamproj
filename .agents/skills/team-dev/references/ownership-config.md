# 配置格式与初始化

## 目录结构

```
.team/
├── members.yaml
├── ownership.yaml
├── audit-log.md
└── me              # 不提交
```

## members.yaml

```yaml
project: 课程项目
lead: zhangsan

members:
  - id: zhangsan
    name: 张三
    email: zhangsan@example.com
    role: lead
  - id: lisi
    name: 李四
    email: lisi@example.com
    role: member
  - id: wangwu
    name: 王五
    email: wangwu@example.com
    role: member
```

字段说明：

| 字段 | 必填 | 说明 |
|---|---|---|
| `project` | 否 | 项目名，仅展示 |
| `lead` | 是 | 队长 id，必须存在于 `members` |
| `members[].id` | 是 | 唯一标识，用于 ownership 和 `.team/me` |
| `members[].name` | 是 | 显示名 |
| `members[].email` | 是 | 与 `git config user.email` 对应 |
| `members[].role` | 否 | `lead` / `member`，默认 `member` |

## ownership.yaml

```yaml
lead_override: true
default_owner: "@lead"

rules:
  - path: "src/modules/user/**"
    owner: lisi
  - path: "src/modules/order/**"
    owner: wangwu
  - path: "src/shared/**"
    owner: "@lead"
  - path: "package.json"
    owner: "@lead"
  - path: ".team/**"
    owner: "@lead"
```

字段说明：

| 字段 | 默认 | 说明 |
|---|---|---|
| `lead_override` | `true` | 队长是否可写任意路径 |
| `default_owner` | `"@lead"` | 无规则命中时的归属 |
| `rules[].path` | 必填 | 仓库根目录为基准的 glob |
| `rules[].owner` | 必填 | 成员 id 或 `@lead` |

## glob 规则

- `*` 匹配单层，`**` 匹配任意层
- 目录写 `dir/**`，单文件写完整相对路径
- 多条规则命中时：**路径最长的胜出**；长度相同取最后一条
- 路径一律相对仓库根目录，不要写绝对路径，不要以 `./` 开头

示例：同时存在 `src/**`（队长）和 `src/modules/user/**`（李四）时，`src/modules/user/login.ts` 归李四。

## 初始化模板（队长执行）

```bash
mkdir -p .team

cat > .team/members.yaml <<'EOF'
project: 课程项目
lead: zhangsan
members:
  - { id: zhangsan, name: 张三, email: zhangsan@example.com, role: lead }
  - { id: lisi, name: 李四, email: lisi@example.com, role: member }
EOF

cat > .team/ownership.yaml <<'EOF'
lead_override: true
default_owner: "@lead"
rules:
  - { path: "src/modules/user/**", owner: lisi }
  - { path: "src/shared/**", owner: "@lead" }
  - { path: ".team/**", owner: "@lead" }
EOF

cat > .team/audit-log.md <<'EOF'
# 队长越界修改记录

| 日期 | 修改人 | 涉及文件 | 原因 | commit |
|---|---|---|---|---|
EOF

printf '.team/me\n' >> .git/info/exclude
```

`.team/me` 写进 `.git/info/exclude` 而不是 `.gitignore`，避免污染团队共享的忽略规则。

## 常见划分方式

```
src/modules/<模块>/**     每个组员一个模块
src/features/<功能>/**    按功能划分
apps/web/**               前端一人
apps/api/**               后端一人
packages/shared/**        队长独占
```

划分原则：

1. 一个目录只属于一个人
2. 公共代码单独放 `shared/`，归队长
3. 划分到「一个人能独立完成并自测」的粒度
4. 不要按文件切分，文件级归属维护成本高、容易冲突
