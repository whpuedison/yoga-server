/**
 * 会员卡模板路由
 */
const router = require('koa-router')()
const { response, errors, Middleware } = require('../../core')
const templateService = require('./service')

const { handle, success } = response
const { BusinessError } = errors

/**
 * 管理员认证中间件 - 用于管理端认证
 */
const adminAuth = Middleware.jwtAuth('admin')

/**
 * 获取会员卡模板列表（管理端）
 * GET /api/v1/member-card/list
 */
router.get('/list', adminAuth, handle(async (ctx) => {
  const tenantId = ctx.state.tenantId
  const result = await templateService.getTemplateList(tenantId)
  return success(result)
}))

/**
 * 创建会员卡模板（管理端）
 * POST /api/v1/member-card
 */
router.post('/', adminAuth, handle(async (ctx) => {
  const tenantId = ctx.state.tenantId
  const templateData = ctx.request.body
  const result = await templateService.createTemplate(tenantId, templateData)
  return success(result, '会员卡模板创建成功')
}))

module.exports = router
