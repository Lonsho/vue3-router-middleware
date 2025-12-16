# Vue Router Middleware
#### 类似`Nuxt`上的路由中间件，更优雅的使用路由守卫

### 安装
```shell
npm i vue3-router-middleware
```

### 在 main.ts 中注册
```javascript
import { RouterMiddleware, addMiddleware } from 'vue3-router-middleware'
const app = createApp(App)
app.use(router)
// 全量导入
app.use(RouterMiddleware, {
  middlewares: import.meta.glob('./middleware/*.ts', { eager: true })
})
// 自定义导入
app.use(RouterMiddleware, {
  middlewares: {
    // 命名空间中间件
    auth: () => import('./middleware/auth.ts'),
    // 全局中间件
    'auth.global': () => import('./middleware/auth.global.ts'),
  }
})
app.mount('#app')
```

### 编写中间件
`auth.global.ts`
```javascript
import { defineRouteMiddleware } from 'vue3-router-middleware'
export default defineRouteMiddleware((to, from, next) => {
  if (!isLogin) {
    return next('/login')
  }
  next()
})
```

### 动态注册中间件
```javascript
import { addMiddleware } from 'vue3-router-middleware'
addMiddleware('permission', (to, from, next) => {
  // do something
})
```
### 不同页面指定不同的中间件
```javascript
const router = createRouter({
  routes: [{
    path: '/',
    name: 'Home',
    meta: {
      middleware: ['permission']
    },
    component: () => import('@/views/Home.vue'),
  }]
})
```

### 全量导入，文件目录参考

```
root/                       # 项目根目录
├── src/                    # 源代码目录
│   ├── middileware/        # 中间件目录
│   │   ├── auth.global.ts  # 全局中间件，不管访问哪个路由，都会执行
│   │   └── permission.ts   # 局部中间件，只有指定了路由的 middleware 才会执行
│   ├── App.vue             # 根组件
│   └── main.ts             # 入口文件
├── package.json            # 项目依赖配置
└── README.md               # 项目说明文档
```
#### 中间件默认是按文件顺序执行的，可以通过名称自定义排序
```
root/                          # 项目根目录
├── src/                       # 源代码目录
│   ├── middileware/           # 中间件目录
│   │   ├── 01.permission.ts   # 先执行局部的中间件
│   │   └── 02.auth.global.ts  # 再执行全局的中间件
│   ├── App.vue                # 根组件
│   └── main.ts                # 入口文件
├── package.json               # 项目依赖配置
└── README.md                  # 项目说明文档
```
