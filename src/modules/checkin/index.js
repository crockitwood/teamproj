import CheckinPage from './pages/CheckinPage.jsx'
import CheckinRecordsPage from './pages/CheckinRecordsPage.jsx'

export default {
  key: 'checkin',
  order: 5,
  title: '签到核销',
  owner: 'zhouba',
  ownerName: '周八',
  summary: '签到码、现场核验、签到记录',
  collections: { read: ['activities', 'registrations', 'checkins', 'users'], write: ['checkins'] },
  tasks: [
    '为活动生成签到码（6 位数字即可）',
    '输入签到码完成签到，校验是否已报名',
    '重复签到拦截，签到记录列表',
    '展示签到率 = 已签到 / 已报名',
  ],
  routes: [
    { path: '/checkin', label: '现场签到', component: CheckinPage },
    { path: '/checkin/records', label: '签到记录', component: CheckinRecordsPage },
  ],
}
