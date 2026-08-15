/**
 * 权限标识模块（由低代码生成器生成）
 *
 * component key 与后端 system_menu.component 字段一一对应
 */
import { lazy } from 'react'

import { defineModule } from '@/core/module'

const ButtonPage = lazy(() => import('./pages/ButtonPage'))

export default defineModule({
  name: 'button',
  routes: [
    { component: '/button/index', element: ButtonPage },
  ],
})
