import ReviewPage from './pages/ReviewPage.jsx'
import StatsPage from './pages/StatsPage.jsx'

export default {
  key: 'analytics',
  order: 8,
  title: '审核与统计',
  owner: 'lijiatong',
  ownerName: 'lijiatong（队长）',
  summary: '活动审核、报名/签到/评分看板',
  collections: {
    read: ['activities', 'registrations', 'checkins', 'comments', 'users'],
    write: ['activities'],
  },
  tasks: [
    '活动审核台：通过 / 驳回，只修改 activities.status',
    '数据看板：活动数、报名数、签到率、平均分',
    '分类分布与报名趋势（可用 CSS 柱状图，不引第三方图表库）',
    '导出报名数据为 CSV',
  ],
  routes: [
    { path: '/admin/review', label: '活动审核', component: ReviewPage },
    { path: '/admin/stats', label: '数据看板', component: StatsPage },
  ],
}
