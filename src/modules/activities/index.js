import ActivityListPage from './pages/ActivityListPage.jsx'
import ActivityDetailPage from './pages/ActivityDetailPage.jsx'

export default {
  key: 'activities',
  order: 2,
  title: '活动发现',
  owner: 'wangwu',
  ownerName: '王五',
  summary: '活动列表、搜索筛选、活动详情',
  collections: { read: ['activities', 'registrations', 'comments'], write: [] },
  tasks: [
    '活动列表卡片：封面、时间、地点、剩余名额',
    '关键词搜索 + 分类筛选 + 时间排序',
    '活动详情页：介绍、主办方、已报名人数',
    '只展示 status 为 published 的活动',
  ],
  routes: [
    { path: '/activities', label: '活动列表', component: ActivityListPage },
    { path: '/activities/:id', label: '活动详情', component: ActivityDetailPage },
  ],
}
