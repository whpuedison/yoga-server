/**
 * 课程小程序端路由
 */
const router = require('koa-router')()
const { response, errors, Middleware } = require('../../core')
const courseService = require('./service')

const { handle, success } = response
const { AuthError, BusinessError } = errors

/**
 * JWT认证中间件 - 用于小程序端认证
 */
const jwtAuth = Middleware.jwtAuth('mini-program')

/**
 * 获取课程列表（小程序端）
 * GET /api/v1/courses
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
 * GET /api/v1/courses/:id
 */
router.get('/:id', jwtAuth, handle(async (ctx) => {
  const tenantId = ctx.state.tenantId
  const courseId = ctx.params.id
  const result = await courseService.getCourseDetail(courseId, tenantId)
  return success(result)
}))

module.exports = router
