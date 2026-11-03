import { HashRouter } from 'react-router-dom'
import Layout from './app/Layout.jsx'
import AppRoutes from './app/routes.jsx'

export default function App() {
  return (
    <HashRouter>
      <Layout>
        <AppRoutes />
      </Layout>
    </HashRouter>
  )
}
