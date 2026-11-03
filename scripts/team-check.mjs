#!/usr/bin/env node
/**
 * 越界提交检查：把 .team/ownership.yaml 变成可执行的规则。
 *
 * 用法：
 *   node scripts/team-check.mjs                 # 检查暂存区（pre-commit 钩子调用）
 *   node scripts/team-check.mjs src/a.js ...    # 检查指定文件
 */
import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const cwd = process.cwd()

function readTeamFile(name) {
  const path = join(cwd, '.team', name)
  return existsSync(path) ? readFileSync(path, 'utf8') : null
}

function extractField(text, key) {
  const match = text.match(new RegExp(`${key}\\s*:\\s*("([^"]*)"|'([^']*)'|([^,}\\s]+))`))
  if (!match) return null
  return match[2] ?? match[3] ?? match[4] ?? null
}

function parseMembers(text) {
  const members = new Map()
  if (!text) return members
  for (const raw of text.split('\n')) {
    const line = raw.replace(/#.*$/, '')
    if (!line.includes('id:')) continue
    const id = extractField(line, 'id')
    if (!id) continue
    members.set(id, {
      id,
      name: extractField(line, 'name') ?? id,
      email: extractField(line, 'email'),
    })
  }
  return members
}

function parseRules(text) {
  const rules = []
  let pending = null
  for (const raw of text.split('\n')) {
    const line = raw.replace(/#.*$/, '').trim()
    if (!line) continue
    if (!line.startsWith('-')) {
      if (pending) {
        const owner = extractField(line, 'owner')
        if (/^owner\s*:/.test(line) && owner) {
          rules.push({ ...pending, owner })
          pending = null
        }
      }
      continue
    }
    const body = line.replace(/^-\s*/, '')
    if (body.startsWith('{')) {
      const path = extractField(body, 'path')
      const owner = extractField(body, 'owner')
      if (path && owner) rules.push({ path, owner })
      continue
    }
    const path = extractField(body, 'path')
    if (path) pending = { path }
  }
  return rules
}

function globToRegExp(glob) {
  let out = '^'
  for (let i = 0; i < glob.length; i += 1) {
    const char = glob[i]
    if (char === '*') {
      if (glob[i + 1] === '*') {
        out += '.*'
        i += 1
        if (glob[i + 1] === '/') i += 1
      } else {
        out += '[^/]*'
      }
    } else if ('\\^$+.()|{}[]'.includes(char)) {
      out += `\\${char}`
    } else {
      out += char
    }
  }
  return new RegExp(`${out}$`)
}

const ownershipText = readTeamFile('ownership.yaml')
if (!ownershipText) {
  process.exit(0)
}

const membersText = readTeamFile('members.yaml')
const members = parseMembers(membersText)
const lead = membersText?.match(/^lead\s*:\s*"?([^"\s]+)"?/m)?.[1] ?? null
const defaultOwner = ownershipText.match(/^default_owner\s*:\s*"?([^"\s]+)"?/m)?.[1] ?? '@lead'
const leadOverride = /^lead_override\s*:\s*true/m.test(ownershipText)
const rules = parseRules(ownershipText)

function gitConfig(key) {
  try {
    return execSync(`git config ${key}`, { encoding: 'utf8' }).trim()
  } catch {
    return ''
  }
}

const mePath = join(cwd, '.team', 'me')
let actor = (existsSync(mePath) ? readFileSync(mePath, 'utf8').trim() : '') ||
  process.env.TEAM_MEMBER ||
  ''

const gitEmail = gitConfig('user.email')

// 没有 .team/me 时，按 git config user.email 自动识别
if (!actor && gitEmail) {
  const matched = [...members.values()].find(
    (member) => member.email && member.email.toLowerCase() === gitEmail.toLowerCase(),
  )
  actor = matched?.id ?? ''
}

