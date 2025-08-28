/**
 * 函数式预约业务服务
 */
const { validator, errors, utils, database } = require('../../core')
const bookingModel = require('./model')
const courseModel = require('../course/model')
const memberCardModel = require('../member-card/model')

const { 
  validate, required, custom 
} = validator

const { 
  BusinessError, throwIf 
} = errors

const { 
  getCurrentTime 
} = utils

const { getPagination } = database

/**
 * 预约数据验证规则
 */
const validateBookingCreate = (bookingData) => 
  validate(
    bookingData,
    required('course_id', '课程ID不能为空'),
    required('member_card_id', '会员卡ID不能为空')
  )

/**
 * 格式化预约信息
 */
const formatBookingInfo = (booking) => ({
  id: booking.id,
  user_id: booking.user_id,
  course_id: booking.course_id,
  tenant_id: booking.tenant_id,
  member_card_id: booking.member_card_id,
  status: booking.status,
  created_at: booking.created_at,
  updated_at: booking.updated_at,
  // 关联信息
  user_nickname: booking.nickname,
  user_avatar: booking.avatar_url,
  course_title: booking.course_title,
  teacher: booking.teacher,
  schedule_time: booking.schedule_time
})

/**
 * 检查预约条件
 */
const checkBookingConditions = async (userId, courseId, memberCardId, tenantId) => {
  // 检查课程是否存在且未满
  const course = await courseModel.findByIdAndTenant(courseId, tenantId)
  if (!course) {
    throw BusinessError('课程不存在')
  }

  if (await courseModel.isCourseFull(courseId)) {
    throw BusinessError('课程已满')
  }

  // 检查用户是否已预约该课程
  const hasBooked = await bookingModel.hasUserBookedCourse(userId, courseId)
  if (hasBooked) {
    throw BusinessError('您已预约该课程')
  }

  // 检查会员卡是否有效
  const memberCard = await memberCardModel.findByIdAndTenant(memberCardId, tenantId)
  if (!memberCard) {
    throw BusinessError('会员卡不存在')
  }

  if (memberCard.status !== 'active') {
    throw BusinessError('会员卡未激活或已过期')
  }

  if (memberCard.type === 'count' && memberCard.remaining_count <= 0) {
    throw BusinessError('会员卡次数不足')
  }

  return { course, memberCard }
}

/**
 * 业务逻辑函数
 */

/**
 * 创建预约
 */
const createBooking = async (userId, tenantId, bookingData) => {
  // 数据验证
  validateBookingCreate(bookingData)

  const { course_id, member_card_id } = bookingData

  // 检查预约条件
  await checkBookingConditions(userId, course_id, member_card_id, tenantId)

  // 创建预约数据
  const bookingCreateData = {
    user_id: userId,
    course_id: course_id,
    tenant_id: tenantId,
    member_card_id: member_card_id,
    status: 'booked',
    created_at: getCurrentTime(),
    updated_at: getCurrentTime()
  }

  // 使用事务处理预约创建和会员卡冻结
  // 这里简化处理，实际应该使用数据库事务
  const result = await bookingModel.create(bookingCreateData)
  
  if (!result.insertId) {
    throw BusinessError('预约创建失败')
  }

  // 更新课程预约人数
  await courseModel.updateBookedCount(course_id, 1)

  // 冻结会员卡次数（如果是次卡）
  // 这里需要实现会员卡冻结逻辑

  // 返回预约信息
  return await getBookingDetail(result.insertId, tenantId)
}

/**
 * 获取预约详情
 */
const getBookingDetail = async (bookingId, tenantId) => {
  const booking = await bookingModel.findById(bookingId)
  if (!booking) {
    throw BusinessError('预约不存在')
  }

  if (booking.tenant_id !== tenantId) {
    throw BusinessError('无权访问该预约')
  }

  return formatBookingInfo(booking)
}

/**
 * 获取用户预约列表
 */
const getUserBookings = async (userId, options = {}) => {
  const { page, size, offset } = getPagination(options.page, options.size)
  
  const bookings = await bookingModel.findByUserId(userId, {
    status: options.status,
    startDate: options.start_date,
    endDate: options.end_date
  })

  // 简单分页处理
  const total = bookings.length
  const list = bookings.slice(offset, offset + size)

  return {
    list: list.map(formatBookingInfo),
    total,
    page,
    size
  }
}

/**
 * 获取课程预约列表
 */
const getCourseBookings = async (courseId, tenantId) => {
  // 检查课程是否存在
  const course = await courseModel.findByIdAndTenant(courseId, tenantId)
  if (!course) {
    throw BusinessError('课程不存在')
  }

  const bookings = await bookingModel.findByCourseId(courseId)
  return bookings.map(formatBookingInfo)
}

/**
 * 取消预约
 */
const cancelBooking = async (bookingId, userId, tenantId) => {
  const booking = await bookingModel.findById(bookingId)
  if (!booking) {
    throw BusinessError('预约不存在')
  }

  if (booking.user_id !== userId) {
    throw BusinessError('无权取消该预约')
  }

  if (booking.tenant_id !== tenantId) {
    throw BusinessError('无权操作该预约')
  }

  if (booking.status !== 'booked') {
    throw BusinessError('只能取消已预约状态的课程')
  }

  // 更新预约状态
  await bookingModel.updateStatus(bookingId, 'cancelled')

  // 更新课程预约人数
  await courseModel.updateBookedCount(booking.course_id, -1)

  // 解冻会员卡次数（如果是次卡）
  // 这里需要实现会员卡解冻逻辑

  return true
}

/**
 * 签到核销
 */
const checkinBooking = async (bookingId, tenantId) => {
  const booking = await bookingModel.findById(bookingId)
  if (!booking) {
    throw BusinessError('预约不存在')
  }

  if (booking.tenant_id !== tenantId) {
    throw BusinessError('无权操作该预约')
  }

  if (booking.status !== 'booked') {
    throw BusinessError('只能签到了预约状态的课程')
  }

  // 更新预约状态
  await bookingModel.updateStatus(bookingId, 'attended')

  // 实际核销会员卡次数（如果是次卡）
  // 这里需要实现会员卡核销逻辑

  return true
}

/**
 * 获取今日用户预约
 */
const getTodayUserBookings = async (userId) => {
  const bookings = await bookingModel.findTodayBookingsByUser(userId)
  return bookings.map(formatBookingInfo)
}

module.exports = {
  createBooking,
  getBookingDetail,
  getUserBookings,
  getCourseBookings,
  cancelBooking,
  checkinBooking,
  getTodayUserBookings,
  
  // 导出验证函数供其他模块使用
  validateBookingCreate
}
