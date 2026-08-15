/**
 * 模块注册器：自动扫描 src/modules 下各模块的 index.ts 并聚合路由
 *
 * 模块 index 本身很薄（eager 载入无碍），页面组件由模块内 React.lazy 懒加载。
 */
import type { ModuleDefinition, ModuleRoute } from './module'

const modules = import.meta.glob<{ default: ModuleDefinition }>('../modules/*/index.ts', {
  eager: true,
})

export const loadedModules: ModuleDefinition[] = Object.entries(modules)
  .map(([path, mod]) => mod.default ?? { name: path, routes: [] })
  .filter(Boolean)

/** component 字符串 → 页面组件 的映射表 */
export const componentRegistry = new Map<string, ModuleRoute['element']>()

for (const mod of loadedModules) {
  mod.init?.()
  for (const route of mod.routes) {
    if (componentRegistry.has(route.component)) {
      console.warn(`[registry] 路由组件 key 重复: ${route.component}（模块 ${mod.name}）`)
    }
    componentRegistry.set(route.component, route.element)
  }
}
