/**
 * 函数式用户路由
 */
const router = require('koa-router')()
const { response, errors } = require('../../core')
const userService = require('./service')

const { handle, success } = response
const { AuthError } = errors

/**
 * 获取用户ID的工具函数
 */
const getUserId = (ctx) => {
  const userId = ctx.session?.userId || ctx.state.userId
  if (!userId) {
    throw AuthError('请先登录')
  }
  return userId
}

/**
 * 用户注册
 * POST /api/user/register
 */
router.post('/register', handle(async (ctx) => {
  const userData = ctx.request.body
  const result = await userService.register(userData)
  return success(result, '注册成功')
}))

/**
 * 用户登录
 * POST /api/user/login
 */
router.post('/login', handle(async (ctx) => {
  const loginData = ctx.request.body
  const result = await userService.login(loginData)
  
  // 设置session
  if (ctx.session) {
    ctx.session.userId = result.id
    ctx.session.username = result.username
  }
  
  return success(result, '登录成功')
}))

/**
 * 用户登出
 * POST /api/user/logout
 */
router.post('/logout', handle(async (ctx) => {
  // 清除session
  if (ctx.session) {
    ctx.session = null
  }
  
  return success(null, '登出成功')
}))

/**
 * 获取当前用户信息
 * GET /api/user/profile
 */
router.get('/profile', handle(async (ctx) => {
  const userId = getUserId(ctx)
  const result = await userService.getUserInfo(userId)
  return success(result)
}))

/**
 * 更新用户信息
 * PUT /api/user/profile
 */
router.put('/profile', handle(async (ctx) => {
  const userId = getUserId(ctx)
  const updateData = ctx.request.body
  const result = await userService.updateUser(userId, updateData)
  return success(result, '更新成功')
}))

/**
 * 修改密码
 * PUT /api/user/password
 */
router.put('/password', handle(async (ctx) => {
  const userId = getUserId(ctx)
  const passwordData = ctx.request.body
  await userService.changePassword(userId, passwordData)
  return success(null, '密码修改成功')
}))

/**
 * 用户列表（管理员接口）
 * GET /api/user/list
 */
router.get('/list', handle(async (ctx) => {
  // TODO: 添加管理员权限检查
  
  const options = {
    page: ctx.query.page,
    size: ctx.query.size,
    keyword: ctx.query.keyword,
    status: ctx.query.status
  }
  
  const result = await userService.getUserList(options)
  return response.page(result.list, result.total, result.page, result.size)
}))

/**
 * 根据ID获取用户信息（管理员接口）
 * GET /api/user/:id
 */
router.get('/:id', handle(async (ctx) => {
  // TODO: 添加管理员权限检查
  
  const userId = ctx.params.id
  const result = await userService.getUserInfo(userId)
  return success(result)
}))

module.exports = router
