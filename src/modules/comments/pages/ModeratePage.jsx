import { useMemo, useState } from 'react'
import { RequireRole } from '../../auth/guard.jsx'
import { formatTime, useCollection } from '../../../shared/db.js'
import { useSession } from '../../../shared/session.js'
import {
  Badge,
  Button,
  Card,
  Empty,
  Input,
  Modal,
  PageHeader,
  Select,
  Stat,
} from '../../../shared/ui.jsx'
import { deleteComment } from '../api.js'
import '../comments.css'

const FILTERS = [
  { value: 'all', label: '全部评论' },
  { value: 'low', label: '低分评论（≤ 2 星）' },
  { value: 'long', label: '长评论（≥ 100 字）' },
]

function ModerateContent() {
  const { user } = useSession()
  const comments = useCollection('comments')
  const activities = useCollection('activities')
  const users = useCollection('users')

  const [keyword, setKeyword] = useState('')
  const [filter, setFilter] = useState('all')
  const [target, setTarget] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const titleOf = (activityId) =>
    activities.find((item) => item.id === activityId)?.title ?? '（活动已删除）'
  const nameOf = (userId) => users.find((item) => item.id === userId)?.name ?? '匿名同学'

  const rows = useMemo(() => {
    const text = keyword.trim()
    return comments
      .filter((item) => {
        if (filter === 'low' && item.rating > 2) return false
        if (filter === 'long' && item.content.length < 100) return false
        if (!text) return true
        return (
          item.content.includes(text) ||
          nameOf(item.userId).includes(text) ||
          titleOf(item.activityId).includes(text)
        )
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [comments, activities, users, keyword, filter])

  const lowCount = comments.filter((item) => item.rating <= 2).length
  const activityCount = new Set(comments.map((item) => item.activityId)).size

  function handleDelete() {
    if (!target) return
    const result = deleteComment({ commentId: target.id, user })
    if (!result.ok) {
      setError(result.error)
      return
    }
    setError('')
    setMessage(`已删除 ${nameOf(target.userId)} 对「${titleOf(target.activityId)}」的评价`)
    setTarget(null)
  }

  return (
    <div className="stack">
      <PageHeader
        title="违规处理"
        subtitle="管理员处理不友善、广告或与活动无关的评价，删除后不可恢复"
        actions={<Badge tone="danger">仅管理员可见</Badge>}
      />

      <Card title="筛选">
        <div className="moderate-filters">
          <Input
            placeholder="搜索评价内容 / 评价人 / 活动名"
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value)
              setError('')
            }}
          />
          <Select value={filter} onChange={(event) => setFilter(event.target.value)}>
            {FILTERS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="comment-stats">
          <Stat label="全部评论" value={comments.length} hint="全站" />
          <Stat label="低分评论" value={lowCount} hint="≤ 2 星" />
          <Stat label="涉及活动" value={activityCount} hint="有评价的活动" />
        </div>
      </Card>

      {error && <p className="comment-hint comment-hint-error">{error}</p>}
      {message && <p className="comment-hint comment-hint-ok">{message}</p>}

      <Card title={`待处理列表（${rows.length}）`} extra={<span className="muted small">按时间倒序</span>}>
        {rows.length === 0 ? (
          <Empty text="没有匹配的评论" />
        ) : (
          <ul className="moderate-list">
            {rows.map((item) => (
              <li key={item.id} className="moderate-item">
                <div className="moderate-main">
                  <div className="comment-meta">
                    <strong>{nameOf(item.userId)}</strong>
                    <Badge tone={item.rating <= 2 ? 'warn' : 'neutral'}>{item.rating} 星</Badge>
                    <span className="muted small">{titleOf(item.activityId)}</span>
                    <span className="muted small">
                      {formatTime(item.createdAt)}
                      {item.updatedAt ? ' · 已编辑' : ''}
                    </span>
                  </div>
                  <p className="comment-text">{item.content}</p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setTarget(item)
                    setError('')
                    setMessage('')
                  }}
                >
                  删除
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={Boolean(target)}
        title="删除这条评论？"
        onClose={() => setTarget(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setTarget(null)}>
              取消
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              确认删除
            </Button>
          </>
        }
      >
        {target && (
          <>
            <p className="muted small">
              {nameOf(target.userId)} · {target.rating} 星 · {titleOf(target.activityId)}
            </p>
            <p>{target.content}</p>
            <p className="muted small">删除后该同学可以重新评价，操作不可撤销。</p>
          </>
        )}
      </Modal>
    </div>
  )
}

export default function ModeratePage() {
  return (
    <RequireRole roles={['admin']}>
      <ModerateContent />
    </RequireRole>
  )
}
