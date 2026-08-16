/**
 * 菜单管理模块（由低代码生成器生成）
 *
 * component key 与后端 system_menu.component 字段一一对应
 */

import { lazyPage } from '@/core/lazy'
import { defineModule } from '@/core/module'

const loadMenuPage = () => import('./pages/MenuPage')
loadMenuPage()
const MenuPage = lazyPage(loadMenuPage)

export default defineModule({
  name: 'menu',
  routes: [
    { component: '/menu/index', element: MenuPage },
  ],
})
