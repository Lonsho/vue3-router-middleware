import { App } from 'vue';
import { Router, RouteLocationNormalized, NavigationGuardNext, NavigationGuard } from 'vue-router';

interface RouteMiddleware {
    (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext): ReturnType<NavigationGuard>;
}
type EnhancedRouteMiddleware = RouteMiddleware & {
    _isRouteMiddleware: true;
};
interface MiddlewareOptions {
    middlewares?: Record<string, unknown | Promise<unknown>>;
    router?: Router;
}
/**
 *  添加路由中间件
 *
 * @param name 中间件名称
 * @param middleware 中间件函数
 *
 * @example
 * ```js
 * import { addMiddleware } from 'vue3-router-middleware'
 * addMiddleware('permission', (to, from, next) => {
 *  if (!isLogin) {
 *    return next('/login')
 *  }
 * })
 * ```
 */
declare function addMiddleware(name: string, middleware: RouteMiddleware): void;
/**
 * 移除路由中间件
 * @param name 中间件名称
 *
 * @example
 * ```js
 * import { removeMiddleware } from 'vue3-router-middleware'
 * removeMiddleware('permission') // 01.permission.ts,
 * removeMiddleware('permission.global') // 01.permission.global.ts,
 *  ```
 */
declare function removeMiddleware(name: string): void;
/**
 *  定义路由中间件
 *  优雅的使用如路由中间件，使用 defineRouteMiddleware
 *
 * @param middleware 中间件函数
 * @returns EnhancedRouteMiddleware
 *
 * @example
 * ```js
 * import { defineRouteMiddleware } from 'vue3-router-middleware'
 * export default defineRouteMiddleware((to, form, next) => {
 *  if (!isLogin) {
 *    return next('/login')
 *  }
 *  if (isLogin && to.path === '/login') {
 *    return next('/')
 *  }
 * });
 * ```
 */
declare function defineRouteMiddleware(middleware: RouteMiddleware): EnhancedRouteMiddleware;

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
declare const RouterMiddlewarePlugin: {
    install: (app: App, options?: MiddlewareOptions) => void;
};

export { addMiddleware, RouterMiddlewarePlugin as default, defineRouteMiddleware, removeMiddleware };
