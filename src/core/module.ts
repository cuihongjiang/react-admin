/**
 * 模块契约定义
 *
 * 每个业务模块在 src/modules/<name>/index.ts 中 default 导出 defineModule() 的结果：
 * - routes: 该模块提供的页面路由，component 字符串与后端 Menu.component 字段一一对应
 * - init:   可选的模块级初始化（注册全局组件等）
 *
 * 壳通过 core/registry.ts 自动扫描注册，新增模块无需改动壳代码。
 */
import type { ComponentType } from 'react'

export interface ModuleRoute {
  /** 与后端 system_menu.component 字段值一致，如 "/system/user/index" */
  component: string
  /** 懒加载页面组件（模块内用 React.lazy 保证页面级代码分割） */
  element: ComponentType
}

export interface ModuleDefinition {
  name: string
  routes: ModuleRoute[]
  init?: () => void
}

export function defineModule(mod: ModuleDefinition): ModuleDefinition {
  return mod
}
