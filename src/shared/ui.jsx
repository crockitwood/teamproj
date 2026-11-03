import { useEffect } from 'react'

/** 公共 UI 组件（队长维护）：组员在自己的模块里直接用，不要复制粘贴改这里 */

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="row gap-8">{actions}</div>}
    </div>
  )
}

export function Card({ title, extra, children, className = '' }) {
  return (
    <section className={`card ${className}`}>
      {(title || extra) && (
        <header className="card-header">
          {title && <h2>{title}</h2>}
          {extra}
        </header>
      )}
      {children}
    </section>
  )
}

export function Button({ variant = 'primary', size = 'md', ...props }) {
  return <button className={`btn btn-${variant} btn-${size}`} {...props} />
}

export function Field({ label, hint, children }) {
  return (
    <label className="field">
      {label && <span className="field-label">{label}</span>}
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}

export function Input(props) {
  return <input className="input" {...props} />
}

export function Textarea(props) {
  return <textarea className="input textarea" rows={4} {...props} />
}

export function Select({ children, ...props }) {
  return (
    <select className="input" {...props}>
      {children}
    </select>
  )
}

export function Badge({ tone = 'neutral', children }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

export function Empty({ text = '暂无数据' }) {
  return <div className="empty">{text}</div>
}

export function Stat({ label, value, hint }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  )
}

export function Modal({ open, title, onClose, children, footer }) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <header className="card-header">
          <h2>{title}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            关闭
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-footer">{footer}</footer>}
      </div>
    </div>
  )
}

/**
 * 模块占位页：组员开工前先看到自己负责什么、能读写哪些集合。
 * 实现完页面后删掉这个组件即可。
 */
export function ModuleStub({ module, page }) {
  return (
    <div className="stub">
      <PageHeader
        title={page}
        subtitle={`${module.title} · 负责人 ${module.ownerName}`}
        actions={<Badge tone="warn">待实现</Badge>}
      />
      <Card title="这个模块要做什么">
        <ul className="task-list">
          {module.tasks.map((task) => (
            <li key={task}>{task}</li>
          ))}
        </ul>
      </Card>
      <div className="grid-2">
        <Card title="你的目录">
          <code className="code-block">{`src/modules/${module.key}/`}</code>
          <p className="muted small">
            只在这个目录里新建和修改文件，公共代码找队长提需求。
          </p>
        </Card>
        <Card title="集合读写约定">
          <p className="small">
            可读：{module.collections.read.map((name) => <code key={name} className="inline-code">{name}</code>)}
          </p>
          <p className="small">
            可写：{module.collections.write.map((name) => <code key={name} className="inline-code">{name}</code>)}
          </p>
          <p className="muted small">
            通过 <code className="inline-code">src/shared/db.js</code> 的 <code className="inline-code">db</code> 与{' '}
            <code className="inline-code">useCollection</code> 访问数据。
          </p>
        </Card>
      </div>
    </div>
  )
}
