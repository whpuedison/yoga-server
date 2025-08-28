/**
 * 函数式预约路由
 */
const router = require('koa-router')()
const { response, errors, Middleware } = require('../../core')
const bookingService = require('./service')

const { handle, success, page } = response
const { AuthError, BusinessError } = errors

/**
 * JWT认证中间件 - 用于小程序端认证
 */
const jwtAuth = Middleware.jwtAuth('mini-program')

/**
 * 管理员认证中间件 - 用于管理端认证
 */
const adminAuth = Middleware.jwtAuth('admin')

/**
 * 预约课程（小程序端）
 * POST /api/bookings
 */
router.post('/', jwtAuth, handle(async (ctx) => {
  const userId = ctx.state.userId
  const tenantId = ctx.state.tenantId
  const bookingData = ctx.request.body
  const result = await bookingService.createBooking(userId, tenantId, bookingData)
  return success(result, '预约成功')
}))

/**
 * 获取用户预约列表（小程序端）
 * GET /api/bookings
 */
router.get('/', jwtAuth, handle(async (ctx) => {
  const userId = ctx.state.userId
  const options = {
    status: ctx.query.status,
    page: ctx.query.page,
    size: ctx.query.size,
    start_date: ctx.query.start_date,
    end_date: ctx.query.end_date
  }
  const result = await bookingService.getUserBookings(userId, options)
  return page(result.list, result.total, result.page, result.size)
}))

/**
 * 获取今日用户预约（小程序端）
 * GET /api/bookings/today
 */
router.get('/today', jwtAuth, handle(async (ctx) => {
  const userId = ctx.state.userId
  const result = await bookingService.getTodayUserBookings(userId)
  return success(result)
}))

/**
 * 获取预约详情（小程序端）
 * GET /api/bookings/:id
 */
router.get('/:id', jwtAuth, handle(async (ctx) => {
  const userId = ctx.state.userId
  const tenantId = ctx.state.tenantId
  const bookingId = ctx.params.id
  const result = await bookingService.getBookingDetail(bookingId, tenantId)
  
  // 检查用户是否有权访问该预约
  if (result.user_id !== userId) {
    throw AuthError('无权访问该预约')
  }
  
  return success(result)
}))

/**
 * 取消预约（小程序端）
 * DELETE /api/bookings/:id
 */
router.delete('/:id', jwtAuth, handle(async (ctx) => {
  const userId = ctx.state.userId
  const tenantId = ctx.state.tenantId
  const bookingId = ctx.params.id
  await bookingService.cancelBooking(bookingId, userId, tenantId)
  return success(null, '取消预约成功')
}))

/**
 * 获取预约列表（管理端）
 * GET /api/admin/bookings
 */
router.get('/admin/list', adminAuth, handle(async (ctx) => {
  const tenantId = ctx.state.tenantId
  const options = {
    course_id: ctx.query.course_id,
    user_id: ctx.query.user_id,
    status: ctx.query.status,
    page: ctx.query.page,
    size: ctx.query.size,
    start_date: ctx.query.start_date,
    end_date: ctx.query.end_date
  }
  
  // 这里需要实现管理端的预约列表查询
  // 暂时返回空数据，待实现
  return page([], 0, 1, 10)
}))

/**
 * 获取课程预约名单（管理端）
 * GET /api/admin/courses/:id/bookings
 */
router.get('/admin/courses/:id/bookings', adminAuth, handle(async (ctx) => {
  const tenantId = ctx.state.tenantId
  const courseId = ctx.params.id
  const result = await bookingService.getCourseBookings(courseId, tenantId)
  return success(result)
}))

/**
 * 签到核销（管理端）
 * POST /api/admin/bookings/:id/checkin
 */
router.post('/admin/:id/checkin', adminAuth, handle(async (ctx) => {
  const tenantId = ctx.state.tenantId
  const bookingId = ctx.params.id
  await bookingService.checkinBooking(bookingId, tenantId)
  return success(null, '签到成功')
}))

module.exports = router
