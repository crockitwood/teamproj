import LoginPage from './pages/LoginPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'

export default {
  key: 'auth',
  order: 1,
  title: '账号与权限',
  owner: 'lisi',
  ownerName: '李四',
  summary: '注册登录、角色区分、路由守卫、个人资料',
  collections: { read: ['users'], write: ['users'] },
  tasks: [
    '登录 / 注册表单与校验，登录后写入 session',
    '三种角色（学生 / 主办方 / 管理员）的权限差异',
    '为需要登录的页面做路由守卫，未登录时提示去登录',
    '个人资料页：查看与修改昵称、邮箱',
  ],
  routes: [
    { path: '/login', label: '登录', component: LoginPage },
    { path: '/me', label: '个人中心', component: ProfilePage },
  ],
}
