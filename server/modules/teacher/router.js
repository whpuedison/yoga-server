/**
 * 老师管理路由
 */
const router = require('koa-router')()
const { response, errors, Middleware } = require('../../core')
const teacherService = require('./service')

const { handle, success, page } = response
const { BusinessError } = errors

/**
 * 管理员认证中间件 - 用于管理端认证
 */
const adminAuth = Middleware.jwtAuth('admin')

/**
 * 获取老师列表（管理端）
 * GET /api/v1/admin/teachers
 */
router.get('/list', adminAuth, handle(async (ctx) => {
  const tenantId = ctx.state.tenantId
  const options = {
    page: ctx.query.page,
    size: ctx.query.size
  }
  
  const result = await teacherService.getTeacherList(tenantId, options)
  return page(result.list, result.total, result.page, result.size)
}))

/**
 * 获取老师详情（管理端）
 * GET /api/v1/admin/teachers/:id
 */
router.get('/:id', adminAuth, handle(async (ctx) => {
  const tenantId = ctx.state.tenantId
  const teacherId = ctx.params.id
  const result = await teacherService.getTeacherDetail(teacherId, tenantId)
  return success(result)
}))

/**
 * 创建老师（管理端）
 * POST /api/v1/admin/teachers
 */
router.post('/', adminAuth, handle(async (ctx) => {
  const tenantId = ctx.state.tenantId
  const teacherData = ctx.request.body
  const result = await teacherService.createTeacher(tenantId, teacherData)
  return success(result, '老师创建成功')
}))

/**
 * 更新老师（管理端）
 * PUT /api/v1/admin/teachers/:id
 */
router.put('/:id', adminAuth, handle(async (ctx) => {
  const tenantId = ctx.state.tenantId
  const teacherId = ctx.params.id
  const updateData = ctx.request.body
  const result = await teacherService.updateTeacher(teacherId, tenantId, updateData)
  return success(result, '老师更新成功')
}))

/**
 * 删除老师（管理端）
 * DELETE /api/v1/admin/teachers/:id
 */
router.delete('/:id', adminAuth, handle(async (ctx) => {
  const tenantId = ctx.state.tenantId
  const teacherId = ctx.params.id
  await teacherService.deleteTeacher(teacherId, tenantId)
  return success(null, '老师删除成功')
}))

module.exports = router
