import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCollection } from '../../../shared/db.js'
import { useSession } from '../../../shared/session.js'
import { Badge, Card, Empty, PageHeader, Select, Stat } from '../../../shared/ui.jsx'
import CommentSection from '../components/CommentSection.jsx'
import { COMMENTABLE_STATUS, canModerate, listComments, summarize } from '../api.js'
import '../comments.css'

export default function CommentsPage() {
  const { user } = useSession()
  const activities = useCollection('activities')
  const comments = useCollection('comments')

  const options = useMemo(
    () => activities.filter((item) => COMMENTABLE_STATUS.includes(item.status)),
    [activities],
  )
  const [activityId, setActivityId] = useState(options[0]?.id ?? '')

  useEffect(() => {
    if (!options.some((item) => item.id === activityId)) {
      setActivityId(options[0]?.id ?? '')
    }
  }, [options, activityId])

  const activity = options.find((item) => item.id === activityId) ?? null
  const stats = summarize(listComments(comments, activityId))
  const myComments = comments.filter((item) => item.userId === user?.id)

  return (
    <div className="stack">
      <PageHeader
        title="评论管理"
        subtitle="按活动查看评分与评价，同一活动每人只能评价一次，发布后可修改"
        actions={
          canModerate(user) ? (
            <Link className="btn btn-secondary btn-sm" to="/comments/moderate">
              去处理违规评论
            </Link>
          ) : (
            <Badge tone="info">评分 1-5 星</Badge>
          )
        }
      />

      <Card
        title="选择活动"
        extra={
          activity ? (
            <Badge tone={activity.status === 'ended' ? 'neutral' : 'ok'}>
              {activity.status === 'ended' ? '已结束' : '已发布'}
            </Badge>
          ) : null
        }
      >
        {options.length === 0 ? (
          <Empty text="还没有可以评价的活动，等「活动发布」模块上线后再来" />
        ) : (
          <>
            <Select value={activityId} onChange={(event) => setActivityId(event.target.value)}>
              {options.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </Select>

            {activity && (
              <p className="muted small">
                {activity.category} · {activity.location}
              </p>
            )}

            <div className="comment-stats">
              <Stat label="平均分" value={stats.count ? stats.average.toFixed(1) : '—'} hint="满分 5 分" />
              <Stat label="本活动评价" value={stats.count} hint="含各星级" />
              <Stat label="我的评价" value={myComments.length} hint="累计参与" />
            </div>
          </>
        )}
      </Card>

      <Card title={activity ? `「${activity.title}」的评论区` : '评论区'}>
        <CommentSection activityId={activityId} />
      </Card>

      {!user && (
        <Card>
          <p className="muted small">
            当前未登录，只能浏览评价。
            <Link className="comment-link" to="/login" state={{ from: '/comments' }}>
              去登录
            </Link>
          </p>
        </Card>
      )}

      {user && !canModerate(user) && (
        <Card>
          <p className="muted small">
            违规评论由管理员在
            <Link className="comment-link" to="/comments/moderate">「违规处理」</Link>
            页面统一删除；你随时可以修改自己的评价。
          </p>
        </Card>
      )}
    </div>
  )
}
