require('dotenv').config();
const path = require('path')
const Koa = require('koa')
const koaStatic = require('koa-static')
const bodyParser = require('koa-bodyparser')
const koaLogger = require('koa-logger')

const config = require('./../config')
const routers = require('./routers/index')
const { Middleware } = require('./core')

const app = new Koa()

// 全局错误处理中间件（最先加载）
app.use(Middleware.errorHandler)

// CORS中间件
app.use(Middleware.cors)

// 请求日志中间件
app.use(Middleware.requestLogger)

// 配置控制台日志中间件
app.use(koaLogger())

// 配置ctx.body解析中间件
app.use(bodyParser())

// 配置静态资源加载中间件
app.use(koaStatic(
  path.join(__dirname , './../static')
))

// 统一响应格式中间件
app.use(Middleware.responseFormatter)

// 初始化路由中间件
app.use(routers.routes()).use(routers.allowedMethods())

// 监听启动端口
app.listen( config.port )
console.log(`🚀 Yoga Server is running at http://localhost:${config.port}`)
console.log(`📖 API Documentation: http://localhost:${config.port}/api`)
console.log(`💊 Health Check: http://localhost:${config.port}/health`)