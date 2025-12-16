import type { App } from 'vue'
import type { MiddlewareOptions } from './core'
import { initMiddleware } from './core'

/**
 *  路由中间件
 *
 * @param options 参数
 *
 * @example
 * ```js
 * import RouterMiddleware from 'vue3-router-middleware'
 * const app = createApp(App)
 * app.use(router)
 * // 在路由之后引入中间件
 * app.use(RouterMiddleware, {
 *   middlewares: import.meta.glob('./middleware/*.ts', { eager: true }),
 * })
 * // 或者
 * app.use(RouterMiddleware, {
 *   middlewares: import.meta.glob('./middleware/*.ts'),
 *   router,
 * })
 * // 或者
 * app.use(RouterMiddleware, {
 *   middlewares: {
 *     permission: () => import('./middleware/permission.ts'),
 *   }
 * })
 * ```
 */
const RouterMiddlewarePlugin = {
  install: (app: App, options?: MiddlewareOptions) => {
    initMiddleware(app, options).then(() => {})
  },
}
export default RouterMiddlewarePlugin
export { addMiddleware, removeMiddleware, defineRouteMiddleware } from './core'
