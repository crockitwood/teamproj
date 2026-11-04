import { db } from '../../shared/db.js'

/**
 * 评论评分模块业务逻辑（负责人：wujiu）
 * 只写 comments 集合；activities / users 只读。
 * 页面和组件都走这里，不要直接调用 db.insert('comments', ...)。
 */

export const RATING_MIN = 1
export const RATING_MAX = 5
export const CONTENT_MAX = 200

/** 只有已发布 / 已结束的活动可以评价 */
export const COMMENTABLE_STATUS = ['published', 'ended']

const STATUS_HINTS = {
  draft: '活动还是草稿，发布后才能评价',
  pending: '活动正在审核中，通过后才能评价',
  rejected: '活动未通过审核，暂不支持评价',
}

/** 把任意输入归一化成 1-5 的整数评分，非法返回 0 */
export function normalizeRating(value) {
  const rating = Number(value)
  return Number.isInteger(rating) && rating >= RATING_MIN && rating <= RATING_MAX ? rating : 0
}

export function isCommentable(activity) {
  return Boolean(activity) && COMMENTABLE_STATUS.includes(activity.status)
}

/** 按时间倒序返回某个活动的评论 */
export function listComments(comments, activityId) {
  return comments
    .filter((item) => item.activityId === activityId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

/** 同一活动同一人只允许一条评价 */
export function findMyComment(comments, activityId, userId) {
  if (!userId) return null
  return comments.find((item) => item.activityId === activityId && item.userId === userId) ?? null
}

/** 平均分、评论数、各星级分布 */
export function summarize(comments = []) {
  const distribution = {}
  for (let star = RATING_MIN; star <= RATING_MAX; star += 1) distribution[star] = 0

  let ratedCount = 0
  let total = 0
  for (const item of comments) {
    const rating = normalizeRating(item.rating)
    if (!rating) continue
    distribution[rating] += 1
    total += rating
    ratedCount += 1
  }

  return {
    count: comments.length,
    ratedCount,
    average: ratedCount ? Math.round((total / ratedCount) * 10) / 10 : 0,
    distribution,
  }
}

function validate({ user, activity, rating, content }) {
  if (!user) return '请先登录再评价'
  if (!activity) return '活动不存在或已被删除'
  if (!isCommentable(activity)) {
    return STATUS_HINTS[activity.status] ?? '这个活动暂时不能评价'
  }
  if (!normalizeRating(rating)) return `请选择 ${RATING_MIN}-${RATING_MAX} 星评分`
  if (!content.trim()) return '请写点评价内容，方便其他同学参考'
  if (content.trim().length > CONTENT_MAX) return `评价内容最多 ${CONTENT_MAX} 字`
  return ''
}

/**
 * 新建或更新自己对某个活动的评价。
 * 已有评价时是更新（保留 id 与 createdAt，追加 updatedAt）。
 * @returns {{ ok: boolean, error?: string, comment?: object, created?: boolean }}
 */
export function saveComment({ activityId, userId, rating, content }) {
  const user = userId ? db.find('users', userId) : null
  const activity = activityId ? db.find('activities', activityId) : null
  const value = String(content ?? '')

  const error = validate({ user, activity, rating, content: value })
  if (error) return { ok: false, error }

  const payload = {
    activityId,
    userId,
    rating: normalizeRating(rating),
    content: value.trim(),
  }

  const existed = findMyComment(db.all('comments'), activityId, userId)
  if (existed) {
    const comment = db.update('comments', existed.id, { ...payload, updatedAt: new Date().toISOString() })
    return { ok: true, comment, created: false }
  }

  const comment = db.insert('comments', payload)
  return { ok: true, comment, created: true }
}

/**
 * 管理员删除违规评论。
 * @returns {{ ok: boolean, error?: string }}
 */
export function deleteComment({ commentId, user }) {
  if (!user) return { ok: false, error: '请先登录' }
  if (!canModerate(user)) return { ok: false, error: '只有管理员可以删除评论' }

  const comment = db.find('comments', commentId)
  if (!comment) return { ok: false, error: '评论不存在或已被删除' }

  db.remove('comments', commentId)
  return { ok: true }
}

export function canModerate(user) {
  return user?.role === 'admin'
}
