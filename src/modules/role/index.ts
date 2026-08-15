/**
 * 角色管理模块（由低代码生成器生成）
 *
 * component key 与后端 system_menu.component 字段一一对应
 */
import { lazy } from 'react'

import { defineModule } from '@/core/module'

const RolePage = lazy(() => import('./pages/RolePage'))

export default defineModule({
  name: 'role',
  routes: [
    { component: '/role/index', element: RolePage },
  ],
})
