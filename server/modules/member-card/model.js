/**
 * 会员卡模板数据模型
 */
const { database } = require('../../core')

// 创建会员卡模板表的数据库操作函数
const templateDb = database.createDbOperations('member_card_types')

/**
 * 根据租户ID查询会员卡模板列表
 */
const findByTenantId = async (tenantId) => {
  const sql = 'SELECT * FROM member_card_types WHERE tenant_id = ? ORDER BY created_at DESC'
  return await templateDb.query(sql, [tenantId])
}

/**
 * 根据ID和租户ID查询会员卡模板
 */
const findByIdAndTenant = async (id, tenantId) => {
  const sql = 'SELECT * FROM member_card_types WHERE id = ? AND tenant_id = ?'
  return await templateDb.queryOne(sql, [id, tenantId])
}

// 导出所有会员卡模板模型函数
module.exports = {
  // 基础CRUD操作
  ...templateDb,
  
  // 自定义查询函数
  findByTenantId,
  findByIdAndTenant
}
