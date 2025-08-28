/**
 * 函数式会员卡路由
 */
const router = require('koa-router')()
const { response, errors, Middleware } = require('../../core')
const memberCardService = require('./service')

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
 * 获取用户会员卡列表（小程序端）
 * GET /api/member-cards
 */
router.get('/', jwtAuth, handle(async (ctx) => {
  const userId = ctx.state.userId
  const tenantId = ctx.state.tenantId
  const result = await memberCardService.getUserMemberCards(userId, tenantId)
  return success(result)
}))

/**
 * 获取会员卡详情（小程序端）
 * GET /api/member-cards/:id
 */
router.get('/:id', jwtAuth, handle(async (ctx) => {
  const userId = ctx.state.userId
  const tenantId = ctx.state.tenantId
  const cardId = ctx.params.id
  const result = await memberCardService.getMemberCardDetail(cardId, tenantId)
  
  // 检查用户是否有权访问该会员卡
  if (result.user_id !== userId) {
    throw AuthError('无权访问该会员卡')
  }
  
  return success(result)
}))

/**
 * 获取会员卡列表（管理端）
 * GET /api/admin/member-cards
 */
router.get('/admin/list', adminAuth, handle(async (ctx) => {
  const tenantId = ctx.state.tenantId
  const options = {
    user_id: ctx.query.user_id,
    status: ctx.query.status,
    type: ctx.query.type,
    page: ctx.query.page,
    size: ctx.query.size
  }
  
  const result = await memberCardService.getMemberCardList(tenantId, options)
  return page(result.list, result.total, result.page, result.size)
}))

/**
 * 创建会员卡（管理端）
 * POST /api/admin/member-cards
 */
router.post('/admin', adminAuth, handle(async (ctx) => {
  const tenantId = ctx.state.tenantId
  const cardData = ctx.request.body
  const result = await memberCardService.createMemberCard(tenantId, cardData)
  return success(result, '会员卡创建成功')
}))

/**
 * 获取会员卡详情（管理端）
 * GET /api/admin/member-cards/:id
 */
router.get('/admin/:id', adminAuth, handle(async (ctx) => {
  const tenantId = ctx.state.tenantId
  const cardId = ctx.params.id
  const result = await memberCardService.getMemberCardDetail(cardId, tenantId)
  return success(result)
}))

/**
 * 激活会员卡（管理端）
 * POST /api/admin/member-cards/:id/activate
 */
router.post('/admin/:id/activate', adminAuth, handle(async (ctx) => {
  const tenantId = ctx.state.tenantId
  const cardId = ctx.params.id
  const result = await memberCardService.activateMemberCard(cardId, tenantId)
  return success(result, '会员卡激活成功')
}))

module.exports = router
