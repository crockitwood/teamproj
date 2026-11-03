import { db } from '../../shared/db.js'
import { session } from '../../shared/session.js'

/**
 * 账号与权限模块的业务逻辑（负责人：lisi）
 * 只操作 users 集合；其他模块要登录态请用 shared/session.js 与 ./guard.jsx
 */

export const DEFAULT_PASSWORD = '123456'

export const ROLE_LABELS = {
  student: '学生',
  organizer: '主办方',
  admin: '管理员',
}

export const ROLE_DESCRIPTIONS = {
  student: '浏览活动、报名与取消报名、现场签到、评论评分、接收通知',
  organizer: '发布和管理自己的活动、查看报名名单与签到率',
  admin: '审核活动、处理违规评论、查看全站数据看板',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function findByEmail(email) {
  const value = email.trim().toLowerCase()
  return db.all('users').find((user) => user.email.toLowerCase() === value) ?? null
}

export function login({ email, password }) {
  if (!email?.trim() || !password) {
    return { ok: false, error: '请输入邮箱和密码' }
  }
  const user = findByEmail(email)
  if (!user) {
    return { ok: false, error: '该邮箱还没注册，先注册一个账号' }
  }
  const expected = user.password ?? DEFAULT_PASSWORD
  if (password !== expected) {
    return { ok: false, error: '密码不正确' }
  }
  session.login(user.id)
  return { ok: true, user }
}

export function register({ name, email, password, role = 'student' }) {
  const nickname = name.trim()
  const value = email.trim().toLowerCase()

  if (!nickname) return { ok: false, error: '请填写昵称' }
  if (!EMAIL_RE.test(value)) return { ok: false, error: '邮箱格式不正确' }
  if (!password || password.length < 6) return { ok: false, error: '密码至少 6 位' }
  if (!['student', 'organizer'].includes(role)) {
    return { ok: false, error: '管理员账号不开放注册' }
  }
  if (findByEmail(value)) return { ok: false, error: '该邮箱已注册，直接登录' }

  const user = db.insert('users', { name: nickname, email: value, password, role })
  session.login(user.id)
  return { ok: true, user }
}

export function updateProfile(userId, { name, email }) {
  const nickname = name.trim()
  const value = email.trim().toLowerCase()

  if (!nickname) return { ok: false, error: '昵称不能为空' }
  if (!EMAIL_RE.test(value)) return { ok: false, error: '邮箱格式不正确' }

  const duplicated = db
    .all('users')
    .some((user) => user.id !== userId && user.email.toLowerCase() === value)
  if (duplicated) return { ok: false, error: '这个邮箱已经被占用了' }

  db.update('users', userId, { name: nickname, email: value })
  return { ok: true }
}

export function logout() {
  session.logout()
}
