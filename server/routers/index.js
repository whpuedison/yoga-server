/**
 * 路由总入口
 * 整合所有模块路由
 */
const router = require('koa-router')()

// 引入各模块路由
const userRouter = require('../modules/user').router
const authRouter = require('../modules/auth').router
const courseRouter = require('../modules/course').router
const bookingRouter = require('../modules/booking').router
const memberCardRouter = require('../modules/member-card').router

// API路由
router.use('/api/user', userRouter.routes(), userRouter.allowedMethods())
router.use('/api/auth', authRouter.routes(), authRouter.allowedMethods())
router.use('/api/courses', courseRouter.routes(), courseRouter.allowedMethods())
router.use('/api/bookings', bookingRouter.routes(), bookingRouter.allowedMethods())
router.use('/api/member-cards', memberCardRouter.routes(), memberCardRouter.allowedMethods())

// 健康检查接口
router.get('/health', async (ctx) => {
  ctx.body = {
    success: true,
    message: 'Server is running',
    timestamp: Date.now()
  }
})

// 根路径
router.get('/', async (ctx) => {
  ctx.body = {
    success: true,
    message: 'Welcome to Yoga Server API',
    version: '1.0.0',
    timestamp: Date.now()
  }
})

module.exports = router
