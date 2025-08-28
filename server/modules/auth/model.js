/**
 * 函数式认证数据模型
 */
const { database } = require('../../core')

// 创建相关表的数据库操作函数
const userDb = database.createDbOperations('users')
const tenantDb = database.createDbOperations('tenants')
const userTenantRelationDb = database.createDbOperations('user_tenant_relations')

/**
 * 根据openid查找用户
 */
const findByOpenId = async (openid) => {
  const sql = 'SELECT * FROM users WHERE openid = ?'
  return await userDb.queryOne(sql, [openid])
}

/**
 * 根据邀请码查找租户
 */
const findTenantByInviteCode = async (inviteCode) => {
  const sql = 'SELECT * FROM tenants WHERE invite_code = ?'
  return await tenantDb.queryOne(sql, [inviteCode])
}

/**
 * 检查用户-租户关联是否存在
 */
const checkUserTenantRelation = async (userId, tenantId) => {
  const sql = 'SELECT * FROM user_tenant_relations WHERE user_id = ? AND tenant_id = ?'
  return await userTenantRelationDb.queryOne(sql, [userId, tenantId])
}

/**
 * 创建用户-租户关联
 */
const createUserTenantRelation = async (userId, tenantId) => {
  const sql = 'INSERT INTO user_tenant_relations (user_id, tenant_id) VALUES (?, ?)'
  return await userTenantRelationDb.query(sql, [userId, tenantId])
}

/**
 * 创建用户
 */
const createUser = async (userData) => {
  const { openid, nickname, avatar_url } = userData
  const sql = 'INSERT INTO users (openid, nickname, avatar_url) VALUES (?, ?, ?)'
  return await userDb.query(sql, [openid, nickname, avatar_url])
}

/**
 * 获取用户关联的租户列表
 */
const getUserTenants = async (userId) => {
  const sql = `
    SELECT t.* FROM tenants t
    JOIN user_tenant_relations utr ON t.id = utr.tenant_id
    WHERE utr.user_id = ?
  `
  return await userTenantRelationDb.query(sql, [userId])
}

// 导出所有认证模型函数
module.exports = {
  // 基础CRUD操作
  ...userDb,
  ...tenantDb,
  ...userTenantRelationDb,
  
  // 自定义查询函数
  findByOpenId,
  findTenantByInviteCode,
  checkUserTenantRelation,
  createUserTenantRelation,
  createUser,
  getUserTenants
}
