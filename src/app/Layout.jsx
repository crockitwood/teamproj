import { NavLink, matchPath, useLocation } from 'react-router-dom'
import { modules } from './routes.jsx'
import { useSession } from '../shared/session.js'

export default function Layout({ children }) {
  const { user, logout } = useSession()
  const location = useLocation()

  const navItems = [{ path: '/', label: '项目首页' }, ...modules.map((mod) => ({
    path: mod.routes[0].path,
    label: mod.title,
    owner: mod.ownerName,
    paths: mod.routes.map((route) => route.path),
  }))]

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">CE</span>
          <div>
            <strong>校园活动平台</strong>
            <span className="brand-sub">团队协作项目</span>
          </div>
        </div>
        <nav className="nav">
          {navItems.map((item) => {
            const active = item.paths
              ? item.paths.some((path) => matchPath(path, location.pathname))
              : location.pathname === item.path
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={() => `nav-item ${active ? 'active' : ''}`}
              >
                <span>{item.label}</span>
                {item.owner && <span className="nav-owner">{item.owner}</span>}
              </NavLink>
            )
          })}
        </nav>
        <div className="sidebar-footer">
          {user ? (
            <>
              <span className="muted small">当前身份</span>
              <strong>{user.name}</strong>
              <button className="btn btn-ghost btn-sm" onClick={logout}>
                退出登录
              </button>
            </>
          ) : (
            <NavLink className="btn btn-secondary btn-sm" to="/login">
              去登录
            </NavLink>
          )}
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  )
}
