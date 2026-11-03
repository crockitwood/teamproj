import { useState } from 'react'
import { formatTime, useCollection } from '../../../shared/db.js'
import { useSession } from '../../../shared/session.js'
import { Badge, Button, Card, Empty, PageHeader } from '../../../shared/ui.jsx'
import { RequireLogin } from '../../auth/guard.jsx'
import {
  NOTIFICATION_TYPES,
  markAllRead,
  markRead,
  notify,
  removeNotification,
} from '../api.js'
import '../notifications.css'

const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'unread', label: '未读' },
  { key: 'read', label: '已读' },
]

const TYPE_TONES = {
  registration: 'ok',
  review: 'info',
  checkin: 'info',
  comment: 'warn',
  system: 'neutral',
}

export default function NotificationsPage() {
  return (
    <RequireLogin>
      <NotificationsContent />
    </RequireLogin>
  )
}

function NotificationsContent() {
  const { user } = useSession()
  const notifications = useCollection('notifications')
  const [filter, setFilter] = useState('all')

  const mine = notifications
    .filter((item) => item.userId === user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const unread = mine.filter((item) => !item.read).length
  const visible = mine.filter((item) => {
    if (filter === 'unread') return !item.read
    if (filter === 'read') return item.read
    return true
  })

  function handleOpen(item) {
    if (!item.read) markRead(item.id)
  }

  return (
    <div className="stack">
      <PageHeader
        title="通知中心"
        subtitle={`共 ${mine.length} 条通知 · 未读 ${unread} 条`}
        actions={
          <Button
            variant="secondary"
            disabled={unread === 0}
            onClick={() => markAllRead(user.id)}
          >
            全部已读
          </Button>
        }
      />

      <Card>
        <div className="nt-toolbar">
          <div className="nt-tabs">
            {FILTERS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`nt-tab ${filter === tab.key ? 'active' : ''}`}
                onClick={() => setFilter(tab.key)}
              >
                {tab.label}
                {tab.key === 'unread' && unread > 0 && <span className="nt-tab-count">{unread}</span>}
              </button>
            ))}
          </div>
          <span className="muted small">点击未读通知会自动标为已读</span>
        </div>

        {visible.length === 0 ? (
          <Empty text={filter === 'unread' ? '没有未读通知，全部处理完了' : '暂无通知'} />
        ) : (
          <div className="nt-list">
            {visible.map((item) => (
              <article key={item.id} className={`nt-item ${item.read ? 'is-read' : 'is-unread'}`}>
                <span className={`nt-dot ${item.read ? 'is-read' : ''}`} aria-hidden="true" />
                <button type="button" className="nt-main" onClick={() => handleOpen(item)}>
                  <span className="nt-title">{item.title}</span>
                  {item.body && <span className="nt-body">{item.body}</span>}
                  <span className="nt-meta">
                    <Badge tone={TYPE_TONES[item.type] ?? 'neutral'}>
                      {NOTIFICATION_TYPES[item.type] ?? item.type}
                    </Badge>
                    <span>{formatTime(item.createdAt)}</span>
                  </span>
                </button>
                <div className="nt-actions">
                  {!item.read && (
                    <Button variant="ghost" size="sm" onClick={() => markRead(item.id)}>
                      标为已读
                    </Button>
                  )}
                  <Button variant="danger" size="sm" onClick={() => removeNotification(item.id)}>
                    删除
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>

      <Card
        title="接口自测"
        extra={<Badge tone="neutral">开发辅助</Badge>}
      >
        <p className="muted small">
          其他模块接入时调用 <code className="inline-code">notify(userId, title, body, type)</code>，
          例如报名成功后写入一条「报名」通知。这里给自己发一条测试通知，验证接口是否正常。
        </p>
        <div className="row gap-8">
          <Button
            variant="secondary"
            onClick={() =>
              notify(user.id, '测试通知', '这是一条来自通知中心接口自测的消息。', 'system')
            }
          >
            给我发一条测试通知
          </Button>
        </div>
      </Card>
    </div>
  )
}
