import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCollection } from '../../../shared/db.js'
import { useSession } from '../../../shared/session.js'
import { Badge, Button, Card, Field, Input, PageHeader, Stat } from '../../../shared/ui.jsx'
import { ROLE_DESCRIPTIONS, ROLE_LABELS, updateProfile } from '../api.js'
import '../auth.css'

export default function ProfilePage() {
  const { user, logout } = useSession()
  const users = useCollection('users')
  const registrations = useCollection('registrations')
  const notifications = useCollection('notifications')
  const comments = useCollection('comments')

  const me = user ? users.find((item) => item.id === user.id) ?? user : null
  const [form, setForm] = useState({
    name: me?.name ?? '',
    email: me?.email ?? '',
  })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  if (!me) {
    return (
      <div className="stack">
        <PageHeader title="个人中心" subtitle="登录后可以查看和修改资料" />
        <Card>
          <p>你还没有登录。</p>
          <div>
            <Link className="btn btn-primary btn-md" to="/login" state={{ from: '/me' }}>
              去登录
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  const update = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }))
    setError('')
    setMessage('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    const result = updateProfile(me.id, form)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setMessage('资料已保存')
  }

  const myRegistrations = registrations.filter(
    (item) => item.userId === me.id && item.status === 'confirmed',
  )
  const unreadCount = notifications.filter((item) => item.userId === me.id && !item.read).length
  const myComments = comments.filter((item) => item.userId === me.id)

  return (
    <div className="stack">
      <PageHeader
        title="个人中心"
        subtitle="这里是账号与权限模块，其他模块通过 useSession 读取当前用户"
        actions={<Badge tone="info">{ROLE_LABELS[me.role] ?? me.role}</Badge>}
      />

      <div className="auth-layout">
        <Card title="我的资料">
          <div className="profile-head">
            <span className="avatar avatar-lg">{me.name.slice(0, 1)}</span>
            <div>
              <strong>{me.name}</strong>
              <p className="muted small">{me.email}</p>
            </div>
          </div>

          <form className="stack" onSubmit={handleSubmit}>
            <Field label="昵称">
              <Input value={form.name} onChange={update('name')} />
            </Field>
            <Field label="邮箱">
              <Input type="email" value={form.email} onChange={update('email')} />
            </Field>
            {error && <p className="form-error">{error}</p>}
            {message && <p className="form-ok">{message}</p>}
            <div className="row gap-8">
              <Button type="submit">保存资料</Button>
              <Button type="button" variant="ghost" onClick={() => logout()}>
                退出登录
              </Button>
            </div>
          </form>
        </Card>

        <div className="stack">
          <Card title="我的数据">
            <div className="profile-stats">
              <Stat label="已报名活动" value={myRegistrations.length} />
              <Stat label="未读通知" value={unreadCount} />
              <Stat label="我的评论" value={myComments.length} />
            </div>
          </Card>

          <Card title="当前角色的权限">
            <p className="muted">{ROLE_DESCRIPTIONS[me.role]}</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
