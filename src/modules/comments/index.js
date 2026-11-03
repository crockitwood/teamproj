import CommentsPage from './pages/CommentsPage.jsx'
import ModeratePage from './pages/ModeratePage.jsx'

export default {
  key: 'comments',
  order: 6,
  title: '评论评分',
  owner: 'wujiu',
  ownerName: '吴九',
  summary: '打分、评论、评论管理',
  collections: { read: ['activities', 'comments', 'users'], write: ['comments'] },
  tasks: [
    '活动详情下的评论区：打 1-5 星 + 文字',
    '评论列表按时间倒序，显示评分与昵称',
    '同一活动同一人只能评一次，可修改',
    '管理员删除违规评论',
  ],
  routes: [
    { path: '/comments', label: '评论管理', component: CommentsPage },
    { path: '/comments/moderate', label: '违规处理', component: ModeratePage },
  ],
}
