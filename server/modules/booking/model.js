/**
 * 函数式预约数据模型
 */
const { database } = require('../../core')

// 创建预约表的数据库操作函数
const bookingDb = database.createDbOperations('bookings')

/**
 * 根据用户ID和课程ID查找预约
 */
const findByUserAndCourse = async (userId, courseId) => {
  const sql = 'SELECT * FROM bookings WHERE user_id = ? AND course_id = ?'
  return await bookingDb.queryOne(sql, [userId, courseId])
}

/**
 * 根据用户ID查询预约列表
 */
const findByUserId = async (userId, options = {}) => {
  let whereClause = 'WHERE user_id = ?'
  const params = [userId]

  if (options.status) {
    whereClause += ' AND status = ?'
    params.push(options.status)
  }

  if (options.startDate && options.endDate) {
    whereClause += ' AND created_at BETWEEN ? AND ?'
    params.push(options.startDate, options.endDate)
  }

  const sql = `SELECT * FROM bookings ${whereClause} ORDER BY created_at DESC`
  return await bookingDb.query(sql, params)
}

/**
 * 根据课程ID查询预约列表
 */
const findByCourseId = async (courseId) => {
  const sql = `
    SELECT b.*, u.nickname, u.avatar_url 
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    WHERE b.course_id = ?
    ORDER BY b.created_at DESC
  `
  return await bookingDb.query(sql, [courseId])
}

/**
 * 查询预约列表（分页，支持筛选）
 */
const findBookingList = async ({ tenantId, courseId, userId, status, startDate, endDate, offset = 0, limit = 10 }) => {
  let whereClause = 'WHERE 1=1'
  const params = []

  if (tenantId) {
    whereClause += ' AND tenant_id = ?'
    params.push(tenantId)
  }

  if (courseId) {
    whereClause += ' AND course_id = ?'
    params.push(courseId)
  }

  if (userId) {
    whereClause += ' AND user_id = ?'
    params.push(userId)
  }

  if (status) {
    whereClause += ' AND status = ?'
    params.push(status)
  }

  if (startDate && endDate) {
    whereClause += ' AND created_at BETWEEN ? AND ?'
    params.push(startDate, endDate)
  }

  // 查询总数
  const countSql = `SELECT COUNT(*) as total FROM bookings ${whereClause}`
  const countResult = await bookingDb.queryOne(countSql, params)
  const total = countResult.total

  // 查询数据
  const dataSql = `
    SELECT b.*, u.nickname, u.avatar_url, c.title as course_title, c.teacher, c.schedule_time
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    JOIN courses c ON b.course_id = c.id
    ${whereClause} 
    ORDER BY b.created_at DESC 
    LIMIT ? OFFSET ?
  `
  const list = await bookingDb.query(dataSql, [...params, limit, offset])

  return { list, total }
}

/**
 * 更新预约状态
 */
const updateStatus = async (bookingId, status) => {
  const sql = 'UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?'
  return await bookingDb.query(sql, [status, bookingId])
}

/**
 * 检查用户是否已预约课程
 */
const hasUserBookedCourse = async (userId, courseId) => {
  const sql = 'SELECT id FROM bookings WHERE user_id = ? AND course_id = ? AND status IN ("booked", "attended")'
  const result = await bookingDb.queryOne(sql, [userId, courseId])
  return !!result
}

/**
 * 获取用户今日预约
 */
const findTodayBookingsByUser = async (userId) => {
  const todayStart = new Date().toISOString().split('T')[0] + ' 00:00:00'
  const todayEnd = new Date().toISOString().split('T')[0] + ' 23:59:59'
  
  const sql = `
    SELECT b.*, c.title, c.teacher, c.schedule_time, c.location
    FROM bookings b
    JOIN courses c ON b.course_id = c.id
    WHERE b.user_id = ? AND c.schedule_time BETWEEN ? AND ?
    ORDER BY c.schedule_time ASC
  `
  return await bookingDb.query(sql, [userId, todayStart, todayEnd])
}

// 导出所有预约模型函数
module.exports = {
  // 基础CRUD操作
  ...bookingDb,
  
  // 自定义查询函数
  findByUserAndCourse,
  findByUserId,
  findByCourseId,
  findBookingList,
  updateStatus,
  hasUserBookedCourse,
  findTodayBookingsByUser
}
