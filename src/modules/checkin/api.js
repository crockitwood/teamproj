import { db } from '../../shared/db.js'

/**
 * 签到核销模块业务逻辑（负责人：周八 zhouba）
 * 只写 checkins 集合；activities / registrations / users 只读。
 */

/** 可以签到 / 核销的活动状态 */
export const CHECKABLE_STATUS = ['published', 'ended']

/**
 * 6 位签到码：由活动 id 推导，不需要额外存储。
 * 同一个活动在任何设备上算出来都一样，现场报码即可核对。
 */
export function activityCode(activityId) {
  if (!activityId) return ''
  const source = `campus-events:checkin:${activityId}`
  let hash = 2166136261
  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return String((hash >>> 0) % 1000000).padStart(6, '0')
}

/** 只保留 6 位数字，输入框可以直接喂原始值 */
export function normalizeCode(value) {
  return String(value ?? '').replace(/\D/g, '').slice(0, 6)
}

/** 展示用：123456 → 123 456 */
export function formatCode(code) {
  const value = normalizeCode(code)
  return value.length === 6 ? `${value.slice(0, 3)} ${value.slice(3)}` : value
}

/** 当前用户能管理（展示签到码 / 看签到记录）的活动 */
export function manageableActivities(activities, user) {
  if (!user) return []
  if (user.role === 'admin') return [...activities]
  if (user.role === 'organizer') return activities.filter((item) => item.organizerId === user.id)
  return []
}

/** 按签到码找到当前可签到的活动 */
export function findActivityByCode(code) {
  const value = normalizeCode(code)
  if (value.length !== 6) return null
  return (
    db
      .all('activities')
      .find((item) => activityCode(item.id) === value && CHECKABLE_STATUS.includes(item.status)) ?? null
  )
}

/** 某人在某活动上的报名记录 */
export function findRegistration(activityId, userId) {
  return (
    db.all('registrations').find((item) => item.activityId === activityId && item.userId === userId) ?? null
  )
}

/** 某人在某活动上是否已经签到过 */
export function findCheckin(activityId, userId) {
  return (
    db.all('checkins').find((item) => item.activityId === activityId && item.userId === userId) ?? null
  )
}

/**
 * 输入签到码签到。所有校验都在这里，页面只负责展示结果。
 * 返回 { ok: true, activity, checkin } 或 { ok: false, error, activity?, checkin? }
 */
export function checkIn({ code, userId }) {
  const value = normalizeCode(code)
  if (value.length !== 6) return { ok: false, error: '请输入 6 位数字签到码' }

  const activity = findActivityByCode(value)
  if (!activity) return { ok: false, error: '签到码无效，或该活动当前不可签到' }

  const registration = findRegistration(activity.id, userId)
  if (!registration) {
    return { ok: false, error: `你还没有报名「${activity.title}」，请先报名再来签到` }
  }
  if (registration.status === 'waitlist') {
    return { ok: false, error: '你的报名还在候补中，转正后才能签到' }
  }
  if (registration.status === 'cancelled') {
    return { ok: false, error: '你的报名已取消，重新报名后才能签到' }
  }

  const existing = findCheckin(activity.id, userId)
  if (existing) {
    return {
      ok: false,
      error: `你在 ${formatDateTime(existing.checkedAt)} 已经签到过了`,
      activity,
      checkin: existing,
    }
  }

  const checkin = db.insert('checkins', {
    activityId: activity.id,
    userId,
    checkedAt: new Date().toISOString(),
  })
  return { ok: true, activity, checkin }
}

/** 撤销一条签到记录（现场补签错了可以撤） */
export function undoCheckin(checkinId) {
  return db.remove('checkins', checkinId)
}

/**
 * 一个活动的签到情况：已报名名单、已签到名单、未签到名单、签到率。
 * activities 相关数组从页面的 useCollection 传进来，保证数据变化后重新计算。
 */
export function activityStats(activityId, checkins, registrations) {
  const registered = registrations
    .filter((item) => item.activityId === activityId && item.status === 'confirmed')
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  const checked = checkins
    .filter((item) => item.activityId === activityId)
    .sort((a, b) => new Date(b.checkedAt) - new Date(a.checkedAt))

  const checkedIds = new Set(checked.map((item) => item.userId))
  const present = registered.filter((item) => checkedIds.has(item.userId))
  const pending = registered.filter((item) => !checkedIds.has(item.userId))
  const rate = registered.length ? Math.round((present.length / registered.length) * 100) : 0

  return { registered, checked, present, pending, rate }
}

function formatDateTime(iso) {
  const date = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getMonth() + 1}月${date.getDate()}日 ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