if (!actor) {
  console.error('\n[team-check] 还没声明你是谁，提交被拦截。')
  console.error(`git 邮箱：${gitEmail || '（未配置）'}，在名册里没匹配到成员。`)
  console.error('在对话里认领你的模块，然后执行一次：')
  console.error('  npm run team:claim -- <你的成员id>')
  console.error(`可选 id：${[...members.keys()].join(' / ')}`)
  process.exit(1)
}

if (!members.has(actor)) {
  console.error(`\n[team-check] .team/me 里的 "${actor}" 不在 .team/members.yaml 名册中。`)
  console.error('找队长把你加进名册，或检查 id 是否拼错。')
  process.exit(1)
}

const self = members.get(actor)
if (self.email && gitEmail && self.email !== gitEmail) {
  console.warn(`[team-check] 提醒：git 邮箱 ${gitEmail} 与名册 ${self.email} 不一致，可运行 npm run team:claim 同步。`)
}

function resolveOwner(file) {
  let best = null
  for (const rule of rules) {
    if (!globToRegExp(rule.path).test(file)) continue
    if (!best || rule.path.length >= best.path.length) best = rule
  }
  const owner = best ? best.owner : defaultOwner
  return {
    owner: owner === '@lead' ? lead : owner,
    glob: best ? best.path : '(default_owner)',
  }
}

if (process.argv.includes('--whoami')) {
  const owned = rules
    .filter((rule) => (rule.owner === '@lead' ? lead : rule.owner) === actor)
    .map((rule) => rule.path)
  console.log(`当前身份：${self.name}（${actor}）`)
  console.log(`git 邮箱：${gitEmail || '（未配置）'}`)
  console.log(`负责目录：${owned.length ? owned.join('、') : '（无，找队长确认）'}`)
  console.log(`队长：${lead ?? '未设置'}`)
  process.exit(0)
}

const files = process.argv.slice(2).filter((arg) => !arg.startsWith('-')).length
  ? process.argv.slice(2).filter((arg) => !arg.startsWith('-'))
  : execSync('git diff --cached --name-only --diff-filter=ACMR', { encoding: 'utf8' })
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

if (files.length === 0) process.exit(0)

/** 组员只改自己那一行成员信息时放行（认领身份需要） */
function onlyOwnMemberLine(file) {
  if (file !== '.team/members.yaml' || actor === lead) return false
  try {
    const staged = execSync(`git show :${file}`, { encoding: 'utf8' })
    const head = execSync(`git show HEAD:${file}`, { encoding: 'utf8' })
    const rest = (text) =>
      text
        .split('\n')
        .filter((line) => !new RegExp(`\\bid\\s*:\\s*"?${actor}"?\\b`).test(line))
        .join('\n')
    return rest(staged) === rest(head)
  } catch {
    return false
  }
}

const violations = []
const overrides = []

for (const file of files) {
  const { owner, glob } = resolveOwner(file)
  if (owner === actor) continue
  if (onlyOwnMemberLine(file)) continue
  if (actor === lead && leadOverride) {
    overrides.push({ file, owner })
    continue
  }
  violations.push({ file, owner, glob })
}

if (violations.length) {
  console.error('\n[team-check] 检测到越界修改，已阻止提交：\n')
  for (const item of violations) {
    const person = members.get(item.owner)
    const label = person ? `${person.name}（${person.id}）` : item.owner ?? '未分配'
    console.error(`越界：${item.file}`)
    console.error(`负责人：${label}`)
    console.error(`原因：该路径匹配 ${item.glob}`)
    console.error('建议：联系负责人修改；或由队长临时授权\n')
  }
  console.error(`当前身份：${self.name}（${actor}）`)
  console.error('只提交自己负责目录内的文件（git add 时按目录加，不要 git add -A）。\n')
  process.exit(1)
}

if (overrides.length) {
  console.warn('\n[team-check] 队长越界修改，提交后请在 .team/audit-log.md 补一行记录：')
  for (const item of overrides) console.warn(`  - ${item.file}`)
  console.warn('')
}

console.log(`[team-check] 通过：${self.name}（${actor}），检查了 ${files.length} 个文件。`)
