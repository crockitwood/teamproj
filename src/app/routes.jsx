import { Route, Routes } from 'react-router-dom'
import HomePage from './HomePage.jsx'
import NotFoundPage from './NotFoundPage.jsx'

/**
 * 路由自动装配：约定每个模块用 src/modules/<模块>/index.js 默认导出一个模块描述，
 * 组员只改自己的 index.js，不需要动这个文件（避免全员改同一文件冲突）。
 */
const loaded = import.meta.glob('../modules/*/index.js', { eager: true })

export const modules = Object.values(loaded)
  .map((mod) => mod.default)
  .filter(Boolean)
  .sort((a, b) => a.order - b.order)

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage modules={modules} />} />
      {modules.flatMap((mod) =>
        mod.routes.map((route) => {
          const Page = route.component
          return <Route key={route.path} path={route.path} element={<Page module={mod} />} />
        }),
      )}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
