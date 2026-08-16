/**
 * 登录日志模块（由低代码生成器生成）
 *
 * component key 与后端 system_menu.component 字段一一对应
 */
import { lazyPage } from '@/core/lazy'
import { defineModule } from '@/core/module'

const LoginlogPage = lazyPage(() => import('./pages/LoginlogPage'))

export default defineModule({
  name: 'loginlog',
  routes: [
    { component: '/loginlog/index', element: LoginlogPage },
  ],
})
