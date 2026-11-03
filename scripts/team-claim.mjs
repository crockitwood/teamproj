#!/usr/bin/env node
/**
 * 认领身份：队员拉取代码后运行一次，之后再提交就能被钩子正确识别。
 *
 * 用法：
 *   npm run team:claim -- lisi          # 认领 lisi 这个身份
 *   npm run team:claim                  # 不填则按 git config user.email 自动匹配
 *
 * 做的事情：
 *   1. 读取 git config user.name / user.email
 *   2. 校验身份在 .team/members.yaml 名册里
 *   3. 写入 .team/me（本机身份，不提交）
 *   4. 把 .team/me 加进 .git/info/exclude
 *   5. 用真实 git 信息更新名册里自己那一行（name / email）
 */
import { execSync } from 'node:child_process'
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const cwd = process.cwd()
const teamDir = join(cwd, '.team')
const membersPath = join(teamDir, 'members.yaml')
const ownershipPath = join(teamDir, 'ownership.yaml')
const mePath = join(teamDir, 'me')
const excludePath = join(cwd, '.git', 'info', 'exclude')

function gitConfig(key) {
  try {
    return execSync(`git config ${key}`, { encoding: 'utf8' }).trim()
  } catch {
    return ''
  }
}

function extractField(text, key) {
  const match = text.match(new RegExp(`${key}\\s*:\\s*("([^"]*)"|'([^']*)'|([^,}\\s]+))`))
  if (!match) return null
  return match[2] ?? match[3] ?? match[4] ?? null
}

function fail(lines) {
  console.error(`\n[team-claim] ${lines[0]}`)
  for (const line of lines.slice(1)) console.error(line)
  console.error('')
  process.exit(1)
}

if (!existsSync(membersPath)) {
  fail(['找不到 .team/members.yaml。', '这个仓库没有团队分工配置，或者你不在仓库根目录。'])
}

const membersText = readFileSync(membersPath, 'utf8')
const lead = membersText.match(/^lead\s*:\s*"?([^"\s]+)"?/m)?.[1] ?? null

const members = new Map()
for (const raw of membersText.split('\n')) {
  const line = raw.replace(/#.*$/, '')
  if (!line.includes('id:')) continue
  const id = extractField(line, 'id')
  if (!id) continue
  members.set(id, { id, name: extractField(line, 'name') ?? id, email: extractField(line, 'email') })
}

const gitName = gitConfig('user.name')
const gitEmail = gitConfig('user.email')
const requested = process.argv.slice(2).find((arg) => !arg.startsWith('-'))

if (!gitName || !gitEmail) {
  fail([
    '还没配置 git 身份，无法自动识别。',
    '先执行：',
    '  git config --global user.name "你的名字"',
    '  git config --global user.email "你的邮箱"',
  ])
}

let actor = requested
if (actor && !members.has(actor)) {
  fail([
    `名册里没有 "${actor}"。`,
    `可选 id：${[...members.keys()].join(' / ')}`,
    '如果确实是你，找队长把你加进 .team/members.yaml。',
  ])
}

const byEmail = [...members.values()].find(
  (member) => member.email && member.email.toLowerCase() === gitEmail.toLowerCase(),
)

if (!actor) {
  if (byEmail) {
    actor = byEmail.id
  } else {
    fail([
      `git 邮箱 ${gitEmail} 不在名册里。`,
      '在对话里告诉 AI 你负责哪个模块，然后指定身份认领，例如：',
      '  npm run team:claim -- wangwu',
      `可选 id：${[...members.keys()].join(' / ')}`,
    ])
  }
}

const other = byEmail && byEmail.id !== actor ? byEmail : null
if (other) {
  fail([
    `git 邮箱 ${gitEmail} 已经对应名册里的 ${other.name}（${other.id}）。`,
    `如果那才是你，直接运行：npm run team:claim -- ${other.id}`,
  ])
}

const me = members.get(actor)

// 1. 写入本机身份
writeFileSync(mePath, `${actor}\n`)

// 2. 保证 .team/me 不被提交
if (existsSync(excludePath)) {
  const exclude = readFileSync(excludePath, 'utf8')
  if (!exclude.split('\n').some((line) => line.trim() === '.team/me')) {
    appendFileSync(excludePath, `${exclude.endsWith('\n') ? '' : '\n'}.team/me\n`)
  }
}

// 3. 用真实 git 信息更新名册里自己那一行
const quote = (value) => (/[,{}\s]/.test(value) ? `"${value}"` : value)
let updated = membersText
if (me.name !== gitName || me.email !== gitEmail) {
  updated = membersText
    .split('\n')
    .map((line) => {
      if (!line.includes('id:') || extractField(line, 'id') !== actor) return line
      return line
        .replace(/(name\s*:\s*)("([^"]*)"|'([^']*)'|[^,}\s]+)/, `$1${quote(gitName)}`)
        .replace(/(email\s*:\s*)("([^"]*)"|'([^']*)'|[^,}\s]+)/, `$1${quote(gitEmail)}`)
    })
    .join('\n')
  writeFileSync(membersPath, updated)
}

// 4. 打印自己负责的目录
const owned = []
if (existsSync(ownershipPath)) {
  for (const line of readFileSync(ownershipPath, 'utf8').split('\n')) {
    if (!line.includes('path:') || !line.includes('owner:')) continue
    const path = extractField(line, 'path')
    const owner = extractField(line, 'owner')
    const resolved = owner === '@lead' ? lead : owner
    if (resolved === actor) owned.push(path)
  }
}

console.log(`\n[team-claim] 认领成功`)
console.log(`当前身份：${gitName}（${actor}）`)
console.log(`git 邮箱：${gitEmail}`)
console.log(`负责目录：${owned.length ? owned.join('、') : '（名册里没有分配目录，找队长确认）'}`)
console.log(`队长：${lead ?? '未设置'}`)
console.log(`本机身份已写入 .team/me（不会提交）。${me.email !== gitEmail ? '名册里的 name / email 已同步为你的 git 配置。' : ''}`)
console.log('下一步：git checkout -b feat/' + actor + '-<模块>-<简述>，只改自己目录里的代码。\n')
