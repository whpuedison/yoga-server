/**
 * 函数式会员卡数据模型
 */
const { database } = require('../../core')

// 创建会员卡表的数据库操作函数
const memberCardDb = database.createDbOperations('member_cards')

/**
 * 根据ID和租户ID查询会员卡
 */
const findByIdAndTenant = async (id, tenantId) => {
  const sql = 'SELECT * FROM member_cards WHERE id = ? AND tenant_id = ?'
  return await memberCardDb.queryOne(sql, [id, tenantId])
}

/**
 * 根据用户ID和租户ID查询会员卡列表
 */
const findByUserId = async (userId, tenantId) => {
  const sql = 'SELECT * FROM member_cards WHERE user_id = ? AND tenant_id = ?'
  return await memberCardDb.query(sql, [userId, tenantId])
}

/**
 * 查询会员卡列表（分页，支持筛选）
 */
const findMemberCardList = async ({ tenantId, userId, status, type, offset = 0, limit = 10 }) => {
  let whereClause = 'WHERE tenant_id = ?'
  const params = [tenantId]

  if (userId) {
    whereClause += ' AND user_id = ?'
    params.push(userId)
  }

  if (status) {
    whereClause += ' AND status = ?'
    params.push(status)
  }

  if (type) {
    whereClause += ' AND type = ?'
    params.push(type)
  }

  // 查询总数
  const countSql = `SELECT COUNT(*) as total FROM member_cards ${whereClause}`
  const countResult = await memberCardDb.queryOne(countSql, params)
  const total = countResult.total

  // 查询数据
  const dataSql = `
    SELECT mc.*, u.nickname, u.avatar_url, mct.name as template_name
    FROM member_cards mc
    LEFT JOIN users u ON mc.user_id = u.id
    LEFT JOIN member_card_types mct ON mc.type_id = mct.id
    ${whereClause} 
    ORDER BY mc.created_at DESC 
    LIMIT ? OFFSET ?
  `
  const list = await memberCardDb.query(dataSql, [...params, limit, offset])

  return { list, total }
}

/**
 * 激活会员卡
 */
const activateCard = async (cardId) => {
  const activatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
  let sql = 'UPDATE member_cards SET status = "active", activated_at = ?'
  const params = [activatedAt]

  // 如果是期限卡，计算到期时间
  sql += ', expires_at = DATE_ADD(?, INTERVAL valid_days DAY) WHERE id = ?'
  params.push(activatedAt, cardId)

  return await memberCardDb.query(sql, params)
}

/**
 * 更新冻结次数
 */
const updateFrozenCount = async (cardId, count) => {
  const sql = 'UPDATE member_cards SET frozen_count = frozen_count + ? WHERE id = ?'
  return await memberCardDb.query(sql, [count, cardId])
}

/**
 * 更新剩余次数
 */
const updateRemainingCount = async (cardId, count) => {
  const sql = 'UPDATE member_cards SET remaining_count = remaining_count + ? WHERE id = ?'
  return await memberCardDb.query(sql, [count, cardId])
}

/**
 * 更新已用次数
 */
const updateUsedCount = async (cardId, count) => {
  const sql = 'UPDATE member_cards SET used_count = used_count + ? WHERE id = ?'
  return await memberCardDb.query(sql, [count, cardId])
}

// 导出所有会员卡模型函数
module.exports = {
  // 基础CRUD操作
  ...memberCardDb,
  
  // 自定义查询函数
  findByIdAndTenant,
  findByUserId,
  findMemberCardList,
  activateCard,
  updateFrozenCount,
  updateRemainingCount,
  updateUsedCount
}
