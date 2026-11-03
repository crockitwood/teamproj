import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatTime, useCollection } from '../../../shared/db.js'
import { useSession } from '../../../shared/session.js'
import { Badge, Button, Card, Empty, Field, Modal, PageHeader, Select, Stat } from '../../../shared/ui.jsx'
import { ROLE_LABELS } from '../../auth/api.js'
import { RequireLogin } from '../../auth/guard.jsx'
import { CHECKABLE_STATUS, activityStats, manageableActivities, sortForCheckin, undoCheckin } from '../api.js'
import '../checkin.css'

export default function CheckinRecordsPage() {
  return (
    <RequireLogin>
      <RecordsContent />
    </RequireLogin>
  )
}

function RecordsContent() {
  const { user } = useSession()
  const activities = useCollection('activities')
  const registrations = useCollection('registrations')
  const checkins = useCollection('checkins')
  const users = useCollection('users')

  const isStaff = user.role === 'organizer' || user.role === 'admin'
  const managed = sortForCheckin(
    manageableActivities(activities, user).filter((item) => CHECKABLE_STATUS.includes(item.status)),
    registrations,
  )

  const [selectedId, setSelectedId] = useState('')
  const [tab, setTab] = useState('signed')
  const [undoTarget, setUndoTarget] = useState(null)

  const selected = managed.find((item) => item.id === selectedId) ?? managed[0] ?? null
  const stats = selected ? activityStats(selected.id, checkins, registrations) : null

  const userOf = (userId) => users.find((item) => item.id === userId) ?? null
  const activityOf = (activityId) => activities.find((item) => item.id === activityId) ?? null

  const myCheckins = checkins
    .filter((item) => item.userId === user.id)
    .sort((a, b) => new Date(b.checkedAt) - new Date(a.checkedAt))

  function handleUndo() {
    if (!undoTarget) return
    undoCheckin(undoTarget.id)
    setUndoTarget(null)
  }

  if (!isStaff) {
    return (
      <div className="stack">
        <PageHeader
          title="签到记录"
          subtitle="你参加过的活动签到记录"
          actions={<Badge tone="info">{ROLE_LABELS[user.role] ?? user.role}</Badge>}
        />
        <Card title={`共 ${myCheckins.length} 条签到记录`}>
          {myCheckins.length === 0 ? (
            <Empty text="还没有签到记录" />
          ) : (
            <div className="ck-table-wrap">
              <table className="ck-table">
                <thead>
                  <tr>
                    <th>活动</th>
                    <th>地点</th>
                    <th>活动时间</th>
                    <th>签到时间</th>
                  </tr>
                </thead>
                <tbody>
                  {myCheckins.map((item) => {
                    const activity = activityOf(item.activityId)
                    return (
                      <tr key={item.id}>
                        <td>{activity?.title ?? '活动已删除'}</td>
                        <td className="ck-num">{activity?.location ?? '—'}</td>
                        <td className="ck-num">{activity ? formatTime(activity.startAt) : '—'}</td>
                        <td className="ck-num">{formatTime(item.checkedAt)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="muted small">
            签到请到 <Link className="inline-code" to="/checkin">现场签到</Link> 页输入签到码。
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="stack">
      <PageHeader
        title="签到记录"
        subtitle="查看每场活动的签到率、已签到与未签到名单"
        actions={<Badge tone="info">{ROLE_LABELS[user.role] ?? user.role}</Badge>}
      />

      {!selected ? (
        <Card title="还没有可管理的活动">
          <Empty text="活动发布后，这里会显示它的签到记录" />
        </Card>
      ) : (
        <>
          <Card title="活动概览">
            <div className="grid-2">
              <Field label="选择活动">
                <Select value={selected.id} onChange={(event) => setSelectedId(event.target.value)}>
                  {managed.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="stack" style={{ gap: 8, justifyContent: 'center' }}>
                <div className="ck-stats">
                  <Stat label="已报名" value={stats.registered.length} />
                  <Stat label="已签到" value={stats.present.length} />
                  <Stat label="签到率" value={`${stats.rate}%`} />
                </div>
                <div className="ck-progress">
                  <span style={{ width: `${stats.rate}%` }} />
                </div>
              </div>
            </div>
            <p className="muted small">
              {selected.location} · {formatTime(selected.startAt)}
            </p>
          </Card>

          <Card
            extra={
              <Link className="btn btn-ghost btn-sm" to="/checkin">
                去现场签到
              </Link>
            }
            title="签到明细"
          >
            <div className="ck-tabs">
              <button
                type="button"
                className={`ck-tab ${tab === 'signed' ? 'active' : ''}`}
                onClick={() => setTab('signed')}
              >
                已签到 {stats.present.length}
              </button>
              <button
                type="button"
                className={`ck-tab ${tab === 'pending' ? 'active' : ''}`}
                onClick={() => setTab('pending')}
              >
                未签到 {stats.pending.length}
              </button>
            </div>

            {tab === 'signed' &&
              (stats.present.length === 0 ? (
                <Empty text="还没有人签到" />
              ) : (
                <div className="ck-table-wrap">
                  <table className="ck-table">
                    <thead>
                      <tr>
                        <th>姓名</th>
                        <th>邮箱</th>
                        <th>签到时间</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {stats.present.map((registration) => {
                        const person = userOf(registration.userId)
                        const record = stats.checked.find((item) => item.userId === registration.userId)
                        return (
                          <tr key={registration.id}>
                            <td>{person?.name ?? '未知用户'}</td>
                            <td className="ck-num">{person?.email ?? '—'}</td>
                            <td className="ck-num">{record ? formatTime(record.checkedAt) : '—'}</td>
                            <td style={{ textAlign: 'right' }}>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() =>
                                  setUndoTarget({
                                    ...record,
                                    name: person?.name ?? '该同学',
                                  })
                                }
                              >
                                撤销
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ))}

            {tab === 'pending' &&
              (stats.pending.length === 0 ? (
                <Empty text="所有报名同学都已签到" />
              ) : (
                <div className="ck-table-wrap">
                  <table className="ck-table">
                    <thead>
                      <tr>
                        <th>姓名</th>
                        <th>邮箱</th>
                        <th>报名时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.pending.map((registration) => {
                        const person = userOf(registration.userId)
                        return (
                          <tr key={registration.id}>
                            <td>{person?.name ?? '未知用户'}</td>
                            <td className="ck-num">{person?.email ?? '—'}</td>
                            <td className="ck-num">{formatTime(registration.createdAt)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
          </Card>
        </>
      )}

      <Modal
        open={Boolean(undoTarget)}
        title="撤销签到"
        onClose={() => setUndoTarget(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setUndoTarget(null)}>
              取消
            </Button>
            <Button variant="danger" onClick={handleUndo}>
              确认撤销
            </Button>
          </>
        }
      >
        <p>
          撤销后，{undoTarget?.name} 在「{selected?.title}」上的签到记录会被删除，签到率会同步下降。
        </p>
      </Modal>
    </div>
  )
}
