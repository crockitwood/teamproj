import { db } from '../../shared/db.js'

/**
 * 通知中心业务逻辑（负责人：郑十）
 * 只写 notifications 集合；其他模块需要发通知时，直接 import { notify } from '../notifications/api.js'
 */

export const NOTIFICATION_TYPES = {
  registration: '报名',
  review: '审核',
  checkin: '签到',
  comment: '评论',
  system: '系统',
}

/**
 * 给某个用户写入一条站内通知（供其他模块调用）
 * 用法：notify(user.id, '报名成功', '你已成功报名「XXX」。', 'registration')
 * @param {string} userId 接收人
 * @param {string} title 标题
 * @param {string} body 正文
 * @param {keyof NOTIFICATION_TYPES} [type='system'] 通知类型
 */
export function notify(userId, title, body, type = 'system') {
  if (!userId || !title?.trim()) return null
  return db.insert('notifications', {
    userId,
    type: NOTIFICATION_TYPES[type] ? type : 'system',
    title: title.trim(),
    body: (body ?? '').trim(),
    read: false,
  })
}

/** 某个用户的通知，按时间倒序 */
export function listByUser(userId) {
  return db
    .all('notifications')
    .filter((item) => item.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

/** 某个用户的未读条数 */
export function unreadCount(userId) {
  return db.all('notifications').filter((item) => item.userId === userId && !item.read).length
}

/** 把一条通知标为已读 */
export function markRead(id) {
  return db.update('notifications', id, { read: true })
}

/** 把某个用户的通知全部标为已读，返回更新条数 */
export function markAllRead(userId) {
  const unread = db
    .all('notifications')
    .filter((item) => item.userId === userId && !item.read)
  unread.forEach((item) => db.update('notifications', item.id, { read: true }))
  return unread.length
}

/** 删除一条通知 */
export function removeNotification(id) {
  return db.remove('notifications', id)
}
