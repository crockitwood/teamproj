import { Link } from 'react-router-dom'
import { db } from '../shared/db.js'
import { useSession } from '../shared/session.js'
import { Badge, Button, Card, PageHeader } from '../shared/ui.jsx'

export default function HomePage({ modules }) {
  const { user } = useSession()

  return (
    <div className="stack">
      <PageHeader
        title="校园活动报名平台"
        subtitle="8 个功能模块 · 一人一目录 · 通过公共数据层协作"
        actions={
          <>
            <Link className="btn btn-secondary btn-md" to="/login">
              切换身份
            </Link>
            <Button variant="ghost" onClick={() => db.reset()}>
              重置演示数据
            </Button>
          </>
        }
      />

      <Card>
        <div className="hero">
          <div>
            <h2>当前身份：{user ? user.name : '未登录'}</h2>
            <p className="muted">
              {user
                ? `角色 ${user.role}，可以体验其他组员已经做好的页面。`
                : '先到「账号与权限」模块登录，才能报名、签到和查看通知。'}
            </p>
          </div>
          <Badge tone="info">{user ? user.role : 'guest'}</Badge>
        </div>
      </Card>

      <div className="module-grid">
        {modules.map((mod) => (
          <Link key={mod.key} to={mod.routes[0].path} className="module-card">
            <div className="module-card-head">
              <span className="module-index">{String(mod.order).padStart(2, '0')}</span>
              <Badge tone={mod.owner === 'lijiatong' ? 'info' : 'neutral'}>{mod.ownerName}</Badge>
            </div>
            <h3>{mod.title}</h3>
            <p className="muted small">{mod.summary}</p>
            <code className="module-path">src/modules/{mod.key}/</code>
          </Link>
        ))}
      </div>
    </div>
  )
}
