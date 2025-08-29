/**
 * 小程序用户路由 - 专为小程序端用户相关接口
 */
const router = require('koa-router')()
const { response, errors, Middleware } = require('../../core')
const userService = require('./service')
const bookingService = require('../booking/service')
const memberCardService = require('../member-card/service')

const { handle, success, page } = response
const { AuthError } = errors
const jwtAuth = Middleware.jwtAuth('mini-program')

/**
 * 获取当前用户信息
 * GET /api/v1/users/me
 */
router.get('/me', jwtAuth, handle(async (ctx) => {
  const userId = ctx.state.userId
  const result = await userService.getUserInfo(userId)
  return success(result)
}))

/**
 * 获取我的预约记录
 * GET /api/v1/users/me/bookings
 */
router.get('/me/bookings', jwtAuth, handle(async (ctx) => {
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
 * 获取我的会员卡
 * GET /api/v1/users/me/member-cards
 */
router.get('/me/member-cards', jwtAuth, handle(async (ctx) => {
  const userId = ctx.state.userId
  const tenantId = ctx.state.tenantId
  const result = await memberCardService.getUserMemberCards(userId, tenantId)
  return success(result)
}))

module.exports = router
