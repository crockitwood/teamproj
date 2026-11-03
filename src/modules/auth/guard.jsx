import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from '../../shared/session.js'
import { ROLE_LABELS } from './api.js'
import { Card, PageHeader } from '../../shared/ui.jsx'

/**
 * 路由守卫（账号与权限模块对外提供）
 * 其他模块直接复用：
 *   import { RequireLogin, RequireRole } from '../auth/guard.jsx'
 *   <RequireLogin><MyPage /></RequireLogin>
 *   <RequireRole roles={['admin']}><AdminPage /></RequireRole>
 */

export function RequireLogin({ children }) {
  const { user } = useSession()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}

export function RequireRole({ roles, children }) {
  const { user } = useSession()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!roles.includes(user.role)) {
    return (
      <div className="stack">
        <PageHeader
          title="没有访问权限"
          subtitle={`当前角色：${ROLE_LABELS[user.role] ?? user.role}`}
        />
        <Card>
          <p>
            这个页面只对 {roles.map((role) => ROLE_LABELS[role] ?? role).join(' / ')} 开放，
            可以退出后换一个演示账号体验。
          </p>
        </Card>
      </div>
    )
  }

  return children
}
