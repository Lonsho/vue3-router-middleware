import type { App } from 'vue'
import type { NavigationGuard, NavigationGuardNext, NavigationGuardNextCallback, RouteLocationNormalized, RouteLocationRaw, Router } from 'vue-router'
import { getCurrentInstance } from 'vue'

export interface RouteMiddleware {
  (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext): ReturnType<NavigationGuard>
}
export type EnhancedRouteMiddleware = RouteMiddleware & {
  _isRouteMiddleware: true
}

export interface MiddlewareOptions {
  middlewares?: Record<string, unknown | Promise<unknown>>
  router?: Router
}
export interface MiddlewareItem {
  path: string
  middleware: EnhancedRouteMiddleware
  name: string
  global?: boolean
}
function isRouteMiddleware(value: unknown): value is EnhancedRouteMiddleware {
  return typeof value === 'function' && '_isRouteMiddleware' in value && (value as EnhancedRouteMiddleware)._isRouteMiddleware
}
function isGlobalMiddleware(fileName: string): boolean {
  return fileName.endsWith('.global')
}
function extractFileName(fullName: string): string {
  let fileName = fullName.replace(/^.*[\\/]/, '')
  if (!isGlobalMiddleware(fileName)) {
    fileName = fileName.replace(/\.\w+$/, '')
  }
  return fileName.replace(/^\d+\./, '')
}
function doAddMiddleware(middlewareList: MiddlewareItem[], filePath: string, middleware: EnhancedRouteMiddleware) {
  const name = extractFileName(filePath)
  middlewareList.push({
    path: filePath,
    middleware,
    name,
    global: isGlobalMiddleware(name),
  })
}
async function scanRouterMiddleware(options?: MiddlewareOptions) {
  const modules = options?.middlewares || {}
  const middlewareList: MiddlewareItem[] = []
  const keys = Object.keys(modules)
  for (const filePath of keys) {
    const module = modules[filePath]
    const handleModule = (mod: any) => {
      if (isRouteMiddleware(mod) && mod._isRouteMiddleware) {
        doAddMiddleware(middlewareList, filePath, mod)
      } else {
        for (const exportKey in mod) {
          const exportValue = mod[exportKey]
          handleModule(exportValue)
        }
      }
    }
    if (typeof module === 'function') {
      await Promise.resolve(module()).then(handleModule)
    } else {
      handleModule(module)
    }
  }
  return middlewareList
}
function interceptNext(nativeNext: NavigationGuardNext): NavigationGuardNext & { called?: boolean } {
  const wrappedNext: NavigationGuardNext & { called?: boolean } = (param?: unknown) => {
    try {
      if (param === void 0) {
        nativeNext()
      } else if (param instanceof Error) {
        nativeNext(param)
      } else if (typeof param === 'string' || typeof param === 'object') {
        nativeNext(param as RouteLocationRaw)
      } else if (typeof param === 'boolean') {
        nativeNext(param as boolean)
      } else if (typeof param === 'function') {
        nativeNext(param as NavigationGuardNextCallback)
      } else {
        nativeNext(param as any)
      }
    } catch (error) {
      nativeNext(error as Error)
    }
    wrappedNext.called = true
  }
  return wrappedNext
}
function handleMiddleware(app: App, router: Router) {
  if (router) {
    router.beforeEach(async (to, from, next) => {
      if (app.config.globalProperties.$routerMiddlewaresReady) {
        await app.config.globalProperties.$routerMiddlewaresReady
      }
      const filterMiddlewareList = app.config.globalProperties.$routerMiddlewares?.filter((item: MiddlewareItem) => {
        if (item.global) {
          return true
        }
        if (to.meta?.middleware) {
          const middleware = to.meta.middleware as string | string[]
          if (Array.isArray(middleware)) {
            return middleware.indexOf(item.name) >= 0
          }
          if (middleware === item.name) {
            return true
          }
        }
        return false
      })
      for (const { middleware } of filterMiddlewareList) {
        const routerNext = interceptNext(next)
        await middleware(to, from, routerNext)
        if (routerNext.called) {
          return
        }
      }
      next()
    })
  }else {
    (async () => {
      await app.config.globalProperties.$routerMiddlewaresReady
    })()
  }
}
export async function initMiddleware(app: App, options?: MiddlewareOptions) {
  app.config.globalProperties.$routerMiddlewaresReady = new Promise<MiddlewareItem[]>((resolve) => {
    scanRouterMiddleware(options).then((middlewareList) => {
      delete app.config.globalProperties.$routerMiddlewaresReady
      app.config.globalProperties.$routerMiddlewares = middlewareList
      resolve(middlewareList)
    })
  })
  const router = options?.router || app.config.globalProperties.$router
  return handleMiddleware(app,router)
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
export function addMiddleware(name: string, middleware: RouteMiddleware) {
  const instance = getCurrentInstance()
  if (instance) {
    if (!instance.appContext.config.globalProperties.$routerMiddlewares){
      instance.appContext.config.globalProperties.$routerMiddlewares = []
      if (instance.appContext.config.globalProperties.$router){
        handleMiddleware(instance.appContext.app, instance.appContext.config.globalProperties.$router)
      }
    }
    const currentMiddlewareList = instance.appContext.config.globalProperties.$routerMiddlewares
    doAddMiddleware(currentMiddlewareList, name, defineRouteMiddleware(middleware))
  }
}

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
export function removeMiddleware(name: string) {
  const instance = getCurrentInstance()
  if (instance) {
    if (!instance.appContext.config.globalProperties.$routerMiddlewares){
       return
    }
    const currentMiddlewareList = instance.appContext.config.globalProperties.$routerMiddlewares
    const index = currentMiddlewareList.findIndex((item: MiddlewareItem) => item.name === name)
    if (index >= 0) {
      currentMiddlewareList.splice(index, 1)
    }
  }
}

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
export function defineRouteMiddleware(middleware: RouteMiddleware) {
  return Object.assign(middleware, {
    _isRouteMiddleware: true as const,
  }) as EnhancedRouteMiddleware
}
