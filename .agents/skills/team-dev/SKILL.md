---
name: team-dev
description: 团队协作开发规范：按目录划分代码所有权，确保每位成员只修改和提交自己负责的部分。当在多人协作、同学分组开发、课程项目、需要明确分工、防止越界修改、处理合并冲突的仓库中工作时使用。
---

# Skill: team-dev

# 团队协作开发规范

把「谁能改哪些代码」变成仓库里可读、可查、可执行的规则。适用于同学分组开发、课程项目、多人 vibe coding。

## 何时使用

- 仓库根目录存在 `.team/ownership.yaml`
- 用户提到「分工」「谁负责哪块」「不要改别人的代码」「合并冲突」「队长 / 组员」
- 多人同时让 AI 改同一个项目

## 核心文件

| 文件 | 作用 | 谁能改 |
|---|---|---|
| `.team/members.yaml` | 成员名册、队长 | 队长 |
| `.team/ownership.yaml` | 目录 → 负责人 | 队长 |
| `.team/audit-log.md` | 队长越界修改记录 | 队长 |
| `.team/me` | 本机身份（成员 id），不提交 | 本人 |

## 每次进入项目的启动检查

按顺序执行，缺一步都不要开始写代码：

1. 检查 `.team/ownership.yaml` 是否存在；不存在则本 skill 不适用，按普通项目处理
2. 读 `members.yaml` 和 `ownership.yaml`
3. 解析当前身份（见下）；解析不出来时，先问用户负责哪个模块，再执行 `npm run team:claim -- <成员id>` 完成认领
4. 向用户复述一句：
   `当前身份：<name>（<id>），负责：<目录列表>；队长：<lead>`
5. 身份无法确定 → 停止并询问用户是哪个成员，**不猜测**

## 身份识别（按优先级）

1. `.team/me` 文件内容（成员 id）
2. 环境变量 `TEAM_MEMBER`
3. `git config user.email` 与 `members.yaml` 中的 email 匹配

三者都失败 → 停止并询问。

认领动作统一用 `npm run team:claim -- <成员id>`（`scripts/team-claim.mjs`）：自动读取
`git config user.name / user.email`，写入 `.team/me`、加入 `.git/info/exclude`，
并更新 `members.yaml` 里自己那一行的 name / email。队员不需要手写 `.team/me`。
`npm run team:whoami` 可随时查看当前身份和负责目录。

## 所有权判定

1. **读**：全仓库可读
2. **写**：只能写 `owner == 自己` 的路径
3. **匹配**：所有命中的 `rules` 中，`path` 最长的一条胜出；长度相同取最后一条；无命中用 `default_owner`
4. `@lead` 解析为 `members.yaml` 里的 `lead`
5. **队长**：`lead_override: true` 时可写任意路径，但必须记 `audit-log.md`
6. `.team/**` 归队长；`.team/me` 例外，本人可写且不得提交

## 硬规则

### MUST

- 改任何文件前，先判定归属
- 提交前自检，越界就停止
- 新建文件放在自己负责的目录内
- 越界时给出负责人和下一步建议

### NEVER

- 使用 `--no-verify` 绕过检查
- 批量格式化、重命名、重构别人负责的目录
- 「顺手」修别人文件里的 typo、注释、格式
- 未经允许修改 `.team/` 下除 `me` 以外的文件
- 在身份不明时开始改代码

## 提交前自检

暂存后逐个核对：

```bash
git diff --cached --name-only
```

任何文件不属于自己 → 停止，不 commit，按「越界输出格式」回复。

推送前核对整个分支：

```bash
git diff --name-only origin/main..HEAD
```

队长审计历史提交：

```bash
git log --format='%h %an <%ae> %s' --name-only
```

逐条核对「提交作者」与「文件归属」是否一致。

## 越界输出格式

固定用这段，方便用户一眼看懂：

```
越界：<file>
负责人：<name>（<id>）
原因：该路径匹配 <glob>
建议：联系负责人修改；或由队长临时授权
```

## 队长越界流程

1. 确认 `ownership.yaml` 中 `lead_override: true`
2. 执行修改
3. 在 `.team/audit-log.md` 追加一行：
   `日期 / 修改人 / 涉及文件 / 原因 / commit`
4. 通知对应负责人

## 分支与提交约定

- 分支：`feat/<成员id>-<模块>-<简述>`
- 提交：`feat(<模块>): <描述>`，footer 写 `Owner: <id>`
- 只有队长把分支合入 `main`

## 参考文件

- `references/ownership-config.md` — 配置格式、glob 规则、初始化模板
- `references/workflow.md` — 队长初始化、组员接入、日常循环、合并与审计
- `references/conflict-playbook.md` — 越界、临时授权、抢同一文件、公共接口变更、合并冲突
