/**
 * 函数式课程业务服务
 */
const { validator, errors, utils, database } = require('../../core')
const courseModel = require('./model')

const { 
  validate, required, length, custom 
} = validator

const { 
  BusinessError, throwIf 
} = errors

const { 
  getCurrentTime, pick 
} = utils

const { getPagination } = database

/**
 * 课程数据验证规则
 */
const validateCourseCreate = (courseData) => 
  validate(
    courseData,
    required('title', '课程标题不能为空'),
    length('title', 1, 255, '课程标题长度应在1-255字符之间'),
    required('teacher', '老师姓名不能为空'),
    required('schedule_time', '课程时间不能为空'),
    required('capacity', '课程容量不能为空'),
    custom('capacity', (value) => value > 0, '课程容量必须大于0')
  )

const validateCourseUpdate = (updateData) =>
  validate(
    updateData,
    updateData.title ? length('title', 1, 255, '课程标题长度应在1-255字符之间') : (data) => data,
    updateData.capacity ? custom('capacity', (value) => value > 0, '课程容量必须大于0') : (data) => data
  )

/**
 * 格式化课程信息
 */
const formatCourseInfo = (course) => ({
  id: course.id,
  title: course.title,
  teacher: course.teacher,
  schedule_time: course.schedule_time,
  duration: course.duration,
  capacity: course.capacity,
  booked_count: course.booked_count,
  type: course.type,
  description: course.description,
  location: course.location,
  tenant_id: course.tenant_id,
  created_at: course.created_at,
  updated_at: course.updated_at
})

/**
 * 检查课程时间冲突
 */
const checkTimeConflict = async (tenantId, scheduleTime, duration, excludeId = null) => {
  const startTime = new Date(scheduleTime)
  const endTime = new Date(startTime.getTime() + (duration || 60) * 60000)
  
  let sql = `
    SELECT * FROM courses 
    WHERE tenant_id = ? AND (
      (schedule_time <= ? AND DATE_ADD(schedule_time, INTERVAL duration MINUTE) >= ?) OR
      (schedule_time <= ? AND DATE_ADD(schedule_time, INTERVAL duration MINUTE) >= ?) OR
      (schedule_time >= ? AND schedule_time <= ?)
    )
  `
  const params = [tenantId, startTime, startTime, endTime, endTime, startTime, endTime]
  
  if (excludeId) {
    sql += ' AND id != ?'
    params.push(excludeId)
  }
  
  const conflictingCourses = await courseModel.query(sql, params)
  return conflictingCourses.length > 0
}

/**
 * 业务逻辑函数
 */

/**
 * 获取课程列表
 */
const getCourseList = async (tenantId, options = {}) => {
  const { page, size, offset } = getPagination(options.page, options.size)
  
  const result = await courseModel.findCourseList({
    tenantId,
    keyword: options.keyword,
    teacher: options.teacher,
    type: options.type,
    startDate: options.start_date,
    endDate: options.end_date,
    offset,
    limit: size
  })
  
  return {
    list: result.list.map(formatCourseInfo),
    total: result.total,
    page,
    size
  }
}

/**
 * 获取课程详情
 */
const getCourseDetail = async (courseId, tenantId) => {
  const course = await courseModel.findByIdAndTenant(courseId, tenantId)
  if (!course) {
    throw BusinessError('课程不存在')
  }
  
  return formatCourseInfo(course)
}

/**
 * 创建课程
 */
const createCourse = async (tenantId, courseData) => {
  // 数据验证
  validateCourseCreate(courseData)
  
  // 检查时间冲突
  const hasConflict = await checkTimeConflict(
    tenantId, 
    courseData.schedule_time, 
    courseData.duration || 60
  )
  
  if (hasConflict) {
    throw BusinessError('该时间段已有其他课程安排')
  }
  
  // 创建课程数据
  const courseCreateData = {
    ...courseData,
    tenant_id: tenantId,
    booked_count: 0,
    created_at: getCurrentTime(),
    updated_at: getCurrentTime()
  }
  
  const result = await courseModel.create(courseCreateData)
  
  if (!result.insertId) {
    throw BusinessError('课程创建失败')
  }
  
  // 返回课程信息
  return await getCourseDetail(result.insertId, tenantId)
}

/**
 * 更新课程
 */
const updateCourse = async (courseId, tenantId, updateData) => {
  // 数据验证
  validateCourseUpdate(updateData)
  
  // 检查课程是否存在
  const course = await courseModel.findByIdAndTenant(courseId, tenantId)
  if (!course) {
    throw BusinessError('课程不存在')
  }
  
  // 如果更新时间，检查时间冲突
  if (updateData.schedule_time) {
    const hasConflict = await checkTimeConflict(
      tenantId, 
      updateData.schedule_time, 
      updateData.duration || course.duration,
      courseId
    )
    
    if (hasConflict) {
      throw BusinessError('该时间段已有其他课程安排')
    }
  }
  
  // 更新数据
  const updateFields = {
    ...updateData,
    updated_at: getCurrentTime()
  }
  
  await courseModel.update(courseId, updateFields)
  
  // 返回更新后的课程信息
  return await getCourseDetail(courseId, tenantId)
}

/**
 * 删除课程
 */
const deleteCourse = async (courseId, tenantId) => {
  // 检查课程是否存在
  const course = await courseModel.findByIdAndTenant(courseId, tenantId)
  if (!course) {
    throw BusinessError('课程不存在')
  }
  
  // 检查是否有预约
  if (course.booked_count > 0) {
    throw BusinessError('课程已有预约，无法删除')
  }
  
  await courseModel.remove(courseId)
  return true
}

/**
 * 获取今日课程
 */
const getTodayCourses = async (tenantId) => {
  const courses = await courseModel.findTodayCourses(tenantId)
  return courses.map(formatCourseInfo)
}

/**
 * 根据日期获取课程
 */
const getCoursesByDate = async (tenantId, date) => {
  const startDate = new Date(date + 'T00:00:00')
  const endDate = new Date(date + 'T23:59:59')
  
  const courses = await courseModel.findByDateRange(tenantId, startDate, endDate)
  return courses.map(formatCourseInfo)
}

module.exports = {
  getCourseList,
  getCourseDetail,
  createCourse,
  updateCourse,
  deleteCourse,
  getTodayCourses,
  getCoursesByDate,
  
  // 导出验证函数供其他模块使用
  validateCourseCreate,
  validateCourseUpdate
}
