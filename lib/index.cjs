'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var vue = require('vue');

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

function isRouteMiddleware(value) {
    return typeof value === 'function' && '_isRouteMiddleware' in value && value._isRouteMiddleware;
}
function isGlobalMiddleware(fileName) {
    return fileName.endsWith('.global');
}
function extractFileName(fullName) {
    let fileName = fullName.replace(/^.*[\\/]/, '');
    if (!isGlobalMiddleware(fileName)) {
        fileName = fileName.replace(/\.\w+$/, '');
    }
    return fileName.replace(/^\d+\./, '');
}
function doAddMiddleware(middlewareList, filePath, middleware) {
    const name = extractFileName(filePath);
    middlewareList.push({
        path: filePath,
        middleware,
        name,
        global: isGlobalMiddleware(name),
    });
}
function scanRouterMiddleware(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const modules = (options === null || options === void 0 ? void 0 : options.middlewares) || {};
        const middlewareList = [];
        const keys = Object.keys(modules);
        for (const filePath of keys) {
            const module = modules[filePath];
            const handleModule = (mod) => {
                if (isRouteMiddleware(mod) && mod._isRouteMiddleware) {
                    doAddMiddleware(middlewareList, filePath, mod);
                }
                else {
                    for (const exportKey in mod) {
                        const exportValue = mod[exportKey];
                        handleModule(exportValue);
                    }
                }
            };
            if (typeof module === 'function') {
                yield Promise.resolve(module()).then(handleModule);
            }
            else {
                handleModule(module);
            }
        }
        return middlewareList;
    });
}
function interceptNext(nativeNext) {
    const wrappedNext = (param) => {
        try {
            if (param === void 0) {
                nativeNext();
            }
            else if (param instanceof Error) {
                nativeNext(param);
            }
            else if (typeof param === 'string' || typeof param === 'object') {
                nativeNext(param);
            }
            else if (typeof param === 'boolean') {
                nativeNext(param);
            }
            else if (typeof param === 'function') {
                nativeNext(param);
            }
            else {
                nativeNext(param);
            }
        }
        catch (error) {
            nativeNext(error);
        }
        wrappedNext.called = true;
    };
    return wrappedNext;
}
function handleMiddleware(app, router) {
    if (router && app.config.globalProperties.$routerMiddlewares) {
        router.beforeEach((to, from, next) => __awaiter(this, void 0, void 0, function* () {
            const filterMiddlewareList = app.config.globalProperties.$routerMiddlewares.filter((item) => {
                var _a;
                if (item.global) {
                    return true;
                }
                if ((_a = to.meta) === null || _a === void 0 ? void 0 : _a.middleware) {
                    const middleware = to.meta.middleware;
                    if (Array.isArray(middleware)) {
                        return middleware.indexOf(item.name) >= 0;
                    }
                    if (middleware === item.name) {
                        return true;
                    }
                }
                return false;
            });
            for (const { middleware } of filterMiddlewareList) {
                const routerNext = interceptNext(next);
                yield middleware(to, from, routerNext);
                if (routerNext.called) {
                    return;
                }
            }
            next();
        }));
    }
}
function initMiddleware(app, options) {
    return __awaiter(this, void 0, void 0, function* () {
        app.config.globalProperties.$routerMiddlewares = yield scanRouterMiddleware(options);
        const router = (options === null || options === void 0 ? void 0 : options.router) || app.config.globalProperties.$router;
        return handleMiddleware(app, router);
    });
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
function addMiddleware(name, middleware) {
    const instance = vue.getCurrentInstance();
    if (instance) {
        if (!instance.appContext.config.globalProperties.$routerMiddlewares) {
            instance.appContext.config.globalProperties.$routerMiddlewares = [];
            if (instance.appContext.config.globalProperties.$router) {
                handleMiddleware(instance.appContext.app, instance.appContext.config.globalProperties.$router);
            }
        }
        const currentMiddlewareList = instance.appContext.config.globalProperties.$routerMiddlewares;
        doAddMiddleware(currentMiddlewareList, name, defineRouteMiddleware(middleware));
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
function removeMiddleware(name) {
    const instance = vue.getCurrentInstance();
    if (instance) {
        if (!instance.appContext.config.globalProperties.$routerMiddlewares) {
            return;
        }
        const currentMiddlewareList = instance.appContext.config.globalProperties.$routerMiddlewares;
        const index = currentMiddlewareList.findIndex((item) => item.name === name);
        if (index >= 0) {
            currentMiddlewareList.splice(index, 1);
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
function defineRouteMiddleware(middleware) {
    return Object.assign(middleware, {
        _isRouteMiddleware: true,
    });
}

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
    install: (app, options) => {
        initMiddleware(app, options).then(() => { });
    },
};

exports.addMiddleware = addMiddleware;
exports.default = RouterMiddlewarePlugin;
exports.defineRouteMiddleware = defineRouteMiddleware;
exports.removeMiddleware = removeMiddleware;
