/**
 * 函数式课程路由
 */
const router = require('koa-router')()
const { response, errors, Middleware } = require('../../core')
const courseService = require('./service')

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
 * 获取课程列表（小程序端）
 * GET /api/courses
 */
router.get('/', jwtAuth, handle(async (ctx) => {
  const tenantId = ctx.state.tenantId
  const { date, page: pageNum, size } = ctx.query
  
  let courses
  if (date) {
    // 根据日期获取课程
    courses = await courseService.getCoursesByDate(tenantId, date)
  } else {
    // 获取今日课程
    courses = await courseService.getTodayCourses(tenantId)
  }
  
  return success(courses)
}))

/**
 * 获取课程详情（小程序端）
 * GET /api/courses/:id
 */
router.get('/:id', jwtAuth, handle(async (ctx) => {
  const tenantId = ctx.state.tenantId
  const courseId = ctx.params.id
  const result = await courseService.getCourseDetail(courseId, tenantId)
  return success(result)
}))

/**
 * 获取课程列表（管理端）
 * GET /api/admin/courses
 */
router.get('/admin/list', adminAuth, handle(async (ctx) => {
  const tenantId = ctx.state.tenantId
  const options = {
    page: ctx.query.page,
    size: ctx.query.size,
    keyword: ctx.query.keyword,
    teacher: ctx.query.teacher,
    type: ctx.query.type,
    start_date: ctx.query.start_date,
    end_date: ctx.query.end_date
  }
  
  const result = await courseService.getCourseList(tenantId, options)
  return page(result.list, result.total, result.page, result.size)
}))

/**
 * 创建课程（管理端）
 * POST /api/admin/courses
 */
router.post('/admin', adminAuth, handle(async (ctx) => {
  const tenantId = ctx.state.tenantId
  const courseData = ctx.request.body
  const result = await courseService.createCourse(tenantId, courseData)
  return success(result, '课程创建成功')
}))

/**
 * 获取课程详情（管理端）
 * GET /api/admin/courses/:id
 */
router.get('/admin/:id', adminAuth, handle(async (ctx) => {
  const tenantId = ctx.state.tenantId
  const courseId = ctx.params.id
  const result = await courseService.getCourseDetail(courseId, tenantId)
  return success(result)
}))

/**
 * 更新课程（管理端）
 * PUT /api/admin/courses/:id
 */
router.put('/admin/:id', adminAuth, handle(async (ctx) => {
  const tenantId = ctx.state.tenantId
  const courseId = ctx.params.id
  const updateData = ctx.request.body
  const result = await courseService.updateCourse(courseId, tenantId, updateData)
  return success(result, '课程更新成功')
}))

/**
 * 删除课程（管理端）
 * DELETE /api/admin/courses/:id
 */
router.delete('/admin/:id', adminAuth, handle(async (ctx) => {
  const tenantId = ctx.state.tenantId
  const courseId = ctx.params.id
  await courseService.deleteCourse(courseId, tenantId)
  return success(null, '课程删除成功')
}))

module.exports = router
