/**
 * 岗位管理模块（由低代码生成器生成）
 *
 * component key 与后端 system_menu.component 字段一一对应
 */

import { lazyPage } from '@/core/lazy'
import { defineModule } from '@/core/module'

const loadPositionPage = () => import('./pages/PositionPage')
loadPositionPage()
const PositionPage = lazyPage(loadPositionPage)

export default defineModule({
  name: 'position',
  routes: [
    { component: '/position/index', element: PositionPage },
  ],
})
