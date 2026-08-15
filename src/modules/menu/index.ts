/**
 * 菜单管理模块（由低代码生成器生成）
 *
 * component key 与后端 system_menu.component 字段一一对应
 */
import { lazy } from 'react'

import { defineModule } from '@/core/module'

const MenuPage = lazy(() => import('./pages/MenuPage'))

export default defineModule({
  name: 'menu',
  routes: [
    { component: '/menu/index', element: MenuPage },
  ],
})
