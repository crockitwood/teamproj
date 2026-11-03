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
    '评论区：1-5 星评分 + 文字，未登录只能浏览',
    '评论列表按时间倒序，显示星级、昵称与平均分分布',
    '同一活动同一人只保留一条评价，再次提交即修改',
    '管理员在违规处理页删除评论，普通角色不可删除',
  ],
  // 对外提供可复用组件，活动详情页（activities 模块）可直接引用：
  //   import CommentSection from '../comments/components/CommentSection.jsx'
  //   <CommentSection activityId={activity.id} />
  routes: [
    { path: '/comments', label: '评论管理', component: CommentsPage },
    { path: '/comments/moderate', label: '违规处理', component: ModeratePage },
  ],
}
