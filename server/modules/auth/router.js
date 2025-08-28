/**
 * 函数式认证路由
 */
const router = require('koa-router')()
const { response, errors, Middleware } = require('../../core')
const authService = require('./service')

const { handle, success } = response
const { AuthError } = errors

/**
 * JWT认证中间件 - 用于小程序端认证
 */
const jwtAuth = Middleware.jwtAuth('mini-program')

/**
 * 微信登录
 * POST /api/auth/login
 */
router.post('/login', handle(async (ctx) => {
  const loginData = ctx.request.body
  const result = await authService.wechatLogin(loginData)
  return success(result)
}))

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
router.get('/me', jwtAuth, handle(async (ctx) => {
  const userId = ctx.state.userId
  const result = await authService.getCurrentUser(userId)
  return success(result)
}))

module.exports = router
