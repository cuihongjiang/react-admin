/**
 * 系统管理模块
 *
 * component key 与后端 system_menu.component 字段一一对应，
 * 后端创建用户管理菜单时 component 填 "/system/user/index"
 */

import { lazyPage } from '@/core/lazy'
import { defineModule } from '@/core/module'

const loadUserPage = () => import('./pages/UserPage')
loadUserPage()
const UserPage = lazyPage(loadUserPage)

export default defineModule({
  name: 'system',
  routes: [
    { component: '/system/user/index', element: UserPage },
  ],
})
