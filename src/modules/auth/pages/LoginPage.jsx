import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSession } from '../../../shared/session.js'
import { Badge, Button, Card, Field, Input, PageHeader, Select } from '../../../shared/ui.jsx'
import { DEFAULT_PASSWORD, ROLE_DESCRIPTIONS, ROLE_LABELS, login, register } from '../api.js'
import '../auth.css'

const DEMO_ACCOUNTS = [
  { email: 'student@campus.edu', name: '林同学', role: 'student' },
  { email: 'organizer@campus.edu', name: '社团小周', role: 'organizer' },
  { email: 'admin@campus.edu', name: '教务处老师', role: 'admin' },
]

export default function LoginPage() {
  const { user, logout } = useSession()
  const navigate = useNavigate()
  const location = useLocation()

  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' })
  const [error, setError] = useState('')

  const from = location.state?.from || '/'

  const update = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }))
    setError('')
  }

  function switchMode(next) {
    setMode(next)
    setError('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    const result =
      mode === 'login'
        ? login({ email: form.email, password: form.password })
        : register(form)

    if (!result.ok) {
      setError(result.error)
      return
    }
    navigate(from, { replace: true })
  }

  function handleQuickLogin(email) {
    const result = login({ email, password: DEFAULT_PASSWORD })
    if (!result.ok) {
      setError(result.error)
      return
    }
    navigate(from, { replace: true })
  }

  if (user) {
    return (
      <div className="stack">
        <PageHeader
          title="已经登录"
          subtitle={`当前身份：${user.name} · ${ROLE_LABELS[user.role] ?? user.role}`}
        />
        <Card>
          <p>想体验其他角色，可以先退出，再用演示账号登录。</p>
          <div className="row gap-8">
            <Link className="btn btn-primary btn-md" to="/me">
              个人中心
            </Link>
            <Link className="btn btn-secondary btn-md" to="/">
              回到首页
            </Link>
            <Button variant="ghost" onClick={() => logout()}>
              退出登录
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const tabs = (
    <div className="auth-tabs">
      <button
        type="button"
        className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
        onClick={() => switchMode('login')}
      >
        登录
      </button>
      <button
        type="button"
        className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
        onClick={() => switchMode('register')}
      >
        注册
      </button>
    </div>
  )

  return (
    <div className="stack">
      <PageHeader
        title="账号与权限"
        subtitle="登录后才能报名、发布活动、审核和查看通知"
      />

      <div className="auth-layout">
        <Card title={mode === 'login' ? '登录账号' : '注册新账号'} extra={tabs}>
          <form className="stack" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <Field label="昵称">
                <Input
                  value={form.name}
                  onChange={update('name')}
                  placeholder="会显示在评论和报名名单里"
                />
              </Field>
            )}

            <Field label="邮箱">
              <Input
                type="email"
                value={form.email}
                onChange={update('email')}
                placeholder="student@campus.edu"
                autoComplete="username"
              />
            </Field>

            <Field label="密码" hint={mode === 'register' ? '至少 6 位' : undefined}>
              <Input
                type="password"
                value={form.password}
                onChange={update('password')}
                placeholder={DEFAULT_PASSWORD}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </Field>

            {mode === 'register' && (
              <Field label="角色">
                <Select value={form.role} onChange={update('role')}>
                  <option value="student">学生</option>
                  <option value="organizer">主办方</option>
                </Select>
              </Field>
            )}

            {error && <p className="form-error">{error}</p>}

            <Button type="submit">{mode === 'login' ? '登录' : '注册并登录'}</Button>
          </form>
        </Card>

        <Card title="演示账号">
          <p className="muted small">密码统一为 {DEFAULT_PASSWORD}，点一下直接登录</p>
          <div className="demo-list">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                className="demo-item"
                onClick={() => handleQuickLogin(account.email)}
              >
                <span className="avatar">{account.name.slice(0, 1)}</span>
                <span className="demo-text">
                  <strong>{account.name}</strong>
                  <span className="muted small">{account.email}</span>
                </span>
                <Badge tone="info">{ROLE_LABELS[account.role]}</Badge>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Card title="三种角色分别能做什么">
        <ul className="role-list">
          {Object.entries(ROLE_DESCRIPTIONS).map(([role, description]) => (
            <li key={role}>
              <Badge tone={role === 'admin' ? 'warn' : 'neutral'}>{ROLE_LABELS[role]}</Badge>
              <span className="muted">{description}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
