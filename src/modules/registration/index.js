import MyRegistrationsPage from './pages/MyRegistrationsPage.jsx'
import RosterPage from './pages/RosterPage.jsx'

export default {
  key: 'registration',
  order: 4,
  title: '报名管理',
  owner: 'sunqi',
  ownerName: '孙七',
  summary: '报名、取消、候补、报名名单',
  collections: { read: ['activities', 'registrations', 'users'], write: ['registrations'] },
  tasks: [
    '报名 / 取消报名，写 registrations 集合',
    '名额已满时进入候补，有人取消自动补位',
    '重复报名校验，不允许同一活动报名两次',
    '我的报名列表 + 主办方查看报名名单',
  ],
  routes: [
    { path: '/registrations', label: '我的报名', component: MyRegistrationsPage },
    { path: '/registrations/roster', label: '报名名单', component: RosterPage },
  ],
}
