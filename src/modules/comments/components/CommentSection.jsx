import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatTime, useCollection } from '../../../shared/db.js'
import { useSession } from '../../../shared/session.js'
import { Badge, Button, Empty, Textarea } from '../../../shared/ui.jsx'
import RatingStars from './RatingStars.jsx'
import {
  CONTENT_MAX,
  RATING_MAX,
  findMyComment,
  isCommentable,
  listComments,
  saveComment,
  summarize,
} from '../api.js'
import '../comments.css'

/**
 * 可复用评论区：活动详情页直接 <CommentSection activityId={activity.id} />
 * 只依赖 comments / activities / users 三个集合，不修改其他模块的文件。
 */
export default function CommentSection({ activityId }) {
  const { user } = useSession()
  const comments = useCollection('comments')
  const activities = useCollection('activities')
  const users = useCollection('users')

  const activity = activities.find((item) => item.id === activityId) ?? null
  const activityComments = useMemo(() => listComments(comments, activityId), [comments, activityId])
  const stats = useMemo(() => summarize(activityComments), [activityComments])
  const myComment = findMyComment(activityComments, activityId, user?.id)

  const [draft, setDraft] = useState({
    rating: myComment?.rating ?? 0,
    content: myComment?.content ?? '',
  })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    setDraft({ rating: myComment?.rating ?? 0, content: myComment?.content ?? '' })
  }, [myComment?.id, myComment?.rating, myComment?.content])

  function nameOf(userId) {
    return users.find((item) => item.id === userId)?.name ?? '匿名同学'
  }

  function handleSubmit(event) {
    event.preventDefault()
    const result = saveComment({
      activityId,
      userId: user?.id,
      rating: draft.rating,
      content: draft.content,
    })
    if (!result.ok) {
      setError(result.error)
      setMessage('')
      return
    }
    setError('')
    setMessage(result.created ? '评价已发布' : '评价已更新')
  }

  const commentable = isCommentable(activity)

  return (
    <div className="comment-section">
      <div className="comment-summary">
        <div className="comment-score">
          <strong>{stats.count ? stats.average.toFixed(1) : '—'}</strong>
          <RatingStars value={Math.round(stats.average)} readOnly size="sm" />
          <span className="muted small">
            {stats.count ? `${stats.count} 条评价` : '还没有人评价'}
          </span>
        </div>

        <ul className="score-bars">
          {Array.from({ length: RATING_MAX }, (_, index) => RATING_MAX - index).map((star) => {
            const amount = stats.distribution[star] ?? 0
            const percent = stats.ratedCount ? Math.round((amount / stats.ratedCount) * 100) : 0
            return (
              <li key={star}>
                <span className="score-bar-label">{star} 星</span>
                <span className="score-bar-track">
                  <span className="score-bar-fill" style={{ width: `${percent}%` }} />
                </span>
                <span className="score-bar-count">{amount}</span>
              </li>
            )
          })}
        </ul>
      </div>

      {!activity && <Empty text="选择一个活动后查看评论区" />}

      {activity && !commentable && (
        <p className="comment-notice">这个活动当前状态不支持评价（只对已发布 / 已结束的活动开放）。</p>
      )}

      {activity && commentable && (
        <div className="comment-compose">
          {user ? (
            <form className="stack" onSubmit={handleSubmit}>
              <div className="compose-head">
                <span className="avatar">{user.name.slice(0, 1)}</span>
                <div>
                  <strong>{user.name}</strong>
                  <p className="muted small">
                    {myComment
                      ? '你已经评价过这个活动，保存后会覆盖原评价'
                      : '同一活动只能评价一次，发布后仍可修改'}
                  </p>
                </div>
              </div>

              <RatingStars
                value={draft.rating}
                onChange={(rating) => {
                  setDraft((prev) => ({ ...prev, rating }))
                  setError('')
                  setMessage('')
                }}
              />

              <Textarea
                rows={3}
                maxLength={CONTENT_MAX}
                placeholder="说说真实体验，给后来的同学一点参考"
                value={draft.content}
                onChange={(event) => {
                  setDraft((prev) => ({ ...prev, content: event.target.value }))
                  setError('')
                  setMessage('')
                }}
              />

              <div className="compose-actions">
                <Button type="submit">{myComment ? '更新评价' : '发布评价'}</Button>
                <span className="muted small">
                  {draft.content.length}/{CONTENT_MAX}
                </span>
              </div>

              {error && <p className="comment-hint comment-hint-error">{error}</p>}
              {message && <p className="comment-hint comment-hint-ok">{message}</p>}
            </form>
          ) : (
            <p className="comment-notice">
              评价需要登录，
              <Link className="comment-link" to="/login" state={{ from: '/comments' }}>
                登录后参与评价
              </Link>
              。
            </p>
          )}
        </div>
      )}

      {activity && activityComments.length === 0 && <Empty text="还没有评价，来做第一个吧" />}

      <ul className="comment-list">
        {activityComments.map((item) => (
          <li key={item.id} className="comment-item">
            <span className="avatar">{nameOf(item.userId).slice(0, 1)}</span>
            <div className="comment-body">
              <div className="comment-meta">
                <strong>{nameOf(item.userId)}</strong>
                {item.userId === user?.id && <Badge tone="info">我的评价</Badge>}
                <Badge tone={item.rating <= 2 ? 'warn' : 'neutral'}>{item.rating} 星</Badge>
                <span className="muted small">
                  {formatTime(item.createdAt)}
                  {item.updatedAt ? ' · 已编辑' : ''}
                </span>
              </div>
              <p className="comment-text">{item.content}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
