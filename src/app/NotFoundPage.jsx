import { Link } from 'react-router-dom'
import { Empty, PageHeader } from '../shared/ui.jsx'

export default function NotFoundPage() {
  return (
    <div className="stack">
      <PageHeader title="页面不存在" subtitle="检查一下地址，或者回首页看看" />
      <Empty text="404" />
      <Link className="btn btn-primary btn-md" to="/">
        回到首页
      </Link>
    </div>
  )
}
