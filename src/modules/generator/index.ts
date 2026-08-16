/**
 * 低代码生成器模块
 *
 * component key 与后端 system_menu.component 字段一一对应
 */

import { lazyPage } from '@/core/lazy'
import { defineModule } from '@/core/module'

const loadGeneratorPage = () => import('./pages/GeneratorPage')
loadGeneratorPage()
const GeneratorPage = lazyPage(loadGeneratorPage)

export default defineModule({
  name: 'generator',
  routes: [
    { component: '/generator/index', element: GeneratorPage },
  ],
})
