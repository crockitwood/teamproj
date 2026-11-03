import { useSyncExternalStore } from 'react'

/**
 * 共享数据层（队长维护，组员只读代码、按约定读写集合）
 *
 * 约定：
 * - 每个模块只写自己负责的集合，读可以读任意集合
 * - 集合归属见 src/modules/<模块>/index.js 里的 collections 字段
 */

export const COLLECTIONS = {
  users: 'users',
  activities: 'activities',
  registrations: 'registrations',
  checkins: 'checkins',
  comments: 'comments',
  notifications: 'notifications',
}

const STORAGE_KEY = 'campus-events:db:v1'
const listeners = new Set()
let cache = null

function daysFromNow(days, hour = 19) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

const seed = {
  users: [
    { id: 'u_student', name: '林同学', email: 'student@campus.edu', role: 'student', password: '123456' },
    { id: 'u_organizer', name: '社团小周', email: 'organizer@campus.edu', role: 'organizer', password: '123456' },
    { id: 'u_admin', name: '教务处老师', email: 'admin@campus.edu', role: 'admin', password: '123456' },
  ],
  activities: [
    {
      id: 'a_001',
      title: '校园歌手大赛初赛',
      category: '文艺',
      location: '大学生活动中心 301',
      startAt: daysFromNow(3),
      capacity: 120,
      organizerId: 'u_organizer',
      status: 'published',
      description: '面向全校学生的歌唱比赛初赛，现场评委打分。',
      createdAt: daysFromNow(-6),
    },
    {
      id: 'a_002',
      title: '周末公益跑',
      category: '体育',
      location: '操场东门',
      startAt: daysFromNow(5, 8),
      capacity: 60,
      organizerId: 'u_organizer',
      status: 'published',
      description: '五公里公益跑，完赛可获纪念徽章。',
      createdAt: daysFromNow(-4),
    },
    {
      id: 'a_003',
      title: 'AI 应用分享会',
      category: '讲座',
      location: '图书馆报告厅',
      startAt: daysFromNow(8),
      capacity: 80,
      organizerId: 'u_organizer',
      status: 'pending',
      description: '邀请学长分享 AI 项目落地经验。',
      createdAt: daysFromNow(-1),
    },
  ],
  registrations: [
    { id: 'r_001', activityId: 'a_001', userId: 'u_student', status: 'confirmed', createdAt: daysFromNow(-2) },
  ],
  checkins: [
    { id: 'c_001', activityId: 'a_001', userId: 'u_student', checkedAt: daysFromNow(-1) },
  ],
  comments: [
    { id: 'm_001', activityId: 'a_001', userId: 'u_student', rating: 5, content: '组织得挺顺畅，期待决赛。', createdAt: daysFromNow(-1) },
  ],
  notifications: [
    {
      id: 'n_001',
      userId: 'u_student',
      type: 'registration',
      title: '报名成功',
      body: '你已成功报名「校园歌手大赛初赛」。',
      read: false,
      createdAt: daysFromNow(-2),
    },
  ],
}

function load() {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      cache = JSON.parse(raw)
      return cache
    }
  } catch {
    // 数据损坏时回落到种子数据
  }
  cache = JSON.parse(JSON.stringify(seed))
  persist()
  return cache
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  listeners.forEach((fn) => fn())
}

function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function nextId(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export const db = {
  all(collection) {
    return load()[collection] ?? []
  },
  find(collection, id) {
    return (load()[collection] ?? []).find((item) => item.id === id) ?? null
  },
  insert(collection, row) {
    const item = {
      id: nextId(collection.slice(0, 1)),
      createdAt: new Date().toISOString(),
      ...row,
    }
    load()[collection].push(item)
    persist()
    return item
  },
  update(collection, id, patch) {
    const list = load()[collection] ?? []
    const index = list.findIndex((item) => item.id === id)
    if (index === -1) return null
    list[index] = { ...list[index], ...patch }
    persist()
    return list[index]
  },
  remove(collection, id) {
    const list = load()[collection] ?? []
    const index = list.findIndex((item) => item.id === id)
    if (index === -1) return false
    list.splice(index, 1)
    persist()
    return true
  },
  reset() {
    localStorage.removeItem(STORAGE_KEY)
    cache = null
    load()
  },
}

/** 订阅某个集合，数据变更后组件自动刷新 */
export function useCollection(collection) {
  return useSyncExternalStore(subscribe, () => load()[collection] ?? [])
}

export function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
