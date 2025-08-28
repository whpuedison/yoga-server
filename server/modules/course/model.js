/**
 * 函数式课程数据模型
 */
const { database } = require('../../core')

// 创建课程表的数据库操作函数
const courseDb = database.createDbOperations('courses')

/**
 * 根据日期范围查询课程列表
 */
const findByDateRange = async (tenantId, startDate, endDate) => {
  const sql = `
    SELECT * FROM courses 
    WHERE tenant_id = ? AND schedule_time BETWEEN ? AND ?
    ORDER BY schedule_time ASC
  `
  return await courseDb.query(sql, [tenantId, startDate, endDate])
}

/**
 * 根据ID和租户ID查询课程
 */
const findByIdAndTenant = async (id, tenantId) => {
  const sql = 'SELECT * FROM courses WHERE id = ? AND tenant_id = ?'
  return await courseDb.queryOne(sql, [id, tenantId])
}

/**
 * 查询课程列表（分页，支持关键词搜索）
 */
const findCourseList = async ({ tenantId, keyword, teacher, type, startDate, endDate, offset = 0, limit = 10 }) => {
  let whereClause = 'WHERE tenant_id = ?'
  const params = [tenantId]

  if (keyword) {
    whereClause += ' AND (title LIKE ? OR description LIKE ?)'
    const keywordPattern = `%${keyword}%`
    params.push(keywordPattern, keywordPattern)
  }

  if (teacher) {
    whereClause += ' AND teacher = ?'
    params.push(teacher)
  }

  if (type) {
    whereClause += ' AND type = ?'
    params.push(type)
  }

  if (startDate && endDate) {
    whereClause += ' AND schedule_time BETWEEN ? AND ?'
    params.push(startDate, endDate)
  }

  // 查询总数
  const countSql = `SELECT COUNT(*) as total FROM courses ${whereClause}`
  const countResult = await courseDb.queryOne(countSql, params)
  const total = countResult.total

  // 查询数据
  const dataSql = `
    SELECT id, title, teacher, schedule_time, duration, capacity, booked_count, type, description, location
    FROM courses 
    ${whereClause} 
    ORDER BY schedule_time DESC 
    LIMIT ? OFFSET ?
  `
  const list = await courseDb.query(dataSql, [...params, limit, offset])

  return { list, total }
}

/**
 * 更新课程预约人数
 */
const updateBookedCount = async (courseId, change) => {
  const sql = 'UPDATE courses SET booked_count = booked_count + ? WHERE id = ?'
  return await courseDb.query(sql, [change, courseId])
}

/**
 * 检查课程是否已满
 */
const isCourseFull = async (courseId) => {
  const sql = 'SELECT capacity, booked_count FROM courses WHERE id = ?'
  const course = await courseDb.queryOne(sql, [courseId])
  return course && course.booked_count >= course.capacity
}

/**
 * 获取今日课程
 */
const findTodayCourses = async (tenantId) => {
  const todayStart = new Date().toISOString().split('T')[0] + ' 00:00:00'
  const todayEnd = new Date().toISOString().split('T')[0] + ' 23:59:59'
  
  const sql = `
    SELECT * FROM courses 
    WHERE tenant_id = ? AND schedule_time BETWEEN ? AND ?
    ORDER BY schedule_time ASC
  `
  return await courseDb.query(sql, [tenantId, todayStart, todayEnd])
}

// 导出所有课程模型函数
module.exports = {
  // 基础CRUD操作
  ...courseDb,
  
  // 自定义查询函数
  findByDateRange,
  findByIdAndTenant,
  findCourseList,
  updateBookedCount,
  isCourseFull,
  findTodayCourses
}
