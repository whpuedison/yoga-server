/**
 * 老师业务服务
 */
const { validator, errors, utils, database } = require('../../core')
const teacherModel = require('./model')

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
 * 老师数据验证规则
 */
const validateTeacherCreate = (teacherData) => 
  validate(
    teacherData,
    required('name', '老师姓名不能为空'),
    length('name', 1, 100, '老师姓名长度应在1-100字符之间'),
    custom('phone', (value) => !value || /^1[3-9]\d{9}$/.test(value), '手机号格式不正确'),
    length('specialty', 0, 255, '擅长领域长度不能超过255字符')
  )

const validateTeacherUpdate = (updateData) =>
  validate(
    updateData,
    updateData.name ? length('name', 1, 100, '老师姓名长度应在1-100字符之间') : (data) => data,
    updateData.phone ? custom('phone', (value) => /^1[3-9]\d{9}$/.test(value), '手机号格式不正确') : (data) => data,
    updateData.specialty ? length('specialty', 0, 255, '擅长领域长度不能超过255字符') : (data) => data
  )

/**
 * 格式化老师信息
 */
const formatTeacherInfo = (teacher) => ({
  id: teacher.id,
  name: teacher.name,
  phone: teacher.phone,
  specialty: teacher.specialty,
  description: teacher.description,
  status: teacher.status,
  tenant_id: teacher.tenant_id,
  created_at: teacher.created_at,
  updated_at: teacher.updated_at
})

/**
 * 检查老师姓名是否重复
 */
const checkTeacherNameExists = async (name, tenantId, excludeId = null) => {
  let sql = 'SELECT id FROM teachers WHERE name = ? AND tenant_id = ?'
  const params = [name, tenantId]
  
  if (excludeId) {
    sql += ' AND id != ?'
    params.push(excludeId)
  }
  
  const existingTeacher = await teacherModel.queryOne(sql, params)
  return !!existingTeacher
}

/**
 * 业务逻辑函数
 */

/**
 * 获取老师列表
 */
const getTeacherList = async (tenantId, options = {}) => {
  const { page, size, offset } = getPagination(options.page, options.size)
  
  const teachers = await teacherModel.findByTenantId(tenantId)
  
  return {
    list: teachers.map(formatTeacherInfo),
    total: teachers.length,
    page,
    size
  }
}

/**
 * 获取老师详情
 */
const getTeacherDetail = async (teacherId, tenantId) => {
  const teacher = await teacherModel.findByIdAndTenant(teacherId, tenantId)
  if (!teacher) {
    throw BusinessError('老师不存在')
  }
  
  return formatTeacherInfo(teacher)
}

/**
 * 创建老师
 */
const createTeacher = async (tenantId, teacherData) => {
  // 数据验证
  validateTeacherCreate(teacherData)

  // 检查老师姓名是否已存在
  const nameExists = await checkTeacherNameExists(teacherData.name, tenantId)
  if (nameExists) {
    throw BusinessError('老师姓名已存在')
  }

  // 创建老师数据
  const teacherCreateData = {
    ...teacherData,
    tenant_id: tenantId,
    status: teacherData.status || 'active',
    created_at: getCurrentTime(),
    updated_at: getCurrentTime()
  }

  const result = await teacherModel.create(teacherCreateData)
  
  if (!result.insertId) {
    throw BusinessError('老师创建失败')
  }

  // 返回老师信息
  return await getTeacherDetail(result.insertId, tenantId)
}

/**
 * 更新老师
 */
const updateTeacher = async (teacherId, tenantId, updateData) => {
  // 数据验证
  validateTeacherUpdate(updateData)

  // 检查老师是否存在
  const teacher = await teacherModel.findByIdAndTenant(teacherId, tenantId)
  if (!teacher) {
    throw BusinessError('老师不存在')
  }

  // 如果更新姓名，检查是否重复
  if (updateData.name && updateData.name !== teacher.name) {
    const nameExists = await checkTeacherNameExists(updateData.name, tenantId, teacherId)
    if (nameExists) {
      throw BusinessError('老师姓名已存在')
    }
  }

  // 更新数据
  const updateFields = {
    ...updateData,
    updated_at: getCurrentTime()
  }

  await teacherModel.update(teacherId, updateFields)

  // 返回更新后的老师信息
  return await getTeacherDetail(teacherId, tenantId)
}

/**
 * 删除老师
 */
const deleteTeacher = async (teacherId, tenantId) => {
  // 检查老师是否存在
  const teacher = await teacherModel.findByIdAndTenant(teacherId, tenantId)
  if (!teacher) {
    throw BusinessError('老师不存在')
  }

  // TODO: 检查老师是否有关联课程，如果有则不能删除

  await teacherModel.remove(teacherId)
  return true
}

module.exports = {
  getTeacherList,
  getTeacherDetail,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  
  // 导出验证函数供其他模块使用
  validateTeacherCreate,
  validateTeacherUpdate
}
