import MyActivitiesPage from './pages/MyActivitiesPage.jsx'
import ActivityFormPage from './pages/ActivityFormPage.jsx'

export default {
  key: 'publish',
  order: 3,
  title: '活动发布',
  owner: 'zhaoliu',
  ownerName: '赵六',
  summary: '主办方建活动、改活动、提交审核',
  collections: { read: ['activities', 'registrations'], write: ['activities'] },
  tasks: [
    '新建活动表单：标题、分类、时间、地点、名额、介绍',
    '保存草稿与提交审核（status: draft → pending）',
    '我发布的活动列表：编辑、下架',
    '编辑时只改自己的活动，不改 status 审核结论',
  ],
  routes: [
    { path: '/publish', label: '我的活动', component: MyActivitiesPage },
    { path: '/publish/new', label: '发布活动', component: ActivityFormPage },
  ],
}
