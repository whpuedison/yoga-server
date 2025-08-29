/**
 * 管理员认证路由
 */
const router = require('koa-router')()
const { response, errors, Middleware } = require('../../core')
const adminAuthService = require('./service')

const { handle, success } = response
const { AuthError } = errors

/**
 * JWT认证中间件 - 用于管理员认证
 */
const adminAuth = Middleware.jwtAuth('admin')

/**
 * 管理员登录
 * POST /api/v1/admin/auth/login
 */
router.post('/login', handle(async (ctx) => {
  const loginData = ctx.request.body
  const result = await adminAuthService.adminLogin(loginData)
  return success(result)
}))

/**
 * 管理员登出
 * POST /api/v1/admin/auth/logout
 */
router.post('/logout', adminAuth, handle(async (ctx) => {
  const result = await adminAuthService.adminLogout()
  return success(result, '登出成功')
}))

module.exports = router
