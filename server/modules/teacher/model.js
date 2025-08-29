/**
 * 老师数据模型
 */
const { database } = require('../../core')

// 创建老师表的数据库操作函数
const teacherDb = database.createDbOperations('teachers')

/**
 * 根据租户ID查询老师列表
 */
const findByTenantId = async (tenantId) => {
  const sql = 'SELECT * FROM teachers WHERE tenant_id = ? ORDER BY created_at DESC'
  return await teacherDb.query(sql, [tenantId])
}

/**
 * 根据ID和租户ID查询老师
 */
const findByIdAndTenant = async (id, tenantId) => {
  const sql = 'SELECT * FROM teachers WHERE id = ? AND tenant_id = ?'
  return await teacherDb.queryOne(sql, [id, tenantId])
}

/**
 * 根据姓名和租户ID查询老师
 */
const findByNameAndTenant = async (name, tenantId) => {
  const sql = 'SELECT * FROM teachers WHERE name = ? AND tenant_id = ?'
  return await teacherDb.queryOne(sql, [name, tenantId])
}

// 导出所有老师模型函数
module.exports = {
  // 基础CRUD操作
  ...teacherDb,
  
  // 自定义查询函数
  findByTenantId,
  findByIdAndTenant,
  findByNameAndTenant
}
