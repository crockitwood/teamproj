import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatTime, useCollection } from '../../../shared/db.js'
import { useSession } from '../../../shared/session.js'
import { Badge, Button, Card, Empty, Field, Input, PageHeader, Select, Stat } from '../../../shared/ui.jsx'
import { ROLE_LABELS } from '../../auth/api.js'
import { RequireLogin } from '../../auth/guard.jsx'
import {
  CHECKABLE_STATUS,
  activityCode,
  activityStats,
  checkIn,
  formatCode,
  manageableActivities,
  normalizeCode,
  sortForCheckin,
} from '../api.js'
import '../checkin.css'

export default function CheckinPage() {
  return (
    <RequireLogin>
      <CheckinContent />
    </RequireLogin>
  )
}

function CheckinContent() {
  const { user } = useSession()
  const activities = useCollection('activities')
  const registrations = useCollection('registrations')
  const checkins = useCollection('checkins')

  const isStaff = user.role === 'organizer' || user.role === 'admin'
  const managed = sortForCheckin(
    manageableActivities(activities, user).filter((item) => CHECKABLE_STATUS.includes(item.status)),
    registrations,
  )

  const [selectedId, setSelectedId] = useState('')
  const selected = managed.find((item) => item.id === selectedId) ?? managed[0] ?? null

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)

  const myCheckins = checkins
    .filter((item) => item.userId === user.id)
    .sort((a, b) => new Date(b.checkedAt) - new Date(a.checkedAt))

  const stats = selected ? activityStats(selected.id, checkins, registrations) : null

  const activityOf = (activityId) => activities.find((item) => item.id === activityId) ?? null

  function handleCodeChange(event) {
    setCode(normalizeCode(event.target.value))
    setError('')
    setSuccess(null)
  }

  function handleSubmit(event) {
    event.preventDefault()
    const result = checkIn({ code, userId: user.id })
    if (!result.ok) {
      setError(result.error)
      setSuccess(null)
      return
    }
    setError('')
    setSuccess(result)
    setCode('')
  }

  return (
    <div className="stack">
      <PageHeader
        title="现场签到"
        subtitle={
          isStaff
            ? '把本场签到码投到屏幕上，学生输入签到码即可完成签到'
            : '输入现场的 6 位签到码完成签到'
        }
        actions={<Badge tone="info">{ROLE_LABELS[user.role] ?? user.role}</Badge>}
      />

      <div className="ck-layout">
        <Card title="输入签到码">
          <form className="stack" onSubmit={handleSubmit}>
            <Field label="6 位签到码" hint="签到码由主办方在现场公布">
              <div className="ck-code-field">
                <Input
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="000000"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="off"
                />
              </div>
            </Field>
            {error && <p className="ck-msg ck-msg-error">{error}</p>}
            {success && (
              <p className="ck-msg ck-msg-ok">
                签到成功：{success.activity.title} · {formatTime(success.checkin.checkedAt)}
              </p>
            )}
            <Button type="submit">确认签到</Button>
          </form>

          <div className="stack" style={{ gap: 8 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h3>我的签到记录</h3>
              <span className="muted small">共 {myCheckins.length} 条</span>
            </div>
            {myCheckins.length === 0 ? (
              <Empty text="还没有签到记录，现场签到后会出现在这里" />
            ) : (
              <ul className="ck-list">
                {myCheckins.slice(0, 6).map((item) => {
                  const activity = activityOf(item.activityId)
                  return (
                    <li key={item.id}>
                      <div className="ck-list-main">
                        <span className="ck-list-title">{activity?.title ?? '活动已删除'}</span>
                        <span className="ck-list-meta">
                          {activity?.location ?? '地点未知'}
                        </span>
                      </div>
                      <span className="ck-list-meta">{formatTime(item.checkedAt)}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </Card>

        {isStaff && (
          <Card
            title="本场签到码"
            extra={
              <Link className="btn btn-ghost btn-sm" to="/checkin/records">
                签到记录
              </Link>
            }
          >
            {!selected ? (
              <Empty text="暂时没有可签到的活动（活动发布后才会出现）" />
            ) : (
              <div className="stack">
                <Field label="选择活动">
                  <Select value={selected.id} onChange={(event) => setSelectedId(event.target.value)}>
                    {managed.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                  </Select>
                </Field>

                <div className="ck-code">{formatCode(activityCode(selected.id))}</div>
                <p className="ck-code-hint">
                  {selected.location} · {formatTime(selected.startAt)}
                </p>

                <div className="ck-stats">
                  <Stat label="已报名" value={stats.registered.length} />
                  <Stat label="已签到" value={stats.present.length} />
                  <Stat label="签到率" value={`${stats.rate}%`} />
                </div>
                <div className="ck-progress">
                  <span style={{ width: `${stats.rate}%` }} />
                </div>
                {stats.pending.length > 0 && (
                  <p className="muted small">还有 {stats.pending.length} 位已报名同学未签到。</p>
                )}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
