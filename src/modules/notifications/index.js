import NotificationsPage from './pages/NotificationsPage.jsx'

export default {
  key: 'notifications',
  order: 7,
  title: '通知中心',
  owner: 'zhengshi',
  ownerName: '郑十',
  summary: '站内消息、未读角标、业务事件通知',
  collections: { read: ['notifications', 'users'], write: ['notifications'] },
  tasks: [
    '通知列表：按时间倒序，区分已读 / 未读',
    '未读数统计与「全部已读」',
    '提供 notify(userId, title, body) 方法给其他模块调用',
    '报名成功、审核通过 / 驳回时写入通知',
  ],
  routes: [{ path: '/notifications', label: '通知中心', component: NotificationsPage }],
}
