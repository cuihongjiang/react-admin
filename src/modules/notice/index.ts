/**
 * 公告管理模块（由低代码生成器生成）
 *
 * component key 与后端 system_menu.component 字段一一对应
 */
import { lazyPage } from '@/core/lazy'
import { defineModule } from '@/core/module'

const NoticePage = lazyPage(() => import('./pages/NoticePage'))

export default defineModule({
  name: 'notice',
  routes: [
    { component: '/notice/index', element: NoticePage },
  ],
})
