# 团队工作流

## 角色

| 角色 | 职责 |
|---|---|
| 队长 | 建配置、定公共接口、分配目录、review 合并、临时授权、审计 |
| 组员 | 只在自己目录开发、提交前自检、请队长合并 |

## 一、队长初始化（只做一次）

1. 确认所有成员的 `git config user.email`
2. 按 `ownership-config.md` 的模板创建 `.team/`
3. **先写公共接口 / 类型 / 契约**，放在 `src/shared/`，避免组员互相等待
4. 提交：

```bash
git add .team/members.yaml .team/ownership.yaml .team/audit-log.md
git commit -m "chore(team): 初始化团队分工配置"
```

5. 把配置推给所有人，并要求每个组员完成「接入」

## 二、组员接入（每人一次）

```bash
git clone <repo>
cd <repo>

# 1. 确认 git 邮箱与名册一致
git config user.email

# 2. 声明我是谁
echo "<成员id>" > .team/me
printf '.team/me\n' >> .git/info/exclude

# 3. 自检身份
```

接入后让 AI 执行启动检查，确认输出：

```
当前身份：李四（lisi），负责：src/modules/user/**；队长：张三（zhangsan）
```

## 三、日常开发循环

```
拉取最新
  ↓
AI 启动检查（身份 + 负责目录）
  ↓
只在负责目录内改代码
  ↓
提交前自检（git diff --cached --name-only）
  ↓
commit + push
  ↓
请队长 review / 合并
```

每一步的具体命令：

```bash
# 1. 拉取
git pull --rebase

# 2. 开分支
git checkout -b feat/lisi-user-login

# 3. 开发（AI 只在 src/modules/user/** 内改）

# 4. 暂存
git add src/modules/user/

# 5. 自检
git diff --cached --name-only

# 6. 提交
git commit -m "feat(user): 实现登录接口" -m "Owner: lisi"

# 7. 推送
git push -u origin feat/lisi-user-login
```

## 四、队长合并

1. 看 PR / 分支的改动文件是否都在该成员目录内
2. 跑一遍构建或测试
3. 合并到 `main`
4. 有越界但合理 → 先补授权记录，再合并

## 五、队长审计

定期执行：

```bash
git log --format='%h %an <%ae> %s' --name-only
```

核对两件事：

- 提交作者是否等于文件负责人
- 队长越界修改是否都在 `audit-log.md` 里有记录

发现越界且无记录：

1. 在 `audit-log.md` 补记
2. 找当事人确认
3. 必要时调整 ownership 划分

## 六、成员变动

| 场景 | 操作 |
|---|---|
| 新人加入 | 加进 `members.yaml` + 分配目录 + 更新 `.team/me` |
| 成员退出 | 从 `members.yaml` 移除，其目录改派给他人或 `@lead` |
| 换模块 | 改 `ownership.yaml`，双方确认后提交 |
| 临时帮忙 | 队长临时改 owner，完成后改回，并在 audit-log 记录 |

所有 `.team/` 变更都由队长提交，提交信息用 `chore(team): ...`。

## 七、AI 每次会话的固定动作

1. 读 `.team/` 配置，确认身份
2. 复述身份和负责范围
3. 改动前判定归属
4. 提交前自检
5. 越界时按固定格式拒绝并给出负责人
